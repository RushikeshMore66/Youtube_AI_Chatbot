"use client";
import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CopyButton } from "@/components/copy-button";

type Msg = { role: "user" | "assistant"; content: string };

export function ChatPanel({ videoId, initial }: { videoId: string; initial: Msg[] }) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    setError(null);
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, message: text }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(json?.error?.message ?? "Something went wrong. Please try again.");
        setMessages((m) => m.slice(0, -1));
        setInput(text);
      } else {
        setMessages((m) => [...m, { role: "assistant", content: json.answer }]);
      }
    } catch {
      setError("Network problem. Check your connection and try again.");
      setMessages((m) => m.slice(0, -1));
      setInput(text);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="max-h-[55dvh] min-h-40 space-y-3 overflow-y-auto rounded-lg border bg-card p-3">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">Ask anything about this video. Answers come only from its transcript.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex flex-col items-start gap-1"}>
            <div
              className={
                "max-w-[90%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[15px] " +
                (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted")
              }
            >
              {m.content}
            </div>
            {m.role === "assistant" && <CopyButton text={m.content} />}
          </div>
        ))}
        {loading && <p className="animate-pulse text-sm text-muted-foreground">Thinking…</p>}
        <div ref={endRef} />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <form onSubmit={send} className="flex gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about this video…" maxLength={1000} />
        <Button type="submit" size="icon" className="size-10 shrink-0" disabled={loading || !input.trim()} aria-label="Send">
          <Send />
        </Button>
      </form>
    </div>
  );
}
