import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Comment } from "@/lib/db/models";
import { fetchKeycloakUser } from "@/lib/keycloak";
import { DEFAULT_PROFILE_IMAGE } from "@/lib/constants";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const comments: any[] = await Comment.findAll({
      where: { froshId: ctx.params.froshId },
      include: [{ model: Comment }],
    });

    await Promise.all(
      comments.map(async (comment: any) => {
        if (comment.anon) {
          comment.dataValues.from = { picture: DEFAULT_PROFILE_IMAGE, name: "", username: "" };
        } else {
          comment.dataValues.from = await fetchKeycloakUser(comment.userId);
        }
      }),
    );

    return jsonResponse(comments);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
