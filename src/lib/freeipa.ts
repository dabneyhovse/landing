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
}

export async function createUsers(users: NewUser[]): Promise<UserResult[]> {
  const batchMethods: { method: string; params: [unknown[], Record<string, unknown>] }[] = [];
  const userIndexMap: { username: string; startIdx: number; commandCount: number }[] = [];

  for (const user of users) {
    const startIdx = batchMethods.length;
    let commandCount = 0;

    // 1. Stage the user
    batchMethods.push({
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
    });
    commandCount++;

    // 2. Activate the staged user
    batchMethods.push({
      method: "stageuser_activate",
      params: [[user.username], {}],
    });
    commandCount++;

    // 3. Add to membership group
    const group = user.membership === "full" ? "full-darbs" : "darbs";
    batchMethods.push({
      method: "group_add_member",
      params: [[group], { user: [user.username] }],
    });
    commandCount++;

    userIndexMap.push({ username: user.username, startIdx, commandCount });
  }

  // Execute batch
  let batchResults: { error?: unknown; result?: unknown }[];
  try {
    const result = await ipaFetch("batch", [
      batchMethods,
      {},
    ]) as { results: { error?: unknown; result?: unknown }[] };
    batchResults = result.results;
  } catch (err) {
    // If the entire batch fails, mark all users as failed
    return users.map((u) => ({
      username: u.username,
      success: false,
      error: err instanceof Error ? err.message : "Batch request failed",
    }));
  }

  // Parse per-user results
  return userIndexMap.map(({ username, startIdx, commandCount }) => {
    const userResults = batchResults.slice(startIdx, startIdx + commandCount);
    const firstError = userResults.find((r) => r.error);
    if (firstError) {
      const errMsg =
        typeof firstError.error === "object" && firstError.error !== null
          ? (firstError.error as { message?: string }).message ?? JSON.stringify(firstError.error)
          : String(firstError.error);
      return { username, success: false, error: errMsg };
    }
    return { username, success: true };
  });
}
