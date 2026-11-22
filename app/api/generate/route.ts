import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errorResponse, parseBody, requireApiUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOutput } from "@/lib/llm";

export const maxDuration = 300;

const Body = z.object({
  videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/),
  type: z.enum(["summary", "notes", "post"]),
});

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { videoId, type } = await parseBody(req, Body);
    const db = createAdminClient();

    // The user must have processed this video (counts against their plan) to read/generate anything for it.
    const { data: used } = await db.from("usage").select("id").eq("user_id", user.id).eq("video_id", videoId).maybeSingle();
    if (!used) throw new ApiError("NOT_FOUND", "Process this video first from your dashboard.", 404);

    // Cache first.
    const { data: cached } = await db.from("outputs").select("content").eq("video_id", videoId).eq("type", type).maybeSingle();
    if (cached) return NextResponse.json({ type, content: cached.content, cached: true });

    const { data: video } = await db.from("videos").select("title,transcript").eq("video_id", videoId).maybeSingle();
    if (!video) throw new ApiError("NOT_FOUND", "Video not found.", 404);

    const content = await generateOutput(type, video.title, video.transcript);
    await db.from("outputs").upsert({ video_id: videoId, type, content }, { onConflict: "video_id,type", ignoreDuplicates: true });

    return NextResponse.json({ type, content, cached: false });
  } catch (e) {
    return errorResponse(e);
  }
}
