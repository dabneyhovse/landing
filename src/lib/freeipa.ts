const IPA_HOST = import.meta.env.IPA_HOST;
const IPA_USER = import.meta.env.IPA_USER;
const IPA_PASSWORD = import.meta.env.IPA_PASSWORD;

let sessionCookie: { cookie: string; expiresAt: number } | null = null;

async function login(): Promise<string> {
  if (sessionCookie && Date.now() < sessionCookie.expiresAt) {
    return sessionCookie.cookie;
  }

  const res = await fetch(`${IPA_HOST}/ipa/session/login_password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: `${IPA_HOST}/ipa`,
    },
    body: new URLSearchParams({ user: IPA_USER, password: IPA_PASSWORD }),
    redirect: "manual",
  });

  if (!res.ok && res.status !== 303) {
    throw new Error(`FreeIPA login failed: ${res.status} ${res.statusText}`);
  }

  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error("FreeIPA login: no session cookie returned");

  const cookie = setCookie.split(";")[0];
  sessionCookie = {
    cookie,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15 min
  };
  return cookie;
}

async function ipaFetch(
  method: string,
  params: unknown[],
): Promise<unknown> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const cookie = await login();
    const res = await fetch(`${IPA_HOST}/ipa/session/json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: `${IPA_HOST}/ipa`,
        Cookie: cookie,
      },
      body: JSON.stringify({
        method,
        params,
        id: 0,
      }),
    });

    if (res.status === 401 && attempt === 0) {
      sessionCookie = null;
      continue;
    }

    if (!res.ok) {
      throw new Error(`FreeIPA API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (data.error) {
      throw new Error(`FreeIPA error: ${JSON.stringify(data.error)}`);
    }
    return data.result;
  }

  throw new Error("FreeIPA request failed after retry");
}

export interface NewUser {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  membership: "social" | "full";
}

export interface UserResult {
  username: string;
  success: boolean;
  error?: string;
  warning?: string;
}

type BatchCommand = { method: string; params: [unknown[], Record<string, unknown>] };
type BatchResult = {
  error?: unknown;
  result?: unknown;
  failed?: { member?: { user?: [string, string][] } };
};

async function ipaBatch(commands: BatchCommand[]): Promise<BatchResult[]> {
  if (commands.length === 0) return [];
  const result = (await ipaFetch("batch", [commands, {}])) as { results: BatchResult[] };
  return result.results;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return typeof error === "object" && error !== null
    ? (error as { message?: string }).message ?? JSON.stringify(error)
    : String(error);
}

function membershipGroup(user: NewUser): string {
  return user.membership === "full" ? "full-darbs" : "darbs";
}

export async function createUsers(users: NewUser[]): Promise<UserResult[]> {
  // FreeIPA batches aren't transactional and every command runs regardless of
  // earlier failures, so each step is its own batch over only the users that
  // passed the previous one. Otherwise a failed stageuser_add would still
  // activate a leftover stage entry, or add an existing user to a group.
  const results: UserResult[] = users.map((u) => ({ username: u.username, success: true }));
  const fail = (i: number, error: unknown) => {
    results[i] = { username: users[i].username, success: false, error: errorMessage(error) };
  };
  const pending = () => users.map((_, i) => i).filter((i) => results[i].success);

  try {
    // Step 1: stage each user
    const addResults = await ipaBatch(
      users.map((user) => ({
        method: "stageuser_add",
        params: [
          [user.username],
          {
            givenname: user.firstName,
            sn: user.lastName,
            cn: `${user.firstName} ${user.lastName}`,
            mail: user.email,
            random: true,
          },
        ],
      })),
    );
    addResults.forEach((r, i) => r.error && fail(i, r.error));

    // Step 2: activate the users we just staged
    const staged = pending();
    const activateResults = await ipaBatch(
      staged.map((i) => ({ method: "stageuser_activate", params: [[users[i].username], {}] })),
    );
    activateResults.forEach((r, j) => r.error && fail(staged[j], r.error));
    // Stage entries left behind by a failed activation would block a retry
    const orphaned = staged.filter((i) => !results[i].success);

    // Step 3: add newly created users to their membership groups, and clean up orphans
    const usersByGroup = new Map<string, number[]>();
    for (const i of pending()) {
      const group = membershipGroup(users[i]);
      usersByGroup.set(group, [...(usersByGroup.get(group) ?? []), i]);
    }
    const groups = [...usersByGroup.keys()];
    const finalResults = await ipaBatch([
      ...groups.map((group) => ({
        method: "group_add_member",
        params: [[group], { user: usersByGroup.get(group)!.map((i) => users[i].username) }] as BatchCommand["params"],
      })),
      ...orphaned.map((i) => ({
        method: "stageuser_del",
        params: [[users[i].username], {}] as BatchCommand["params"],
      })),
    ]).catch((err) => {
      // Accounts already exist at this point, so don't fail the whole request
      for (const i of pending()) {
        results[i].warning = `Not added to ${membershipGroup(users[i])}: ${errorMessage(err)}`;
      }
      return [];
    });

    // Account creation already succeeded, so group failures are warnings
    groups.forEach((group, g) => {
      const r = finalResults[g];
      if (!r) return;
      const members = usersByGroup.get(group)!;
      if (r.error) {
        for (const i of members) results[i].warning = `Not added to ${group}: ${errorMessage(r.error)}`;
        return;
      }
      // group_add_member reports per-member failures here instead of erroring
      for (const [username, reason] of r.failed?.member?.user ?? []) {
        const i = members.find((m) => users[m].username === username.toLowerCase());
        if (i !== undefined) results[i].warning = `Not added to ${group}: ${reason}`;
      }
    });
    finalResults.slice(groups.length).forEach((r, j) => {
      if (r.error) {
        console.error(`[freeipa] Failed to clean up staged user ${users[orphaned[j]].username}:`, r.error);
      }
    });
  } catch (err) {
    // A whole batch failed; anything not already resolved is unknown, so report it as failed
    for (const i of pending()) fail(i, err);
  }

  return results;
}
