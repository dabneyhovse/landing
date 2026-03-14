import { defineMiddleware } from "astro:middleware";
import { createHash, createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const SECRET = import.meta.env.KC_CLIENT_SECRET ?? "";
const KEY = createHash("sha256").update(SECRET).digest(); // 32 bytes for AES-256

interface SessionPayload {
  sub: string;
  name: string;
  preferred_username: string;
  roles: string[];
  picture?: string;
  exp: number;
}

export function encryptSession(payload: SessionPayload): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", KEY, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  // iv (12) + authTag (16) + ciphertext
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

export function decryptSession(token: string): SessionPayload | null {
  try {
    const buf = Buffer.from(token, "base64url");
    if (buf.length < 28) return null; // 12 + 16 minimum
    const iv = buf.subarray(0, 12);
    const authTag = buf.subarray(12, 28);
    const ciphertext = buf.subarray(28);
    const decipher = createDecipheriv("aes-256-gcm", KEY, iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return JSON.parse(decrypted.toString("utf8"));
  } catch {
    return null;
  }
}

function isExpired(payload: SessionPayload): boolean {
  return Date.now() >= payload.exp * 1000;
}

const ADMIN_ROLES = ["frotator-admin", "backbone-admin"];

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.user = null;
  const sessionCookie = context.cookies.get("session");
  if (sessionCookie) {
    try {
      const payload = decryptSession(sessionCookie.value);
      if (payload && !isExpired(payload)) {
        context.locals.user = {
          sub: payload.sub,
          name: payload.name,
          preferred_username: payload.preferred_username,
          roles: payload.roles,
          picture: payload.picture,
        };
      }
    } catch {
      // Invalid or tampered cookie — treat as unauthenticated
    }
  }

  // Gate frotator access when disabled (admins always pass through)
  const path = context.url.pathname;
  const isFrotatorPath =
    path === "/frotator" ||
    (path.startsWith("/api/frotator/") && path !== "/api/frotator/config");

  if (isFrotatorPath) {
    const userRoles = context.locals.user?.roles ?? [];
    const isAdmin = ADMIN_ROLES.some((r) => userRoles.includes(r));
    if (!isAdmin) {
      const { isFrotatorEnabled } = await import("@/lib/frotatorConfig");
      const enabled = await isFrotatorEnabled();
      if (!enabled) {
        if (path.startsWith("/api/")) {
          return new Response(JSON.stringify({ error: "Frotator is not currently enabled" }), {
            status: 403,
            headers: { "Content-Type": "application/json" },
          });
        }
        return context.redirect("/");
      }
    }
  }

  return next();
});
