import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { FlashcardStar } from "@/lib/db/models";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const stars = await FlashcardStar.findAll({
    where: { userId: ctx.locals.user!.sub },
    attributes: ["froshId"],
  });
  return jsonResponse(stars.map((star) => star.getDataValue("froshId")));
};

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const { froshId, starred } = await ctx.request.json();
    if (!Number.isInteger(froshId) || froshId <= 0 || typeof starred !== "boolean") {
      return jsonResponse({ error: "Invalid flashcard star" }, 400);
    }

    const where = { userId: ctx.locals.user!.sub, froshId };
    if (starred) {
      await FlashcardStar.findOrCreate({ where });
    } else {
      await FlashcardStar.destroy({ where });
    }
    return new Response(null, { status: 204 });
  } catch {
    return jsonResponse({ error: "Unable to save flashcard star" }, 500);
  }
};
