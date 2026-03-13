import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Comment } from "@/lib/db/models";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const comment = await Comment.findByPk(ctx.params.commentId);
    if (!comment) return new Response(null, { status: 404 });
    return jsonResponse(comment);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "backbone-admin");
  if (authError) return authError;

  try {
    const comment = await Comment.findByPk(ctx.params.commentId);
    if (!comment) return new Response(null, { status: 404 });
    await comment.destroy();
    return new Response(null, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
