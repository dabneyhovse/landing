import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { isFrotatorEnabled, setFrotatorEnabled } from "@/lib/frotatorConfig";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user);
  if (authError) return authError;

  const enabled = await isFrotatorEnabled();
  return jsonResponse({ enabled });
};

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-admin");
  if (authError) return authError;

  try {
    const body = await ctx.request.json();
    if (typeof body.enabled !== "boolean") {
      return jsonResponse({ error: "enabled must be a boolean" }, 400);
    }

    await setFrotatorEnabled(body.enabled);
    return jsonResponse({ enabled: body.enabled });
  } catch {
    return jsonResponse({ error: "Invalid request body" }, 400);
  }
};
