import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { z } from "zod";
import { ApiError, errorResponse, parseBody, requireApiUser } from "@/lib/api";
import { getPack } from "@/lib/pricing";

const Body = z.object({ packId: z.string().min(1).max(20) });

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { packId } = await parseBody(req, Body);
    const pack = getPack(packId);
    if (!pack) throw new ApiError("BAD_REQUEST", "Unknown credit pack.", 400);

    const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) throw new ApiError("UPSTREAM", "Payments are not configured yet.", 503);

    const rzp = new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET });
    let order;
    try {
      order = await rzp.orders.create({
        amount: pack.priceInr * 100, // paise
        currency: "INR",
        notes: { user_id: user.id, pack: pack.id },
      });
    } catch (e) {
      console.error("Razorpay create order failed:", e);
      throw new ApiError("UPSTREAM", "Couldn't start checkout. Please try again.", 502);
    }

    // Credits are granted only by the signature-verified webhook, never from this response.
    return NextResponse.json({ orderId: order.id, keyId: RAZORPAY_KEY_ID, amount: order.amount, email: user.email ?? null });
  } catch (e) {
    return errorResponse(e);
  }
}
