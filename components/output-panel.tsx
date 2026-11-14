"use client";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/copy-button";

type OutputType = "summary" | "notes" | "post";

export function OutputPanel({ videoId, type, initial }: { videoId: string; type: OutputType; initial?: string }) {
  const [content, setContent] = useState<string | null>(initial ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId, type }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) setError(json?.error?.message ?? "Something went wrong. Please try again.");
      else setContent(json.content);
    } catch {
      setError("Network problem. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, [videoId, type]);

  useEffect(() => {
    if (content === null) void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (content) {
    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <CopyButton text={content} />
        </div>
        <div className="whitespace-pre-wrap rounded-lg border bg-card p-4 text-[15px] leading-relaxed">{content}</div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{error}</p>
        <Button variant="outline" onClick={load}>Try again</Button>
      </div>
    );
  }
  return <p className="animate-pulse text-sm text-muted-foreground">{loading ? "Generating…" : "Loading…"}</p>;
}
