import type { APIRoute } from "astro";
import { requireRole } from "@/lib/auth";
import path from "path";
import fs from "fs/promises";

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "frotator-access");
  if (authError) return authError;

  const file = ctx.params.file!;

  if (file.includes("..")) {
    return new Response("Forbidden", { status: 403 });
  }

  const filepath = path.join(
    process.cwd(),
    "public/images/frotator",
    file
  );

  try {
    const data = await fs.readFile(filepath);
    const ext = path.extname(file).toLowerCase();
    const mimeTypes: Record<string, string> = {
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
      ".webp": "image/webp",
    };
    const contentType = mimeTypes[ext] || "application/octet-stream";

    return new Response(data, {
      headers: { "Content-Type": contentType },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
};
