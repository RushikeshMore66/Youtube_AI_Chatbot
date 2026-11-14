import "server-only";
import { NextResponse } from "next/server";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type ErrorCode =
  | "UNAUTHORIZED"
  | "BAD_REQUEST"
  | "INVALID_LINK"
  | "NO_CAPTIONS"
  | "TOO_LONG"
  | "LIMIT_REACHED"
  | "NOT_FOUND"
  | "UPSTREAM"
  | "SERVER";

export class ApiError extends Error {
  constructor(public code: ErrorCode, message: string, public status: number) {
    super(message);
  }
}

export function errorResponse(e: unknown) {
  if (e instanceof ApiError) {
    return NextResponse.json({ error: { code: e.code, message: e.message } }, { status: e.status });
  }
  console.error("Unhandled API error:", e);
  return NextResponse.json(
    { error: { code: "SERVER", message: "Something went wrong on our side. Please try again." } },
    { status: 500 }
  );
}

/** Returns the logged-in user or throws a 401 ApiError. */
export async function requireApiUser(): Promise<User> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new ApiError("UNAUTHORIZED", "Please sign in to continue.", 401);
  return data.user;
}

/** Parses a JSON body with a zod schema; throws a 400 ApiError with a clear message on failure. */
export async function parseBody<T>(req: Request, schema: { safeParse: (v: unknown) => { success: true; data: T } | { success: false } }): Promise<T> {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    throw new ApiError("BAD_REQUEST", "Request body must be valid JSON.", 400);
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) throw new ApiError("BAD_REQUEST", "Invalid request. Please check your input.", 400);
  return parsed.data;
}
