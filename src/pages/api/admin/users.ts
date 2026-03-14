import type { APIRoute } from "astro";
import { Readable } from "stream";
import { parse } from "csv-parse";
import { requireRole, jsonResponse, jsonError } from "@/lib/auth";
import {
  searchUsers,
  getUserGroups,
} from "@/lib/keycloak";
import { createUsers, type NewUser } from "@/lib/freeipa";

function getMembership(
  groups: { name: string }[],
): "social" | "full" | "none" {
  const names = groups.map((g) => g.name);
  if (names.includes("full-darbs")) return "full";
  if (names.includes("darbs")) return "social";
  return "none";
}

export const GET: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "website-manage-users", "backbone-admin");
  if (authError) return authError;

  const search = ctx.url.searchParams.get("search") ?? "";
  const first = Number(ctx.url.searchParams.get("first") ?? "0");
  const max = Number(ctx.url.searchParams.get("max") ?? "20");

  try {
    const kcUsers = await searchUsers(search, first, max);

    const users = await Promise.all(
      kcUsers.map(async (u) => {
        const groups = await getUserGroups(u.id);
        return {
          id: u.id,
          username: u.username,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          membership: getMembership(groups),
        };
      }),
    );

    return jsonResponse({ users });
  } catch (err) {
    console.error("GET /api/admin/users error:", err);
    return jsonError(500, "Failed to fetch users");
  }
};

const USERNAME_RE = /^[a-zA-Z][a-zA-Z0-9._-]{0,31}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateUser(u: unknown): { valid: false; error: string } | { valid: true; user: NewUser } {
  if (!u || typeof u !== "object") return { valid: false, error: "Invalid user object" };
  const obj = u as Record<string, unknown>;

  const username = String(obj.username ?? "").trim();
  const firstName = String(obj.firstName ?? "").trim();
  const lastName = String(obj.lastName ?? "").trim();
  const email = String(obj.email ?? "").trim();
  const membership = String(obj.membership ?? "").trim();

  if (!USERNAME_RE.test(username)) return { valid: false, error: `Invalid username: ${username}` };
  if (!firstName) return { valid: false, error: "First name is required" };
  if (!lastName) return { valid: false, error: "Last name is required" };
  if (!EMAIL_RE.test(email)) return { valid: false, error: `Invalid email: ${email}` };
  if (membership !== "social" && membership !== "full") {
    return { valid: false, error: `Membership must be "social" or "full"` };
  }

  return { valid: true, user: { username, firstName, lastName, email, membership } };
}

const CSV_COLUMN_MAP: Record<string, string> = {
  username: "username",
  first_name: "firstName",
  firstname: "firstName",
  firstName: "firstName",
  last_name: "lastName",
  lastname: "lastName",
  lastName: "lastName",
  email: "email",
  membership: "membership",
};

function parseCsvBuffer(buffer: Buffer): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) => {
    const rows: Record<string, string>[] = [];
    Readable.from(buffer)
      .pipe(parse({ delimiter: ",", encoding: "utf-8", columns: true, trim: true }))
      .on("data", (row: Record<string, string>) => {
        const mapped: Record<string, string> = {};
        for (const [col, value] of Object.entries(row)) {
          const key = CSV_COLUMN_MAP[col.trim()] ?? col.trim();
          mapped[key] = value;
        }
        rows.push(mapped);
      })
      .on("end", () => resolve(rows))
      .on("error", reject);
  });
}

async function parseRequestUsers(request: Request): Promise<unknown[]> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("csv-file") as File;
    if (!file) throw new Error("No file provided");
    const text = await file.text();
    return parseCsvBuffer(Buffer.from(text));
  }
  const body = await request.json();
  return body.users;
}

export const POST: APIRoute = async (ctx) => {
  const authError = requireRole(ctx.locals.user, "website-manage-users", "backbone-admin");
  if (authError) return authError;

  try {
    const rawUsers = await parseRequestUsers(ctx.request);

    if (!Array.isArray(rawUsers) || rawUsers.length === 0) {
      return jsonError(400, "Request must include a non-empty users array");
    }

    if (rawUsers.length > 100) {
      return jsonError(400, "Maximum 100 users per request");
    }

    const validated: NewUser[] = [];
    const clientErrors: { username: string; success: false; error: string }[] = [];

    for (const raw of rawUsers) {
      const result = validateUser(raw);
      if (result.valid) {
        validated.push(result.user);
      } else {
        clientErrors.push({
          username: (raw as Record<string, unknown>)?.username as string ?? "unknown",
          success: false,
          error: result.error,
        });
      }
    }

    const ipaResults = validated.length > 0 ? await createUsers(validated) : [];

    console.log(
      `[admin] User creation by ${ctx.locals.user!.preferred_username}: ` +
      `${ipaResults.filter((r) => r.success).length}/${validated.length} succeeded`,
    );

    return jsonResponse({ results: [...clientErrors, ...ipaResults] });
  } catch (err) {
    console.error("POST /api/admin/users error:", err);
    return jsonError(500, "Failed to create users");
  }
};
