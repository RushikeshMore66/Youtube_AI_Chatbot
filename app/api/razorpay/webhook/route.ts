import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPack, PRO } from "@/lib/pricing";

type Notes = { user_id?: string; pack?: string } | unknown[] | undefined;
type SubscriptionEntity = { id: string; plan_id?: string; notes?: Notes };
type Payload = {
  event: string;
  payload?: {
    subscription?: { entity?: SubscriptionEntity };
    payment?: { entity?: { id: string } };
    order?: { entity?: { id: string; amount_paid?: number; notes?: Notes } };
  };
};

const ACTIVATE = new Set(["subscription.activated", "subscription.charged"]);
const DOWNGRADE = new Set(["subscription.cancelled", "subscription.completed", "subscription.halted", "subscription.expired"]);
const plainNotes = (n: Notes) => (n && !Array.isArray(n) ? n : undefined);

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

  const db = createAdminClient();

  // One-time credit top-up: order.paid carries the order notes we set in /api/razorpay/topup.
  if (event.event === "order.paid") {
    const order = event.payload?.order?.entity;
    const paymentId = event.payload?.payment?.entity?.id;
    const notes = plainNotes(order?.notes);
    const pack = notes?.pack ? getPack(notes.pack) : undefined;
    if (!order || !paymentId || !notes?.user_id || !pack) return NextResponse.json({ ok: true, ignored: true });
    if (order.amount_paid !== pack.priceInr * 100) {
      console.error("Top-up amount mismatch", order.id);
      return NextResponse.json({ ok: true, ignored: true });
    }
    const { error } = await db.rpc("grant_credits", {
      p_user: notes.user_id,
      p_bucket: "topup",
      p_amount: pack.credits,
      p_reason: "topup",
      p_ref: paymentId,
    });
    if (error) {
      console.error("Top-up grant failed:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 }); // Razorpay will retry
    }
    return NextResponse.json({ ok: true });
  }

  const sub = event.payload?.subscription?.entity;
  const activate = ACTIVATE.has(event.event);
  const downgrade = DOWNGRADE.has(event.event);
  if (!sub || (!activate && !downgrade)) return NextResponse.json({ ok: true, ignored: true });

  // Ignore subscriptions that aren't for our Pro plan.
  if (process.env.RAZORPAY_PLAN_ID && sub.plan_id && sub.plan_id !== process.env.RAZORPAY_PLAN_ID) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  // Match on the user id we put in notes, or on the subscription id we saved at checkout.
  let userId = plainNotes(sub.notes)?.user_id;
  if (!userId) {
    const { data } = await db.from("profiles").select("id").eq("razorpay_subscription_id", sub.id).maybeSingle();
    userId = data?.id;
  }
  if (!userId) return NextResponse.json({ ok: true, ignored: true });

  let dbError: unknown = null;
  if (activate) {
    ({ error: dbError } = await db.from("profiles").update({ plan: "pro", razorpay_subscription_id: sub.id }).eq("id", userId));
    // Monthly credits reset to PRO.credits on each successful charge (idempotent per payment id).
    const paymentId = event.payload?.payment?.entity?.id;
    if (!dbError && event.event === "subscription.charged" && paymentId) {
      ({ error: dbError } = await db.rpc("set_sub_credits", { p_user: userId, p_amount: PRO.credits, p_ref: paymentId }));
    }
  } else {
    // A downgrade must only apply to the subscription that is currently on the profile.
    const { data: updated, error } = await db
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", userId)
      .eq("razorpay_subscription_id", sub.id)
      .select("id");
    dbError = error;
    if (!error && updated && updated.length > 0) {
      ({ error: dbError } = await db.rpc("set_sub_credits", { p_user: userId, p_amount: 0, p_ref: `end:${event.event}:${sub.id}` }));
    }
  }

  if (dbError) {
    console.error("Webhook DB update failed:", dbError);
    return NextResponse.json({ error: "DB error" }, { status: 500 }); // Razorpay will retry
  }
  return NextResponse.json({ ok: true });
}
