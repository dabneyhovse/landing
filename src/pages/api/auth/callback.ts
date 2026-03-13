import type { APIRoute } from "astro";
import { exchangeCode } from "@/lib/keycloak";
import { encryptSession } from "@/middleware";

const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const expectedState = cookies.get("oauth_state")?.value;
  if (!expectedState) {
    return new Response("Missing OAuth state", { status: 400 });
  }

  // Clean up OAuth cookies
  cookies.delete("oauth_state", { path: "/" });

  const returnTo = cookies.get("return_to")?.value || "/";
  cookies.delete("return_to", { path: "/" });

  const tokenResponse = await exchangeCode(url, expectedState);
  const claims = tokenResponse.claims();
  if (!claims) {
    return new Response("No ID token in response", { status: 400 });
  }

  const sessionPayload = {
    sub: claims.sub,
    name: (claims.name as string) ?? claims.sub,
    preferred_username: (claims.preferred_username as string) ?? claims.sub,
    roles: (claims.backbone_roles as string[]) ?? [],
    picture: claims.picture as string | undefined,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const encrypted = encryptSession(sessionPayload);

  cookies.set("session", encrypted, {
    httpOnly: true,
    secure: url.protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return redirect(returnTo, 302);
};
