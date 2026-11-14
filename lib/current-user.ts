import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Returns the logged-in user or null. Never throws (safe for public pages). */
export async function getOptionalUser() {
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ?? null;
  } catch {
    return null;
  }
}
