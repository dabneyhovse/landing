import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { fetchSpam, postSpam } from "@/lib/api/frotator";
import { subscribe } from "@/lib/spamSSE";
import type { SpamMessage as FullSpamMessage } from "@/lib/spamStore";

type SpamMessage = Pick<FullSpamMessage, "text" | "name" | "timestamp">;
import { TAB_ID } from "./SpamListener";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import type { Route } from "./FrotatorApp";

interface Props {
  navigate: (route: Route) => void;
  user: {
    preferred_username: string;
    picture?: string;
  };
}

export default function SpamPage({ navigate, user }: Props) {
  const [messages, setMessages] = useState<SpamMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let historyLoaded = false;
    const buffered: SpamMessage[] = [];

    // Subscribe to live updates (shares connection with SpamListener)
    const unsubscribe = subscribe((msg) => {
      if (historyLoaded) {
        setMessages((prev) => [...prev, msg]);
      } else {
        buffered.push(msg);
      }
    });

    // Load history, then merge any messages that arrived during fetch
    fetchSpam()
      .then((history) => {
        const lastTs = history.length > 0 ? history[history.length - 1].timestamp : 0;
        const missed = buffered.filter((m) => m.timestamp > lastTs);
        setMessages([...history, ...missed]);
        historyLoaded = true;
      })
      .catch(() => {
        // If fetch fails, at least show buffered SSE messages
        setMessages(buffered);
        historyLoaded = true;
      });

    return unsubscribe;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const text = newMessage;
    setNewMessage("");
    try {
      await postSpam({ text, tabId: TAB_ID });
    } catch {
      toast.error("Failed to send spam");
    }
  };

  return (
    <div>
      <Button
        variant="outline"
        size="sm"
        className="mb-4"
        onClick={() => navigate({ page: "home" })}
      >
        <ArrowLeft className="size-4" /> Back
      </Button>

      <h1 className="mb-4 text-3xl font-heading text-center">Spam</h1>

      <Card className="mx-auto max-w-2xl py-4 gap-2">
        <CardContent>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={msg.timestamp ?? idx}>
                <div className="flex gap-3 py-2">
                  <div>
                    <p className="text-xs font-heading">
                      {msg.name}
                    </p>
                    {msg.text.split("\n").map((line, i) => (
                      <p key={i} className="mb-0 text-sm">
                        {line}
                      </p>
                    ))}
                  </div>
                </div>
                <Separator />
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="mt-4 flex gap-3">
            <Avatar>
              <AvatarImage src={user.picture} alt="avatar" />
              <AvatarFallback>
                {user.preferred_username?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                placeholder="Type your message..."
                rows={3}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
              <Button size="sm" onClick={handleSend}>
                <Send className="size-4" /> Spam
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
