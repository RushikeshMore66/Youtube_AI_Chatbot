import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SubscriptionEntity = { id: string; plan_id?: string; notes?: { user_id?: string } | unknown[] };
type Payload = { event: string; payload?: { subscription?: { entity?: SubscriptionEntity } } };

const UPGRADE = new Set(["subscription.activated", "subscription.charged"]);
const DOWNGRADE = new Set(["subscription.cancelled", "subscription.completed", "subscription.halted", "subscription.expired"]);

function validSignature(body: string, signature: string | null, secret: string) {
  if (!signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  // Signature is computed over the raw body, so read it as text before parsing.
  const raw = await req.text();
  if (!validSignature(raw, req.headers.get("x-razorpay-signature"), secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: Payload;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const sub = event.payload?.subscription?.entity;
  const upgrade = UPGRADE.has(event.event);
  const downgrade = DOWNGRADE.has(event.event);
  if (!sub || (!upgrade && !downgrade)) return NextResponse.json({ ok: true, ignored: true });

  // Ignore subscriptions that aren't for our Pro plan.
  if (process.env.RAZORPAY_PLAN_ID && sub.plan_id && sub.plan_id !== process.env.RAZORPAY_PLAN_ID) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const db = createAdminClient();
  const notes = Array.isArray(sub.notes) ? undefined : sub.notes;
  const userId = notes?.user_id;

  // Match on the user id we put in notes, or on the subscription id we saved at checkout.
  let query = db.from("profiles").update(
    upgrade ? { plan: "pro", razorpay_subscription_id: sub.id } : { plan: "free" }
  );
  query = userId ? query.eq("id", userId) : query.eq("razorpay_subscription_id", sub.id);
  // A downgrade must only apply to the subscription that is currently on the profile.
  if (downgrade) query = query.eq("razorpay_subscription_id", sub.id);

  const { error } = await query;
  if (error) {
    console.error("Webhook DB update failed:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 }); // Razorpay will retry
  }
  return NextResponse.json({ ok: true });
}
