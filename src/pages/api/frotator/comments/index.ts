import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Comment } from "@/lib/db/models";
import { DEFAULT_PROFILE_IMAGE } from "@/lib/constants";

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const body = await ctx.request.json();

    const comment: any = await Comment.create({
      text: body.text,
      anon: body.anon,
      froshId: body.froshId,
      userId: body.userId,
      private: false,
    });

    if (comment.anon) {
      comment.dataValues.from = {
        picture: DEFAULT_PROFILE_IMAGE,
        preferred_username: "",
      };
    } else {
      comment.dataValues.from = {
        sub: ctx.locals.user!.sub,
        name: ctx.locals.user!.name,
        picture: ctx.locals.user!.picture || DEFAULT_PROFILE_IMAGE,
      };
    }

    return jsonResponse(comment);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
