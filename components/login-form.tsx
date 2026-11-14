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
    <div className="w-full space-y-4">
      <Button className="w-full" size="lg" onClick={google} variant="outline">
        <svg viewBox="0 0 24 24" className="!size-5" aria-hidden><path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h5.9a5 5 0 0 1-2.2 3.3v2.7h3.5c2-1.9 3.3-4.7 3.3-8.1z"/><path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.7l-3.5-2.7c-1 .7-2.2 1.1-3.7 1.1-2.8 0-5.2-1.9-6-4.5H2.4v2.8A11 11 0 0 0 12 23z"/><path fill="#FBBC05" d="M6 14.2a6.6 6.6 0 0 1 0-4.4V7H2.4a11 11 0 0 0 0 10z"/><path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.600l3.100-3.100A11 11 0 0 0 2.400 7L6 9.800c.8-2.600 3.200-4.400 6-4.400z"/></svg>
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
          <Button type="submit" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Sending…" : "Email me a magic link"}
          </Button>
        </form>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
