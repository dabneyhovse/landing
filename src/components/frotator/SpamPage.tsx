import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@/components/ui/avatar";
import { fetchSpam, postSpam } from "@/lib/api/frotator";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import type { Route } from "./FrotatorApp";

interface SpamMessage {
  id: number;
  text: string;
  from: { username: string };
}

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
    const poll = async () => {
      try {
        const data = await fetchSpam();
        setMessages(data);
      } catch {
        // silent fail on poll
      }
    };
    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    const msg = {
      text: newMessage,
      from: { username: user.preferred_username },
    };
    setNewMessage("");
    setMessages((prev) => [
      ...prev,
      { ...msg, id: Date.now() },
    ]);
    try {
      await postSpam(msg);
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

      <h1 className="mb-4 text-3xl font-heading">Spam</h1>

      <Card className="mx-auto max-w-2xl">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-96 space-y-1 overflow-y-auto">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className="flex gap-3 py-2">
                  <div>
                    <p className="text-xs font-heading">
                      {msg.from.username}
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
