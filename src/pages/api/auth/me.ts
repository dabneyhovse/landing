import type { APIRoute } from "astro";
import { jsonResponse, jsonError } from "@/lib/auth";

export const GET: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return jsonError(401, "Unauthorized");
  }
  return jsonResponse(locals.user);
};
