const API_BASE = "/api/frotator";

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...options,
    headers: { "Content-Type": "application/json", ...options?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const text = await res.text();
  return text ? JSON.parse(text) : (undefined as T);
}

export interface FroshBio {
  hometown: string;
  major: string;
  hobbies: string;
  clubs: string;
  funfact: string;
}

export interface FroshComment {
  id: number;
  text: string;
  from: {
    name: string;
    picture: string;
  };
}

export interface Frosh {
  id: number;
  displayName: string;
  anagram: string;
  pronouns: string;
  dinnerGroup: string;
  image: string | null;
  bio: FroshBio;
  favorite: boolean;
  "frotator-comments": FroshComment[];
  rank?: number;
}

export interface SearchParams {
  dinnerGroup: string;
  name: string;
  anagram: string;
  sort: string;
  "bio-hometown"?: string;
  "bio-major"?: string;
  "bio-hobbies"?: string;
  "bio-clubs"?: string;
  "bio-funfact"?: string;
  only_my_favorites?: boolean;
}

function toQueryString(
  params: Record<string, unknown>,
): string {
  return Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => {
      const val =
        typeof v === "object" && v !== null
          ? JSON.stringify(v)
          : String(v);
      return `${encodeURIComponent(k)}=${encodeURIComponent(val)}`;
    })
    .join("&");
}

export async function fetchFroshList(
  search: SearchParams,
  pageNum: number,
): Promise<{ rows: Frosh[]; count: number }> {
  const qs = toQueryString({ search, pageNum });
  return apiFetch(`/frosh?${qs}`);
}

export async function fetchFroshCards(
  search: Partial<SearchParams>,
): Promise<{ rows: Frosh[] }> {
  const qs = toQueryString({ search, cards: true });
  return apiFetch(`/frosh?${qs}`);
}

export async function fetchSingleFrosh(id: number): Promise<Frosh> {
  return apiFetch(`/frosh/${id}`);
}

export async function postComment(comment: {
  froshId: number;
  text: string;
  anon: boolean;
  userId: string;
}): Promise<FroshComment> {
  return apiFetch("/comments", {
    method: "POST",
    body: JSON.stringify(comment),
  });
}

export async function toggleFavorite(
  froshId: number,
  favorite: boolean,
): Promise<void> {
  await apiFetch("/frosh/favorite", {
    method: "POST",
    body: JSON.stringify({ froshId, favorite }),
  });
}

export async function fetchRanking(): Promise<Frosh[]> {
  return apiFetch("/frosh/ranking");
}

export async function updateRanking(
  froshId: number,
  rank: number,
): Promise<Frosh[]> {
  return apiFetch("/frosh/ranking", {
    method: "PUT",
    body: JSON.stringify({ froshId, rank }),
  });
}

export async function uploadCsv(
  file: File,
  method: "POST" | "PUT" = "POST",
): Promise<void> {
  const formData = new FormData();
  formData.append("csv-file", file);
  const res = await fetch(`${API_BASE}/frosh`, {
    method,
    credentials: "same-origin",
    body: formData,
  });
  if (!res.ok) throw new Error(`Upload error: ${res.status}`);
}

export async function deleteFrosh(): Promise<void> {
  await apiFetch("/frosh", { method: "DELETE" });
}

export async function fetchSpam(): Promise<
  { text: string; name: string; timestamp: number }[]
> {
  return apiFetch("/spam");
}

export async function postSpam(message: { text: string; tabId?: string }): Promise<void> {
  await apiFetch("/spam", {
    method: "POST",
    body: JSON.stringify(message),
  });
}

// Preferences

export interface UserPreferences {
  spamToasts: boolean;
}

export async function fetchPreferences(): Promise<UserPreferences> {
  return apiFetch("/preferences");
}

export async function updatePreferences(prefs: Partial<UserPreferences>): Promise<UserPreferences> {
  return apiFetch("/preferences", {
    method: "PUT",
    body: JSON.stringify(prefs),
  });
}

// Quiz types and API functions

export interface QuizAttempt {
  id: number;
  userId: string;
  userName: string;
  userPicture: string | null;
  score: number;
  total: number;
  currentIndex: number;
  completedAt: string | null;
  createdAt: string;
}

export interface QuizQuestion {
  image: string;
  choices: string[];
}

export interface QuizData {
  attempt: QuizAttempt | null;
  leaderboard: QuizAttempt[];
  currentQuestion: QuizQuestion | null;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  nextQuestion: QuizQuestion | null;
  score: number;
  currentIndex: number;
  total: number;
}

export async function fetchQuizData(): Promise<QuizData> {
  return apiFetch("/quiz");
}

export async function startQuiz(): Promise<QuizData> {
  return apiFetch("/quiz", { method: "POST" });
}

export async function submitAnswer(answer: string): Promise<AnswerResult> {
  return apiFetch("/quiz/answer", {
    method: "POST",
    body: JSON.stringify({ answer }),
  });
}

// DEV ONLY: Reset the current user's quiz attempt
export async function resetQuiz(): Promise<void> {
  await apiFetch("/quiz", { method: "DELETE" });
}
