import "server-only";
import { ApiError } from "@/lib/api";

export type FetchedTranscript = {
  title: string;
  transcript: string;
  language: string | null;
  durationSeconds: number;
};

type SupadataChunk = { text: string; offset: number; duration: number; lang?: string };

async function fetchTitle(videoId: string): Promise<string> {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (res.ok) {
      const j = (await res.json()) as { title?: string };
      if (j.title) return j.title;
    }
  } catch {
    /* fall through */
  }
  return `YouTube video ${videoId}`;
}

/** Fetches the transcript via Supadata (paid API). Only native captions: no AI-generated transcripts. */
export async function fetchTranscript(videoId: string): Promise<FetchedTranscript> {
  const key = process.env.TRANSCRIPT_API_KEY;
  if (!key) throw new ApiError("UPSTREAM", "Transcript service is not configured.", 503);

  const url = new URL("https://api.supadata.ai/v1/youtube/transcript");
  url.searchParams.set("url", `https://www.youtube.com/watch?v=${videoId}`);
  url.searchParams.set("text", "false");
  url.searchParams.set("mode", "native");

  let res: Response;
  try {
    res = await fetch(url, { headers: { "x-api-key": key }, signal: AbortSignal.timeout(30000) });
  } catch {
    throw new ApiError("UPSTREAM", "The transcript service is not responding. Please try again in a minute.", 502);
  }

  if (res.status === 404) throw new ApiError("NOT_FOUND", "We couldn't find that video. Is it public?", 404);
  if (res.status === 206 || res.status === 202) {
    throw new ApiError("NO_CAPTIONS", "This video has no captions, so we can't process it yet.", 422);
  }
  if (res.status === 429) throw new ApiError("UPSTREAM", "We're busy right now. Please try again shortly.", 503);
  if (!res.ok) {
    // Supadata reports missing transcripts as 4xx with an error code in the body.
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    if (body?.error && /transcript-unavailable/i.test(body.error)) {
      throw new ApiError("NO_CAPTIONS", "This video has no captions, so we can't process it yet.", 422);
    }
    throw new ApiError("UPSTREAM", "Couldn't fetch the transcript. Please try again.", 502);
  }

  const data = (await res.json()) as { content?: SupadataChunk[] | string; lang?: string };
  const chunks = Array.isArray(data.content) ? data.content : [];
  const transcript = chunks.map((c) => c.text.replace(/\s+/g, " ").trim()).filter(Boolean).join(" ");
  if (!transcript) throw new ApiError("NO_CAPTIONS", "This video has no captions, so we can't process it yet.", 422);

  const last = chunks[chunks.length - 1];
  const durationSeconds = last ? Math.ceil((last.offset + last.duration) / 1000) : 0;
  const title = await fetchTitle(videoId);

  return { title, transcript, language: data.lang ?? null, durationSeconds };
}
