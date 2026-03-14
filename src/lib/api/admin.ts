const API_BASE = "/api/admin";

async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `API error: ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.error) message = parsed.error;
    } catch {}
    throw new Error(message);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export interface AdminUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  membership: "social" | "full" | "none";
}

export interface CreateUserInput {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  membership: "social" | "full";
}

export interface CreateUserResult {
  username: string;
  success: boolean;
  error?: string;
}

export async function fetchUsers(
  search: string,
  first = 0,
  max = 20,
): Promise<{ users: AdminUser[] }> {
  const params = new URLSearchParams({
    search,
    first: String(first),
    max: String(max),
  });
  return apiFetch(`/users?${params}`);
}

export async function createUsers(
  users: CreateUserInput[],
): Promise<{ results: CreateUserResult[] }> {
  return apiFetch("/users", {
    method: "POST",
    body: JSON.stringify({ users }),
  });
}

export async function uploadUsersCsv(
  file: File,
): Promise<{ results: CreateUserResult[] }> {
  const formData = new FormData();
  formData.append("csv-file", file);
  const res = await fetch(`${API_BASE}/users`, {
    method: "POST",
    credentials: "same-origin",
    body: formData,
  });
  if (!res.ok) {
    const body = await res.text();
    let message = `API error: ${res.status}`;
    try {
      const parsed = JSON.parse(body);
      if (parsed.error) message = parsed.error;
    } catch {}
    throw new Error(message);
  }
  return res.json();
}

export async function updateUserGroup(
  userId: string,
  group: "darbs" | "full-darbs",
  action: "add" | "remove",
): Promise<void> {
  await apiFetch(`/users/${userId}/groups`, {
    method: action === "add" ? "PUT" : "DELETE",
    body: JSON.stringify({ group }),
  });
}
