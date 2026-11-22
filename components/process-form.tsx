"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProcessForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code?: string; message: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError({ code: json?.error?.code, message: json?.error?.message ?? "Something went wrong. Please try again." });
        return;
      }
      router.push(`/video/${json.video.video_id}`);
    } catch {
      setError({ message: "Network problem. Check your connection and try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          type="text"
          inputMode="url"
          placeholder="Paste a YouTube link…"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
          className="h-12 flex-1"
        />
        <Button type="submit" size="lg" disabled={loading}>
          {loading ? "Processing…" : "Get insights"}
        </Button>
      </div>
      {loading && <p className="text-sm text-muted-foreground">Fetching the transcript — this can take up to 30 seconds.</p>}
      {error && (
        <p className="text-sm text-destructive">
          {error.message}{" "}
          {(error.code === "INSUFFICIENT_CREDITS" || error.code === "UPGRADE_REQUIRED") && (
            <Link href="/pricing" className="font-medium underline">Upgrade or buy credits</Link>
          )}
        </p>
      )}
    </form>
  );
}
