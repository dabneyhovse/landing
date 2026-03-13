import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Frosh, Comment, Vote } from "@/lib/db/models";
import { fetchUserProfile } from "@/lib/keycloak";

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
    for (let i = 0; i < comments.length; i++) {
      let from;
      if (comments[i].anon) {
        from = {
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
        from = { name, username, picture };
      }
      comments[i].dataValues.from = from;
    }

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
