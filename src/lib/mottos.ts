// The homepage motto and its history, kept in files on a Docker volume that the motto bot writes
// and this site reads on every request (so a change shows up without a rebuild or deploy):
//   motto.txt      the current motto, plain text
//   history.jsonl  one JSON object per line, oldest first: {"at": ISO time, "text": "...", "who": "..."}
// "who" is for the operators' records and is never shown on the site or in the feed.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const DEFAULT_MOTTO = "Not a Soc VP, not my problem!";

export interface Motto {
  id: string;
  text: string;
  date: string; // ISO 8601
}

function mottoDir(): string {
  return process.env.MOTTO_DIR ?? "/motto";
}

/** The current motto, or a default if the file is missing or empty. */
export async function readCurrentMotto(): Promise<string> {
  try {
    const text = (await readFile(join(mottoDir(), "motto.txt"), "utf8")).trim();
    return text || DEFAULT_MOTTO;
  } catch {
    return DEFAULT_MOTTO;
  }
}

/** Every motto, newest first. Damaged or partial lines are skipped. */
export async function readHistory(): Promise<Motto[]> {
  let raw: string;
  try {
    raw = await readFile(join(mottoDir(), "history.jsonl"), "utf8");
  } catch {
    return [];
  }
  const mottos: Motto[] = [];
  raw.split("\n").forEach((line, index) => {
    if (!line.trim()) return;
    try {
      const entry = JSON.parse(line);
      const time = typeof entry.at === "string" ? Date.parse(entry.at) : NaN;
      if (typeof entry.text !== "string" || !entry.text.trim() || Number.isNaN(time)) return;
      mottos.push({ id: String(index), text: entry.text.trim(), date: new Date(time).toISOString() });
    } catch {
      // A line cut short by a write in progress.
    }
  });
  return mottos.reverse();
}

export function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * An Atom feed. Each entry's title is the motto, which is what DokuWiki's {{rss>}} shows. The
 * entries carry no requester and deliberately no <link>: DokuWiki prints an entry without a
 * link as plain text, and turns one with a link into a hyperlink.
 */
export function renderFeed(mottos: Motto[], selfUrl: string, siteUrl: string): string {
  const updated = mottos[0]?.date ?? new Date().toISOString();
  const entries = mottos
    .map(
      (m) => `  <entry>
    <title>${escapeXml(m.text)}</title>
    <id>urn:dabney:motto:${escapeXml(m.id)}</id>
    <updated>${escapeXml(m.date)}</updated>
  </entry>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Dabney mottos</title>
  <id>${escapeXml(siteUrl)}/mottos.xml</id>
  <link rel="self" href="${escapeXml(selfUrl)}"/>
  <link rel="alternate" href="${escapeXml(siteUrl)}/"/>
  <updated>${escapeXml(updated)}</updated>
  <author><name>Dabney Hovse</name></author>
${entries}
</feed>
`;
}
