import type { APIRoute } from "astro";
import { Op } from "sequelize";
import { requireRole, jsonResponse, jsonError } from "@/lib/auth";
import { Frosh, QuizAttempt } from "@/lib/db/models";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface StoredQuestion {
  froshId: number;
  image: string;
  correctAnswer: string;
  choices: string[];
}

function currentQuestion(attempt: any): { image: string; choices: string[] } | null {
  const questions: StoredQuestion[] = attempt.questions;
  if (attempt.currentIndex >= questions.length) return null;
  const q = questions[attempt.currentIndex];
  return { image: q.image, choices: q.choices };
}

function sanitizeAttempt(attempt: any) {
  const { questions, ...rest } = attempt.toJSON();
  return rest;
}

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const userId = ctx.locals.user!.sub;

  const attempt = await QuizAttempt.findOne({ where: { userId } });
  const leaderboard = await QuizAttempt.findAll({
    where: { completedAt: { [Op.ne]: null } },
    order: [["score", "DESC"], ["createdAt", "ASC"]],
    attributes: { exclude: ["questions"] },
  });

  if (!attempt) {
    return jsonResponse({ attempt: null, leaderboard, currentQuestion: null });
  }

  const cq = attempt.getDataValue("completedAt")
    ? null
    : currentQuestion(attempt);

  return jsonResponse({
    attempt: sanitizeAttempt(attempt),
    leaderboard,
    currentQuestion: cq,
  });
};

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const user = ctx.locals.user!;

  const existing = await QuizAttempt.findOne({ where: { userId: user.sub } });
  if (existing) {
    return jsonError(409, "You already have a quiz attempt");
  }

  // Fetch all frosh with images
  const allFrosh = (await Frosh.findAll({
    attributes: ["id", "preferredName", "firstName", "lastName", "image"],
  })) as any[];

  const froshWithImages = allFrosh.filter(
    (f) => f.image && f.image.trim() !== "",
  );

  if (froshWithImages.length < 6) {
    return jsonError(400, "Not enough frosh with images to generate a quiz");
  }

  // Build unique name pool, filtering by frosh ID to handle duplicate names
  const shuffledFrosh = shuffle(froshWithImages);

  // Track which names have already been shown as correct answers so they
  // aren't used as wrong choices in later questions (process of elimination)
  const seenCorrectAnswers = new Set<string>();

  const questions: StoredQuestion[] = shuffledFrosh.map((f) => {
    const correctAnswer = `${f.preferredName || f.firstName} ${f.lastName}`;
    // Pick 5 wrong answers, preferring unseen names but falling back to
    // already-seen ones if needed to always have 6 choices
    const otherFrosh = froshWithImages.filter((o) => o.id !== f.id);
    const otherNames = [
      ...new Set(
        otherFrosh.map(
          (o) => `${o.preferredName || o.firstName} ${o.lastName}`,
        ),
      ),
    ].filter((n) => n !== correctAnswer);
    const unseenNames = otherNames.filter((n) => !seenCorrectAnswers.has(n));
    const seenNames = otherNames.filter((n) => seenCorrectAnswers.has(n));
    // Fill from unseen first, then pad with seen names if needed
    const wrongNames = [
      ...shuffle(unseenNames),
      ...shuffle(seenNames),
    ].slice(0, 5);
    const choices = shuffle([correctAnswer, ...wrongNames]);
    seenCorrectAnswers.add(correctAnswer);
    return {
      froshId: f.id,
      image: f.image,
      correctAnswer,
      choices,
    };
  });

  const attempt = await QuizAttempt.create({
    userId: user.sub,
    userName: user.name,
    userPicture: user.picture || null,
    score: 0,
    total: questions.length,
    currentIndex: 0,
    questions,
  });

  const cq = currentQuestion(attempt);

  return jsonResponse(
    {
      attempt: sanitizeAttempt(attempt),
      leaderboard: await QuizAttempt.findAll({
        where: { completedAt: { [Op.ne]: null } },
        order: [["score", "DESC"], ["createdAt", "ASC"]],
        attributes: { exclude: ["questions"] },
      }),
      currentQuestion: cq,
    },
    201,
  );
};

// DEV ONLY: Reset the current user's quiz attempt
export const DELETE: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const userId = ctx.locals.user!.sub;
  const deleted = await QuizAttempt.destroy({ where: { userId } });
  return jsonResponse({ deleted });
};
