import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Vote } from "@/lib/db/models";

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const body = await ctx.request.json();

    if (body.favorite) {
      await Vote.findOrCreate({
        where: {
          userId: ctx.locals.user!.sub,
          frotatorFroshId: body.froshId,
          approve: true,
        },
      });
    } else {
      const vote = await Vote.findOne({
        where: {
          userId: ctx.locals.user!.sub,
          frotatorFroshId: body.froshId,
        },
      });
      if (vote) await vote.destroy();
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
