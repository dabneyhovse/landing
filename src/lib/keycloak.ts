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
    {
      execute: [client.allowInsecureRequests],
    },
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

const ANONYMOUS_USER = {
  name: "Anonymous",
  username: "anonymous",
  picture: "/images/defaultProfile.png",
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
      picture: (profile.attributes as Record<string, string[]>)?.picture?.[0] ?? "/images/defaultProfile.png",
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
    const uuid = await getClientUuid();
    const res = await fetch(
      `${KC_API_URL}/clients/${uuid}/roles/frotator-secretary/users`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!res.ok || res.status === 403) {
      secretaryCache = { name: null, expiresAt: Date.now() + 60 * 1000 };
      return null;
    }

    const users = await res.json();
    const name =
      users.length > 0
        ? users[0].firstName || users[0].username
        : null;

    secretaryCache = { name, expiresAt: Date.now() + 5 * 60 * 1000 };
    return name;
  } catch {
    secretaryCache = { name: null, expiresAt: Date.now() + 60 * 1000 };
    return null;
  }
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
