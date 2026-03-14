import { apiFetch as baseFetch } from "./fetch";

const API_BASE = "/api/admin";

function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return baseFetch<T>(`${API_BASE}${path}`, options);
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
  // FormData sets its own Content-Type with boundary — don't pass through apiFetch
  return baseFetch(`${API_BASE}/users`, {
    method: "POST",
    body: formData,
    headers: {},
  });
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
