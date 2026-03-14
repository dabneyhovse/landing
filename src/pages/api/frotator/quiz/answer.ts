import type { APIRoute } from "astro";
import { requireRole, jsonResponse, jsonError } from "@/lib/auth";
import { QuizAttempt } from "@/lib/db/models";
import db from "@/lib/db/db";

interface StoredQuestion {
  froshId: number;
  image: string;
  correctAnswer: string;
  choices: string[];
}

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const userId = ctx.locals.user!.sub;

  let body: any;
  try {
    body = await ctx.request.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const answer: string = body.answer;
  if (!answer || typeof answer !== "string") {
    return jsonError(400, "Missing answer");
  }

  // Use a transaction with row-level locking to prevent race conditions
  // from double-clicks or concurrent requests
  const result = await db.transaction(async (t) => {
    const attempt = await QuizAttempt.findOne({
      where: { userId },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });

    if (!attempt) {
      return jsonError(404, "No quiz attempt found");
    }
    if (attempt.getDataValue("completedAt")) {
      return jsonError(400, "Quiz already completed");
    }

    const questions: StoredQuestion[] = attempt.getDataValue("questions");
    const currentIndex: number = attempt.getDataValue("currentIndex");
    const question = questions[currentIndex];

    const correct = answer === question.correctAnswer;
    const newScore = attempt.getDataValue("score") + (correct ? 1 : 0);
    const newIndex = currentIndex + 1;
    const done = newIndex >= questions.length;

    await attempt.update(
      {
        score: newScore,
        currentIndex: newIndex,
        ...(done ? { completedAt: new Date() } : {}),
      },
      { transaction: t },
    );

    const nextQuestion = done
      ? null
      : {
          image: questions[newIndex].image,
          choices: questions[newIndex].choices,
        };

    return jsonResponse({
      correct,
      correctAnswer: question.correctAnswer,
      nextQuestion,
      score: newScore,
      currentIndex: newIndex,
      total: questions.length,
    });
  });

  return result;
};
