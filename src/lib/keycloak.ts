import * as client from "openid-client";

const ISSUER_BASE_URL = import.meta.env.ISSUER_BASE_URL;
const KC_CLIENT_ID = import.meta.env.KC_CLIENT_ID;
const KC_CLIENT_SECRET = import.meta.env.KC_CLIENT_SECRET;
const KC_API_URL = import.meta.env.KC_API_URL;

let oidcConfig: client.Configuration | null = null;

async function getConfig(): Promise<client.Configuration> {
  if (oidcConfig) return oidcConfig;
  const issuer = new URL(ISSUER_BASE_URL);
  oidcConfig = await client.discovery(
    issuer,
    KC_CLIENT_ID,
    KC_CLIENT_SECRET,
    client.ClientSecretBasic(KC_CLIENT_SECRET),
  );
  return oidcConfig;
}

export async function getAuthorizationUrl(
  redirectUri: string,
  state: string,
): Promise<string> {
  const config = await getConfig();
  const url = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: "openid profile",
    state,
  });
  return url.href;
}

export async function exchangeCode(
  currentUrl: URL,
  expectedState: string,
): Promise<client.TokenEndpointResponse & client.TokenEndpointResponseHelpers> {
  const config = await getConfig();
  return client.authorizationCodeGrant(config, currentUrl, {
    expectedState,
  });
}

let serviceToken: { token: string; expiresAt: number } | null = null;

async function getServiceToken(): Promise<string> {
  if (serviceToken && Date.now() < serviceToken.expiresAt) {
    return serviceToken.token;
  }
  const config = await getConfig();
  const response = await client.clientCredentialsGrant(config, {
    scope: "openid",
  });
  const expiresIn = response.expires_in ?? 300;
  serviceToken = {
    token: response.access_token,
    expiresAt: Date.now() + (expiresIn - 30) * 1000,
  };
  return serviceToken.token;
}

export async function fetchUserProfile(
  userId: string,
): Promise<Record<string, unknown>> {
  const url = `${KC_API_URL}/users/${userId}`;

  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getServiceToken();
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401 && attempt === 0) {
      // Invalidate cached token and retry
      serviceToken = null;
      continue;
    }

    if (!res.ok) {
      throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
    }

    return res.json();
  }

  throw new Error("Failed to fetch user profile after retry");
}

import { DEFAULT_PROFILE_IMAGE } from "@/lib/constants";

const ANONYMOUS_USER = {
  name: "Anonymous",
  username: "anonymous",
  picture: DEFAULT_PROFILE_IMAGE,
};

export async function fetchKeycloakUser(
  userId: string,
): Promise<{ name: string; username: string; picture: string }> {
  if (!userId) return ANONYMOUS_USER;

  try {
    const profile = await fetchUserProfile(userId);
    const first = (profile.firstName as string) ?? "";
    const last = (profile.lastName as string) ?? "";
    const name = [first, last].filter(Boolean).join(" ") || (profile.username as string);
    return {
      name,
      username: profile.username as string,
      picture: (profile.attributes as Record<string, string[]>)?.picture?.[0] ?? DEFAULT_PROFILE_IMAGE,
    };
  } catch {
    return ANONYMOUS_USER;
  }
}

let clientUuid: string | null = null;

async function getClientUuid(): Promise<string> {
  if (clientUuid) return clientUuid;
  const token = await getServiceToken();
  const res = await fetch(
    `${KC_API_URL}/clients?clientId=${encodeURIComponent(KC_CLIENT_ID)}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Client lookup error: ${res.status}`);
  const clients = await res.json();
  clientUuid = clients[0].id;
  return clientUuid!;
}

let secretaryCache: { name: string | null; expiresAt: number } | null = null;

export async function getSecretaryName(): Promise<string | null> {
  if (secretaryCache && Date.now() < secretaryCache.expiresAt) {
    return secretaryCache.name;
  }

  try {
    const token = await getServiceToken();
    const headers = { Authorization: `Bearer ${token}` };

    // Try client role first (direct assignment)
    const uuid = await getClientUuid();
    const clientRes = await fetch(
      `${KC_API_URL}/clients/${uuid}/roles/frotator-secretary/users`,
      { headers },
    );
    let users = clientRes.ok ? await clientRes.json() : [];

    // Fall back to realm role (composite assignment)
    if (users.length === 0) {
      const realmRes = await fetch(
        `${KC_API_URL}/roles/Secretary/users`,
        { headers },
      );
      if (realmRes.ok) users = await realmRes.json();
    }

    const name =
      users.length > 0
        ? users[0].firstName || users[0].username
        : null;

    secretaryCache = { name, expiresAt: Date.now() + 24 * 60 * 60 * 1000 };
    return name;
  } catch {
    secretaryCache = { name: null, expiresAt: Date.now() + 60 * 1000 };
    return null;
  }
}

// --- Admin user management ---

async function kcAdminFetch(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const token = await getServiceToken();
    const res = await fetch(`${KC_API_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (res.status === 401 && attempt === 0) {
      serviceToken = null;
      continue;
    }

    return res;
  }
  throw new Error("Keycloak admin request failed after retry");
}

export interface KcUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
}

export async function searchUsers(
  query: string,
  first = 0,
  max = 20,
): Promise<KcUser[]> {
  const params = new URLSearchParams({
    search: query,
    first: String(first),
    max: String(max),
  });
  const res = await kcAdminFetch(`/users?${params}`);
  if (!res.ok) throw new Error(`searchUsers error: ${res.status}`);
  return res.json();
}

export async function getUserGroups(
  userId: string,
): Promise<{ id: string; name: string; path: string }[]> {
  const res = await kcAdminFetch(`/users/${userId}/groups`);
  if (!res.ok) throw new Error(`getUserGroups error: ${res.status}`);
  return res.json();
}

const groupIdCache = new Map<string, string>();

export async function findGroupByName(name: string): Promise<string> {
  const cached = groupIdCache.get(name);
  if (cached) return cached;

  const res = await kcAdminFetch(
    `/groups?search=${encodeURIComponent(name)}&exact=true`,
  );
  if (!res.ok) throw new Error(`findGroupByName error: ${res.status}`);
  const groups = await res.json();
  if (!groups.length) throw new Error(`Group "${name}" not found`);
  groupIdCache.set(name, groups[0].id);
  return groups[0].id;
}

export async function addUserToGroup(
  userId: string,
  groupId: string,
): Promise<void> {
  const res = await kcAdminFetch(`/users/${userId}/groups/${groupId}`, {
    method: "PUT",
  });
  if (!res.ok) throw new Error(`addUserToGroup error: ${res.status}`);
}

export async function removeUserFromGroup(
  userId: string,
  groupId: string,
): Promise<void> {
  const res = await kcAdminFetch(`/users/${userId}/groups/${groupId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error(`removeUserFromGroup error: ${res.status}`);
}

export async function sendPasswordResetEmail(userId: string): Promise<void> {
  const res = await kcAdminFetch(`/users/${userId}/execute-actions-email`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(["UPDATE_PASSWORD"]),
  });
  if (!res.ok) throw new Error(`sendPasswordResetEmail error: ${res.status}`);
}

export async function findUserByUsername(
  username: string,
): Promise<KcUser | null> {
  const params = new URLSearchParams({
    username,
    exact: "true",
  });
  const res = await kcAdminFetch(`/users?${params}`);
  if (!res.ok) throw new Error(`findUserByUsername error: ${res.status}`);
  const users: KcUser[] = await res.json();
  return users.length > 0 ? users[0] : null;
}

export async function getEndSessionUrl(
  postLogoutRedirectUri: string,
  idTokenHint?: string,
): Promise<string> {
  const config = await getConfig();
  const params: Record<string, string> = {
    post_logout_redirect_uri: postLogoutRedirectUri,
  };
  if (idTokenHint) params.id_token_hint = idTokenHint;
  return client.buildEndSessionUrl(config, params).href;
}
