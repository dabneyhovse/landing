export interface SpamMessage {
  text: string;
  userId: string;
  name: string;
  timestamp: number;
  tabId?: string;
}

type SSEController = ReadableStreamDefaultController<Uint8Array>;

interface SpamStore {
  messages: SpamMessage[];
  listeners: Set<SSEController>;
  heartbeatStarted?: boolean;
}

// Use globalThis to survive Vite's dev SSR module re-evaluation,
// ensuring the POST handler and SSE stream share the same state.
const key = "__spamStore__" as const;
const g = globalThis as unknown as Record<string, SpamStore>;
if (!g[key]) {
  g[key] = { messages: [], listeners: new Set() };
}
const store = g[key];

export const messages = store.messages;
export const listeners = store.listeners;
export const MAX_MESSAGES = 100;
const HEARTBEAT_INTERVAL = 30_000;

const encoder = new TextEncoder();
const heartbeat = encoder.encode(": keepalive\n\n");

// Send periodic keepalives to detect dead connections
// and prevent reverse proxies from closing idle streams.
if (!store.heartbeatStarted) {
  store.heartbeatStarted = true;
  setInterval(() => {
    for (const controller of listeners) {
      try {
        controller.enqueue(heartbeat);
      } catch {
        listeners.delete(controller);
      }
    }
  }, HEARTBEAT_INTERVAL);
}

export function broadcastMessage(message: SpamMessage) {
  const data = `data: ${JSON.stringify(message)}\n\n`;
  const encoded = encoder.encode(data);
  for (const controller of listeners) {
    try {
      controller.enqueue(encoded);
    } catch {
      listeners.delete(controller);
    }
  }
}
