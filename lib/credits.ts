import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Balance } from "@/lib/pricing";

export type FullBalance = Balance & { total: number };

export async function getBalance(userId: string): Promise<FullBalance> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("trial_credits,sub_credits,topup_credits")
    .eq("id", userId)
    .maybeSingle();
  const trial = data?.trial_credits ?? 0;
  const sub = data?.sub_credits ?? 0;
  const topup = data?.topup_credits ?? 0;
  return { trial, sub, topup, total: trial + sub + topup };
}

/** Atomically charges `cost` credits for a video. Idempotent per (user, video). False if the balance is too low. */
export async function spendForVideo(userId: string, videoId: string, cost: number, useTrial: boolean): Promise<boolean> {
  const { data, error } = await createAdminClient().rpc("spend_credits", {
    p_user: userId,
    p_cost: cost,
    p_ref: videoId,
    p_use_trial: useTrial,
  });
  if (error) throw error;
  return data === true;
}

export async function refundVideo(userId: string, videoId: string): Promise<void> {
  const { error } = await createAdminClient().rpc("refund_spend", { p_user: userId, p_ref: videoId });
  if (error) console.error("Refund failed:", error);
}
