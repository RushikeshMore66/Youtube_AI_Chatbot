import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, errorResponse, parseBody, requireApiUser } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseVideoId } from "@/lib/youtube";
import { fetchTranscript } from "@/lib/transcript";
import { getBalance, refundVideo, spendForVideo } from "@/lib/credits";
import { creditsForDuration, MAX_VIDEO_SECONDS, TRIAL_MAX_SECONDS } from "@/lib/pricing";

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
      throw new ApiError("TOO_LONG", "This video is longer than 3 hours. Please try a shorter one.", 422);
    }

    // 2. Already processed by this user? Re-opening is free and doesn't count.
    const { data: existing } = await db
      .from("usage")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", videoId)
      .maybeSingle();
    if (cached && existing) return NextResponse.json({ video: cached });

    // 3. Fetch + cache the transcript only if we don't have it.
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
        throw new ApiError("TOO_LONG", "This video is longer than 3 hours. Please try a shorter one.", 422);
      }
    }

    // 4. Charge credits by video length. Trial credits only cover short videos.
    const cost = creditsForDuration(video.duration_seconds);
    const useTrial = video.duration_seconds <= TRIAL_MAX_SECONDS;
    const balance = await getBalance(user.id);
    const spendable = balance.sub + balance.topup + (useTrial ? balance.trial : 0);
    if (spendable < cost) {
      const onlyTrial = !useTrial && balance.trial > 0 && balance.sub + balance.topup === 0;
      throw new ApiError(
        onlyTrial ? "UPGRADE_REQUIRED" : "INSUFFICIENT_CREDITS",
        onlyTrial
          ? "Your free trial covers videos up to 15 minutes. Upgrade to Pro or buy credits for longer videos."
          : `This video needs ${cost} credit${cost > 1 ? "s" : ""} and you have ${spendable}. Upgrade to Pro or buy credits to continue.`,
        402,
        { needed: cost, balance: spendable }
      );
    }
    if (!(await spendForVideo(user.id, videoId, cost, useTrial))) {
      throw new ApiError("INSUFFICIENT_CREDITS", "Not enough credits. Upgrade to Pro or buy credits to continue.", 402, { needed: cost, balance: spendable });
    }

    // 5. Record usage (unique per user+video). If this fails, give the credits back.
    const { error: usageErr } = await db
      .from("usage")
      .upsert({ user_id: user.id, video_id: videoId }, { onConflict: "user_id,video_id", ignoreDuplicates: true });
    if (usageErr) {
      await refundVideo(user.id, videoId);
      throw usageErr;
    }

    return NextResponse.json({ video });
  } catch (e) {
    return errorResponse(e);
  }
}
