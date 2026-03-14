import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Frosh, Comment, Vote } from "@/lib/db/models";
import { fetchKeycloakUser } from "@/lib/keycloak";
import { DEFAULT_PROFILE_IMAGE } from "@/lib/constants";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const frosh: any = await Frosh.findByPk(ctx.params.froshId, {
      attributes: [
        "firstName",
        "lastName",
        "preferredName",
        "pronouns",
        "image",
        "bio",
        "id",
        "dinnerGroup",
        "anagram",
      ],
      include: [
        { model: Comment, where: { private: false }, required: false },
      ],
    });

    if (!frosh) {
      return new Response(null, { status: 404 });
    }

    frosh.dataValues.displayName = frosh.safeName();

    const comments = frosh["frotator-comments"];
    await Promise.all(
      comments.map(async (comment: any) => {
        if (comment.anon) {
          comment.dataValues.from = { picture: DEFAULT_PROFILE_IMAGE, name: "", username: "" };
        } else {
          comment.dataValues.from = await fetchKeycloakUser(comment.userId);
        }
      }),
    );

    const vote = await Vote.findOne({
      where: {
        userId: ctx.locals.user!.sub,
        frotatorFroshId: ctx.params.froshId,
      },
    });
    if (vote) {
      frosh.dataValues.favorite = true;
    }

    return jsonResponse(frosh);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
