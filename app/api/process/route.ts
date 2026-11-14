import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errorResponse, parseBody, requireApiUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseVideoId } from "@/lib/youtube";
import { fetchTranscript } from "@/lib/transcript";
import { countTodayUsage, getPlan } from "@/lib/plan";
import { FREE_DAILY_LIMIT, MAX_VIDEO_SECONDS } from "@/lib/limits";

export const maxDuration = 60;

const Body = z.object({ url: z.string().trim().min(1).max(500) });

type VideoMeta = { video_id: string; title: string; duration_seconds: number; language: string | null };

export async function POST(req: Request) {
  try {
    const user = await requireApiUser();
    const { url } = await parseBody(req, Body);

    const videoId = parseVideoId(url);
    if (!videoId) throw new ApiError("INVALID_LINK", "That doesn't look like a YouTube link. Paste a link like youtube.com/watch?v=…", 400);

    const db = createAdminClient();

    // 1. Cache lookup (no paid call yet).
    const { data: cached } = await db
      .from("videos")
      .select("video_id,title,duration_seconds,language")
      .eq("video_id", videoId)
      .maybeSingle<VideoMeta>();

    if (cached && cached.duration_seconds > MAX_VIDEO_SECONDS) {
      throw new ApiError("TOO_LONG", "This video is longer than 60 minutes. Please try a shorter one.", 422);
    }

    // 2. Already processed by this user? Re-opening is free and doesn't count.
    const { data: existing } = await db
      .from("usage")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();
    if (cached && existing) return NextResponse.json({ video: cached });

    // 3. Enforce the free-plan daily limit on the server.
    const plan = await getPlan(user.id);
    if (plan === "free" && (await countTodayUsage(user.id)) >= FREE_DAILY_LIMIT) {
      throw new ApiError(
        "LIMIT_REACHED",
        `You've used your ${FREE_DAILY_LIMIT} free videos for today. Upgrade to Pro for unlimited videos.`,
        429
      );
    }

    // 4. Fetch + cache the transcript only if we don't have it.
    let video = cached;
    if (!video) {
      const t = await fetchTranscript(videoId);
      const row = {
        video_id: videoId,
        title: t.title,
        duration_seconds: t.durationSeconds,
        transcript: t.transcript,
        language: t.language,
      };
      const { error } = await db.from("videos").upsert(row, { onConflict: "video_id", ignoreDuplicates: true });
      if (error) throw error;
      video = { video_id: videoId, title: t.title, duration_seconds: t.durationSeconds, language: t.language };
      if (t.durationSeconds > MAX_VIDEO_SECONDS) {
        throw new ApiError("TOO_LONG", "This video is longer than 60 minutes. Please try a shorter one.", 422);
      }
    }

    // 5. Record usage (unique per user+video, so retries never double count).
    const { error: usageErr } = await db
      .from("usage")
      .upsert({ user_id: user.id, video_id: videoId }, { onConflict: "user_id,video_id", ignoreDuplicates: true });
    if (usageErr) throw usageErr;

    return NextResponse.json({ video });
  } catch (e) {
    return errorResponse(e);
  }
}
