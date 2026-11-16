import type { APIRoute } from "astro";
import { readHistory, renderFeed } from "@/lib/mottos";

// Public Atom feed of every motto, newest first. The wiki embeds it:
//   {{rss>https://dabney.caltech.edu/mottos.xml 1 1m}}
//   {{rss>https://dabney.caltech.edu/mottos.xml?skip=1 50 1m}}   (without the newest)
// The history is read from the motto volume on each request (see src/lib/mottos.ts).

const SITE = "https://dabney.caltech.edu";

export const GET: APIRoute = async ({ url }) => {
  const mottos = await readHistory();
  const skip = Math.min(Math.max(Number(url.searchParams.get("skip")) || 0, 0), 100);
  const selfUrl = `${SITE}/mottos.xml${skip ? `?skip=${skip}` : ""}`;
  return new Response(renderFeed(mottos.slice(skip), selfUrl, SITE), {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, max-age=60",
    },
  });
};
