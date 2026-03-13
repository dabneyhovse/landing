import type { APIRoute } from "astro";
import { requireRole, jsonResponse } from "@/lib/auth";

interface SpamMessage {
  text: string;
  userId: string;
  name: string;
  timestamp: number;
}

const messages: SpamMessage[] = [];
const MAX_MESSAGES = 100;

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  return jsonResponse(messages);
};

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  try {
    const body = await ctx.request.json();

    const message: SpamMessage = {
      text: body.text,
      userId: ctx.locals.user!.sub,
      name: ctx.locals.user!.name,
      timestamp: Date.now(),
    };

    messages.push(message);
    if (messages.length > MAX_MESSAGES) {
      messages.shift();
    }

    return jsonResponse(message, 201);
  } catch (error) {
    return jsonResponse({ error: "Internal server error" }, 500);
  }
};
