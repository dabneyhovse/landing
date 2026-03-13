export function requireRole(
  user: User | null,
  ...roles: string[]
): Response | null {
  if (!user) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }
  if (roles.length > 0 && !roles.some((r) => user.roles.includes(r))) {
    return jsonResponse({ error: "Forbidden" }, 403);
  }
  return null;
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function jsonError(status: number, message: string): Response {
  return jsonResponse({ error: message }, status);
}
