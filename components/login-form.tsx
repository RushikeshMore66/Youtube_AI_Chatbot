"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm({ next = "/dashboard" }: { next?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  const redirectTo = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function google() {
    setError(null);
    const { error } = await createClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo() },
    });
    if (error) setError("Google sign-in failed. Please try again.");
  }

  async function magicLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo() },
    });
    if (error) {
      setStatus("idle");
      setError("Could not send the link. Check the email address and try again.");
    } else setStatus("sent");
  }

  return (
    <div className="w-full max-w-sm space-y-4">
      <Button className="w-full" size="lg" onClick={google}>
        Continue with Google
      </Button>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
      </div>
      {status === "sent" ? (
        <p className="rounded-md bg-accent p-3 text-sm">Check your inbox — we sent a sign-in link to {email}.</p>
      ) : (
        <form onSubmit={magicLink} className="space-y-2">
          <Input type="email" required placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button type="submit" variant="outline" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Email me a magic link"}
          </Button>
        </form>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
