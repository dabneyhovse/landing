import type { APIRoute } from "astro";
import { Op } from "sequelize";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Frosh } from "@/lib/db/models";

function attachDisplayNames(froshList: any[]) {
  froshList.forEach((f: any) => {
    f.dataValues.displayName = f.safeName();
  });
}

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-bigbad");
  if (authError) return authError;

  try {
    const frosh = await Frosh.findAll({
      where: { [Op.not]: { rank: -1 } },
      attributes: [
        "firstName",
        "lastName",
        "preferredName",
        "image",
        "id",
        "rank",
        "anagram",
      ],
      order: [["rank", "DESC"]],
    });

    attachDisplayNames(frosh);
    return jsonResponse(frosh);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-bigbad");
  if (authError) return authError;

  try {
    const body = await ctx.request.json();
    const froshId = body.froshId;
    const rank = body.rank;

    const oldFrosh: any = await Frosh.findOne({ where: { id: froshId } });
    if (!oldFrosh) return jsonResponse({ error: "Frosh not found" }, 404);

    const moveUp = rank > oldFrosh.rank;

    if (rank === 0) {
      const shift: any[] = await Frosh.findAll({
        where: {
          [Op.not]: { rank: -1 },
          rank: { [Op.gte]: 0 },
        },
        attributes: ["id", "rank"],
        order: [
          ["rank", "DESC"],
          ["id", "ASC"],
        ],
      });
      for (const s of shift) {
        s.rank = s.rank + 1;
        await s.save();
      }
    } else if (rank !== -1) {
      const frosh: any = await Frosh.findOne({ where: { rank } });
      if (frosh) {
        frosh.rank = frosh.rank + (moveUp ? -1 : 1);
        await frosh.save();
      }
    }

    const newFrosh: any = await Frosh.findOne({ where: { id: froshId } });
    newFrosh.rank = rank;
    await newFrosh.save();

    const updatedRanking = await Frosh.findAll({
      where: { [Op.not]: { rank: -1 } },
      attributes: [
        "firstName",
        "lastName",
        "preferredName",
        "anagram",
        "image",
        "id",
        "rank",
      ],
      order: [
        ["rank", "DESC"],
        ["id", "ASC"],
      ],
    });

    attachDisplayNames(updatedRanking);
    return jsonResponse(updatedRanking);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
