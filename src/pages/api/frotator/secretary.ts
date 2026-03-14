import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { getSecretaryName } from "@/lib/keycloak";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const name = await getSecretaryName();
  return jsonResponse({ name });
};
