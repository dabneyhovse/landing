import type { APIRoute } from "astro";
import { randomBytes } from "node:crypto";
import { getAuthorizationUrl } from "@/lib/keycloak";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  const returnTo = url.searchParams.get("returnTo") || "/";
  const state = randomBytes(16).toString("hex");
  const isSecure = url.protocol === "https:";

  cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600, // 10 minutes
  });

  cookies.set("return_to", returnTo, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const redirectUri = `${url.origin}/api/auth/callback`;
  const authUrl = await getAuthorizationUrl(redirectUri, state);
  return redirect(authUrl, 302);
};
