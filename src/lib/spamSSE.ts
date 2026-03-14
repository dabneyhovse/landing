// Shared, ref-counted EventSource for spam SSE.
// Both SpamPage and SpamListener subscribe here,
// so only one connection is open per tab.

interface SpamEvent {
  text: string;
  userId: string;
  name: string;
  timestamp: number;
  tabId?: string;
}

type Listener = (msg: SpamEvent) => void;

const subscribers = new Set<Listener>();
let es: EventSource | null = null;

function connect() {
  es = new EventSource("/api/frotator/spam/stream");
  es.onmessage = (event) => {
    try {
      const msg: SpamEvent = JSON.parse(event.data);
      for (const fn of subscribers) fn(msg);
    } catch {
      // ignore malformed messages
    }
  };
}

export function subscribe(fn: Listener): () => void {
  subscribers.add(fn);
  if (!es) connect();
  return () => {
    subscribers.delete(fn);
    if (subscribers.size === 0 && es) {
      es.close();
      es = null;
    }
  };
}
