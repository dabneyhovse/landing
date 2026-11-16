import type { APIRoute } from "astro";
import { renderFeed, toMottos, type GithubCommit, type Motto } from "@/lib/mottos";

// Public Atom feed of every motto set through the Telegram bot, newest first. The wiki embeds it:
//   {{rss>https://dabney.caltech.edu/mottos.xml 1 10m}}
//   {{rss>https://dabney.caltech.edu/mottos.xml?skip=1 50 10m}}   (without the newest)
// History comes from the public GitHub commits to Hero.astro, cached briefly so wiki and
// browser traffic stays far below GitHub's unauthenticated rate limit.

const SITE = "https://dabney.caltech.edu";
const COMMITS_URL =
  "https://api.github.com/repos/dabneyhovse/landing/commits" +
  `?path=${encodeURIComponent("src/components/Hero.astro")}&per_page=100`;
const CACHE_MS = 5 * 60 * 1000;

let cache: { at: number; mottos: Motto[] } | null = null;

async function loadMottos(): Promise<Motto[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.mottos;
  try {
    const response = await fetch(COMMITS_URL, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "dabney-landing" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`GitHub returned ${response.status}`);
    const mottos = toMottos((await response.json()) as GithubCommit[]);
    cache = { at: Date.now(), mottos };
    return mottos;
  } catch (error) {
    if (cache) return cache.mottos; // Serve the last good copy rather than failing the wiki.
    throw error;
  }
}

export const GET: APIRoute = async ({ url }) => {
  let mottos: Motto[];
  try {
    mottos = await loadMottos();
  } catch {
    return new Response("Motto history is temporarily unavailable.", { status: 502 });
  }

  const skip = Math.min(Math.max(Number(url.searchParams.get("skip")) || 0, 0), 100);
  const selfUrl = `${SITE}/mottos.xml${skip ? `?skip=${skip}` : ""}`;
  return new Response(renderFeed(mottos.slice(skip), selfUrl, SITE), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
};
