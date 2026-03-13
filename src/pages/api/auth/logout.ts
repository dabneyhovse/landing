import type { APIRoute } from "astro";
import { getEndSessionUrl } from "@/lib/keycloak";

export const GET: APIRoute = async ({ url, cookies, redirect }) => {
  cookies.delete("session", { path: "/" });

  const postLogoutUri = url.origin;
  const endSessionUrl = await getEndSessionUrl(postLogoutUri);
  return redirect(endSessionUrl, 302);
};
