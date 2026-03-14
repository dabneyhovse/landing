import type { APIRoute } from "astro";
import { requireRole, jsonResponse, jsonError } from "@/lib/auth";
import {
  findGroupByName,
  addUserToGroup,
  removeUserFromGroup,
} from "@/lib/keycloak";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ALLOWED_GROUPS = ["darbs", "full-darbs"];

async function parseBody(
  request: Request,
): Promise<{ error: string; group?: undefined } | { error?: undefined; group: string }> {
  const body = await request.json();
  const group = body.group as string;
  if (!ALLOWED_GROUPS.includes(group)) {
    return { error: `Group must be one of: ${ALLOWED_GROUPS.join(", ")}` };
  }
  return { group };
}

export const PUT: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "website-manage-users", "backbone-admin");
  if (authError) return authError;

  const userId = ctx.params.userId;
  if (!userId || !UUID_RE.test(userId)) return jsonError(400, "Invalid userId");
  const parsed = await parseBody(ctx.request);
  if (parsed.error) return jsonError(400, parsed.error);

  try {
    const groupId = await findGroupByName(parsed.group!);
    await addUserToGroup(userId, groupId);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(`PUT groups error for user ${userId}:`, err);
    return jsonError(500, "Failed to add user to group");
  }
};

export const DELETE: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "website-manage-users", "backbone-admin");
  if (authError) return authError;

  const userId = ctx.params.userId;
  if (!userId || !UUID_RE.test(userId)) return jsonError(400, "Invalid userId");
  const parsed = await parseBody(ctx.request);
  if (parsed.error) return jsonError(400, parsed.error);

  try {
    const groupId = await findGroupByName(parsed.group!);
    await removeUserFromGroup(userId, groupId);
    return jsonResponse({ ok: true });
  } catch (err) {
    console.error(`DELETE groups error for user ${userId}:`, err);
    return jsonError(500, "Failed to remove user from group");
  }
};
