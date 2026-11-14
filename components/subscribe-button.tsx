"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type RazorpayOptions = {
  key: string;
  subscription_id: string;
  name: string;
  description: string;
  prefill?: { email?: string };
  theme?: { color: string };
  handler: () => void;
  modal?: { ondismiss?: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (o: RazorpayOptions) => { open: () => void };
  }
}

function loadCheckout(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

export function SubscribeButton({ isPro }: { isPro: boolean }) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "loading" | "activating">("idle");
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    setState("loading");
    try {
      const res = await fetch("/api/razorpay/subscribe", { method: "POST" });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't start checkout.");
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection.");

      new window.Razorpay({
        key: json.keyId,
        subscription_id: json.subscriptionId,
        name: "YouTube AI-Genie",
        description: "Pro plan — ₹299/month",
        prefill: { email: json.email ?? undefined },
        theme: { color: "#7c3aed" },
        handler: () => {
          // The webhook flips the plan; give it a moment, then reload.
          setState("activating");
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 4000);
        },
        modal: { ondismiss: () => setState("idle") },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setState("idle");
    }
  }

  if (isPro) return <Button className="w-full" disabled>You&apos;re on Pro</Button>;
  return (
    <div className="space-y-2">
      <Button className="w-full" onClick={start} disabled={state !== "idle"}>
        {state === "loading" ? "Starting…" : state === "activating" ? "Activating Pro…" : "Upgrade to Pro"}
      </Button>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
