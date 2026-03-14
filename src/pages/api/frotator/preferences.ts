import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { UserPreference } from "@/lib/db/models";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const pref = await UserPreference.findOne({
    where: { userId: ctx.locals.user!.sub },
  });

  return jsonResponse({
    spamToasts: pref?.getDataValue("spamToasts") ?? false,
  });
};

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const body = await ctx.request.json();
  const [pref] = await UserPreference.upsert({
    userId: ctx.locals.user!.sub,
    spamToasts: body.spamToasts,
  });

  return jsonResponse({
    spamToasts: pref.getDataValue("spamToasts"),
  });
};
