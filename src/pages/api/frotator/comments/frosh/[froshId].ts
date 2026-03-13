import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Comment } from "@/lib/db/models";
import { fetchUserProfile } from "@/lib/keycloak";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const comments: any[] = await Comment.findAll({
      where: { froshId: ctx.params.froshId },
      include: [{ model: Comment }],
    });

    for (let i = 0; i < comments.length; i++) {
      if (comments[i].anon) {
        comments[i].dataValues.from = {
          picture: "/resources/images/defaultProfile.png",
          name: "",
          username: "",
        };
      } else {
        const profile = await fetchUserProfile(comments[i].userId);
        const { firstName, lastName, username, attributes } = profile as any;
        const name = `${firstName} ${lastName}`;
        const picture =
          attributes?.picture || "/resources/images/defaultProfile.png";
        comments[i].dataValues.from = { name, username, picture };
      }
    }

    return jsonResponse(comments);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
