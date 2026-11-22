import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getPlan(userId: string): Promise<"free" | "pro"> {
  const { data } = await createAdminClient().from("profiles").select("plan").eq("id", userId).maybeSingle();
  return data?.plan === "pro" ? "pro" : "free";
}

/** Start of the current day in India (IST, UTC+5:30) as a UTC ISO string. */
export function startOfTodayIST(now = new Date()): string {
  const offsetMs = 5.5 * 60 * 60 * 1000;
  const ist = new Date(now.getTime() + offsetMs);
  ist.setUTCHours(0, 0, 0, 0);
  return new Date(ist.getTime() - offsetMs).toISOString();
}
