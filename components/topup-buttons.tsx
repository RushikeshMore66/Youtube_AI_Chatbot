"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { TOPUP_PACKS } from "@/lib/pricing";
import { loadCheckout } from "@/lib/razorpay-client";

export function TopupButtons() {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function buy(packId: string, credits: number, price: number) {
    setError(null);
    setBusy(packId);
    try {
      const res = await fetch("/api/razorpay/topup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packId }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) throw new Error(json?.error?.message ?? "Couldn't start checkout.");
      if (!(await loadCheckout()) || !window.Razorpay) throw new Error("Couldn't load the payment window. Check your connection.");

      new window.Razorpay({
        key: json.keyId,
        order_id: json.orderId,
        amount: json.amount,
        currency: "INR",
        name: "YouTube AI-Genie",
        description: `${credits} credits — ₹${price}`,
        prefill: { email: json.email ?? undefined },
        theme: { color: "#7c3aed" },
        handler: () => {
          // The webhook adds the credits; give it a moment, then reload.
          setTimeout(() => {
            router.push("/dashboard");
            router.refresh();
          }, 4000);
        },
        modal: { ondismiss: () => setBusy(null) },
      }).open();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {TOPUP_PACKS.map((p) => (
          <Button key={p.id} variant="outline" disabled={busy !== null} onClick={() => buy(p.id, p.credits, p.priceInr)}>
            {busy === p.id ? "Opening…" : `${p.credits} credits — ₹${p.priceInr}`}
          </Button>
        ))}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
