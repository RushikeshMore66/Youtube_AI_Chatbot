import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { ApiError, errorResponse, requireApiUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/plan";

export async function POST() {
  try {
    const user = await requireApiUser();
    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_PLAN_ID } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET || !RAZORPAY_PLAN_ID) {
      throw new ApiError("UPSTREAM", "Payments are not configured yet.", 503);
    }
    if ((await getPlan(user.id)) === "pro") {
      throw new ApiError("BAD_REQUEST", "You're already on Pro.", 409);
    }

    const rzp = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    let subscription;
    try {
      subscription = await rzp.subscriptions.create({
        plan_id: RAZORPAY_PLAN_ID,
        total_count: 120, // up to 10 years of monthly billing; cancel any time
        customer_notify: 1,
        notes: { user_id: user.id },
      });
    } catch (e) {
      console.error("Razorpay create subscription failed:", e);
      throw new ApiError("UPSTREAM", "Couldn't start checkout. Please try again.", 502);
    }

    const { error } = await createAdminClient()
      .from("profiles")
      .update({ razorpay_subscription_id: subscription.id })
      .eq("id", user.id);
    if (error) throw error;

    // Only the public key id goes to the browser.
    return NextResponse.json({ subscriptionId: subscription.id, keyId: RAZORPAY_KEY_ID, email: user.email ?? null });
  } catch (e) {
    return errorResponse(e);
  }
}
