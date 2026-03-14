import type { APIRoute } from "astro";
import { Op, Sequelize } from "sequelize";
import { Readable } from "stream";
import { parse } from "csv-parse";
import { requireRole, jsonResponse } from "@/lib/auth";
import { Frosh, Comment, Vote } from "@/lib/db/models";
import { random } from "@/lib/db/db";

const USERS_PER_PAGE = 20;

function paginate(page: number) {
  const offset = (page - 1) * USERS_PER_PAGE;
  return { offset, limit: USERS_PER_PAGE };
}

const SORT_OPTIONS: Record<number, any> = {
  0: [["id", "ASC"]],
  1: [
    ["lastName", "ASC"],
    ["preferredName", "ASC"],
  ],
  2: [
    [Sequelize.col("commentsCount"), "DESC"],
    ["id", "ASC"],
  ],
  3: [
    [Sequelize.col("commentsCount"), "ASC"],
    ["id", "ASC"],
  ],
  4: [
    [Sequelize.col("favoritesCount"), "DESC"],
    ["id", "ASC"],
  ],
  5: [
    [Sequelize.col("favoritesCount"), "ASC"],
    ["id", "ASC"],
  ],
  6: random(),
};

const updateable = [
  "firstName",
  "lastName",
  "preferredName",
  "pronouns",
  "year",
  "email",
  "groupName",
  "anagram",
  "image",
  "rank",
  "bioPDF",
  "bio",
  "dinnerGroup",
  "uuid",
];

function parseCsvBuffer(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    Readable.from(buffer)
      .pipe(
        parse({
          delimiter: ",",
          encoding: "utf-8",
          columns: (cols: string[]) =>
            cols.map((c) => (c.includes("email") ? "email" : c)),
        })
      )
      .on("data", (row: Record<string, string>) => rows.push(row))
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const searchParam = ctx.url.searchParams.get("search");
    const search = searchParam ? JSON.parse(searchParam) : {};

    let include: any[] = [
      ...(search.sort == 2 || search.sort == 3
        ? [
            {
              model: Comment,
              attributes: [],
              duplicating: false,
              required: true,
            },
          ]
        : []),
      ...(search.sort == 4 || search.sort == 5
        ? [
            {
              model: Vote,
              attributes: [],
              duplicating: false,
              required: search.sort == 4 || search.sort == 5,
            },
          ]
        : []),
    ];

    let where: any = {};

    if (search.name) {
      where[Op.or] = [
        { firstName: { [Op.iLike]: `%${search.name}%` } },
        { preferredName: { [Op.iLike]: `%${search.name}%` } },
        { lastName: { [Op.iLike]: `%${search.name}%` } },
      ];
    }

    if (search.anagram) {
      where.anagram = { [Op.iLike]: `%${search.anagram}%` };
    }

    if (search["bio-hometown"]) {
      where["bio.hometown"] = {
        [Op.iLike]: `%${search["bio-hometown"]}%`,
      };
    }
    if (search["bio-major"]) {
      where["bio.major"] = { [Op.iLike]: `%${search["bio-major"]}%` };
    }
    if (search["bio-hobbies"]) {
      where["bio.hobbies"] = {
        [Op.iLike]: `%${search["bio-hobbies"]}%`,
      };
    }
    if (search["bio-clubs"]) {
      where["bio.clubs"] = { [Op.iLike]: `%${search["bio-clubs"]}%` };
    }
    if (search["bio-funfact"]) {
      where["bio.funfact"] = {
        [Op.iLike]: `%${search["bio-funfact"]}%`,
      };
    }

    if (search.dinnerGroup) {
      if (search.dinnerGroup !== "any") {
        where.dinnerGroup = search.dinnerGroup;
      }
    }

    if (search.event) {
      include = [...include, { model: Comment, attributes: "id" }];
    }

    const cards = ctx.url.searchParams.get("cards");
    const pageNum = ctx.url.searchParams.get("pageNum");

    const query: any = {
      where,
      include,
      ...(cards || search.dinnerGroup !== "any" || search.only_my_favorites
        ? {}
        : paginate(Number(pageNum) || 1)),
      attributes: {
        include: [
          ...(search.sort == 2 || search.sort == 3
            ? [
                [
                  Sequelize.fn(
                    "COUNT",
                    Sequelize.col('"frotator-comments".id')
                  ),
                  "commentsCount",
                ],
              ]
            : []),
          ...(search.sort == 4 || search.sort == 5
            ? [
                [
                  Sequelize.fn(
                    "COUNT",
                    Sequelize.col('"frotator-votes".id')
                  ),
                  "favoritesCount",
                ],
              ]
            : []),
          "pronouns",
          "image",
          "firstName",
          "lastName",
          "preferredName",
          "bio",
          "id",
          "dinnerGroup",
          "anagram",
        ],
      },
    };

    if (search.sort) {
      query.order = SORT_OPTIONS[search.sort];
    }

    query.group = ["frotator-frosh.id"];

    const frosh = await Frosh.findAndCountAll(query);

    if (search.only_my_favorites) {
      const favoriteVotes = await Vote.findAll({
        where: { userId: ctx.locals.user!.sub },
      });
      const favoriteIds = [...favoriteVotes].map(
        (v: any) => v.dataValues.frotatorFroshId
      );
      frosh.rows = frosh.rows.filter((f: any) =>
        favoriteIds.includes(f.id)
      );
    }

    frosh.count = (frosh.count as any).length;
    frosh.count = Math.ceil((frosh.count as number) / USERS_PER_PAGE);
    if (search.dinnerGroup !== "any" || search.only_my_favorites) {
      frosh.count = 1;
    }

    frosh.rows.forEach((f: any) => {
      f.dataValues.displayName = f.safeName();
    });

    return jsonResponse(frosh);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "backbone-admin");
  if (authError) return authError;

  try {
    const formData = await ctx.request.formData();
    const file = formData.get("csv-file") as File;
    if (!file) return jsonResponse({ error: "No file provided" }, 400);

    const text = await file.text();
    const csvData = await parseCsvBuffer(Buffer.from(text));

    for (const curr of csvData) {
      const bio: Record<string, string> = {};
      const toUpdate: Record<string, any> = {};

      Object.keys(curr).forEach((key) => {
        if (key.indexOf("bio-") === 0) {
          bio[key.replace("bio-", "")] = curr[key];
        }
        if (updateable.indexOf(key) !== -1) {
          toUpdate[key] = curr[key];
        }
      });

      let [frosh] = await Frosh.findOrCreate({ where: toUpdate });
      frosh.set({ ...toUpdate, bio });
      await frosh.save();
    }

    return new Response(null, { status: 201 });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "backbone-admin");
  if (authError) return authError;

  try {
    const formData = await ctx.request.formData();
    const file = formData.get("csv-file") as File;
    if (!file) return jsonResponse({ error: "No file provided" }, 400);

    const text = await file.text();
    const csvData = await parseCsvBuffer(Buffer.from(text));

    for (const curr of csvData) {
      let frosh: any = null;

      if (curr.froshId) {
        frosh = await Frosh.findByPk(curr.froshId);
      }
      if (!frosh && curr.email) {
        frosh = await Frosh.findOne({
          where: { email: { [Op.iLike]: curr.email } },
        });
      }
      if (!frosh && curr.firstName && curr.lastName) {
        frosh = await Frosh.findOne({
          where: {
            [Op.or]: [
              { firstName: { [Op.iLike]: curr.firstName } },
              { preferredName: { [Op.iLike]: curr.firstName } },
            ],
            lastName: { [Op.iLike]: curr.lastName },
          },
        });
      }
      if (!frosh && curr.name) {
        frosh = await Frosh.findOne({
          where: {
            [Op.or]: [
              Sequelize.where(
                Sequelize.fn(
                  "concat",
                  Sequelize.col("firstName"),
                  " ",
                  Sequelize.col("lastName")
                ),
                { [Op.iLike]: curr.name }
              ),
              Sequelize.where(
                Sequelize.fn(
                  "concat",
                  Sequelize.col("preferredName"),
                  " ",
                  Sequelize.col("lastName")
                ),
                { [Op.iLike]: curr.name }
              ),
            ],
          },
        });
      }

      if (frosh) {
        const bio: Record<string, string> = { ...frosh.bio };
        const toUpdate: Record<string, any> = {};

        Object.keys(curr).forEach((key) => {
          if (key.indexOf("bio-") === 0) {
            bio[key.replace("bio-", "")] = curr[key];
          }
          if (updateable.indexOf(key) !== -1) {
            toUpdate[key] = curr[key];
          }
        });

        frosh.set({ ...toUpdate, bio });
        await frosh.save();
      }
    }

    return new Response(null, { status: 201 });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "backbone-admin");
  if (authError) return authError;

  try {
    await Frosh.truncate({ cascade: true });
    // Clear in-memory spam messages
    const { messages } = await import("@/lib/spamStore");
    messages.length = 0;
    return new Response(null, { status: 200 });
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
