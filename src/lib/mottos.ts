// History of the homepage motto, rebuilt from the commits the motto bot makes to Hero.astro.

export interface Motto {
  sha: string;
  text: string;
  date: string; // ISO 8601
  url: string;
}

export interface GithubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    committer: { name: string; date: string } | null;
  };
}

export const MOTTO_COMMITTER = "motto-bot";

/**
 * The motto in a motto-bot commit: everything after "motto:" on the subject line, without the
 * trailing requester tag the bot adds, such as "(@who)" or "(set by @who via Telegram)".
 */
export function parseMessage(message: string): string | null {
  const subject = message.split("\n")[0];
  const match = subject.match(
    /^motto:\s*(\S.*?)(?:\s+\((?:set by )?(?:@\w+|user \d+)(?: via Telegram)?\))?\s*$/,
  );
  return match && match[1] ? match[1] : null;
}

/** Newest first. Only commits made by the motto bot count. */
export function toMottos(commits: GithubCommit[]): Motto[] {
  const mottos: Motto[] = [];
  for (const c of commits) {
    if (c.commit.committer?.name !== MOTTO_COMMITTER) continue;
    const text = parseMessage(c.commit.message);
    if (!text) continue;
    mottos.push({
      sha: c.sha,
      text,
      date: c.commit.committer.date,
      url: c.html_url,
    });
  }
  return mottos;
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
 * entries carry no requester, and link to the homepage rather than to the commit.
 */
export function renderFeed(mottos: Motto[], selfUrl: string, siteUrl: string): string {
  const updated = mottos[0]?.date ?? new Date().toISOString();
  const entries = mottos
    .map(
      (m) => `  <entry>
    <title>${escapeXml(m.text)}</title>
    <id>${escapeXml(m.url)}</id>
    <link href="${escapeXml(siteUrl)}/"/>
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
