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

  const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <rect width="200" height="200" fill="#2d4a2d"/>
  <circle cx="100" cy="80" r="35" fill="#4a6b4a"/>
  <ellipse cx="100" cy="160" rx="50" ry="35" fill="#4a6b4a"/>
</svg>`;

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
    return new Response(PLACEHOLDER_SVG, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
};
