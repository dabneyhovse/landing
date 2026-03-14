import type { APIRoute } from "astro";
import { requireRole } from "@/lib/auth";
import { listeners } from "@/lib/spamStore";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  let savedController: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      savedController = controller;
      listeners.add(controller);
    },
    cancel() {
      listeners.delete(savedController);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
};
