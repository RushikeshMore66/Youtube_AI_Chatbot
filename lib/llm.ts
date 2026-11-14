import "server-only";
import Groq from "groq-sdk";
import { ApiError } from "@/lib/api";

export const MODEL = "llama-3.3-70b-versatile";
/** Transcripts up to this many characters go to the model in one prompt (~12k tokens). */
export const SINGLE_PASS_CHARS = 48_000;
const CHUNK_CHARS = 24_000;

export type OutputType = "summary" | "notes" | "post";

let client: Groq | null = null;
function groq() {
  if (!process.env.GROQ_API_KEY) throw new ApiError("UPSTREAM", "The AI service is not configured.", 503);
  return (client ??= new Groq({ apiKey: process.env.GROQ_API_KEY, timeout: 45_000 }));
}

export async function complete(
  messages: { role: "system" | "user" | "assistant"; content: string }[],
  maxTokens = 1500
): Promise<string> {
  try {
    const r = await groq().chat.completions.create({ model: MODEL, messages, temperature: 0.3, max_tokens: maxTokens });
    const text = r.choices[0]?.message?.content?.trim();
    if (!text) throw new Error("empty completion");
    return text;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    console.error("Groq error:", e);
    throw new ApiError("UPSTREAM", "The AI service is busy or unavailable. Please try again in a moment.", 502);
  }
}

const STYLE =
  "Use plain text only: no markdown symbols (no #, *, or **). Use short paragraphs and '-' for bullet points. " +
  "Write in English unless the transcript is in another language, in which case write in that language. " +
  "Use only information from the transcript; never invent facts.";

const PROMPTS: Record<OutputType, string> = {
  summary:
    "Write a clear summary of this YouTube video: one short paragraph of overview, then 5-8 bullet points with the key takeaways. " +
    STYLE,
  notes:
    "Turn this YouTube video into structured study notes: short section headings in CAPS, with concise bullet points under each. " +
    "Include important definitions, numbers, steps and examples. " +
    STYLE,
  post:
    "Write a LinkedIn post based on this YouTube video: a strong first line hook, 3-5 short paragraphs or bullets with the main insights, " +
    "and a closing question for engagement. Max 220 words. Add 3-4 relevant hashtags at the end. " +
    STYLE,
};

export function chunkText(text: string, size = CHUNK_CHARS): string[] {
  const chunks: string[] = [];
  let i = 0;
  while (i < text.length) {
    let end = Math.min(i + size, text.length);
    if (end < text.length) {
      const space = text.lastIndexOf(" ", end);
      if (space > i + size * 0.5) end = space;
    }
    chunks.push(text.slice(i, end).trim());
    i = end;
  }
  return chunks.filter(Boolean);
}

/** If the transcript is long: summarize each chunk, then merge the partial notes. */
async function condense(transcript: string): Promise<string> {
  if (transcript.length <= SINGLE_PASS_CHARS) return transcript;
  const chunks = chunkText(transcript);
  const partials: string[] = [];
  for (const [n, chunk] of chunks.entries()) {
    partials.push(
      await complete(
        [
          {
            role: "system",
            content: "Summarize this part of a video transcript into detailed bullet points that keep all key facts, numbers, steps and examples. Plain text only.",
          },
          { role: "user", content: `Part ${n + 1} of ${chunks.length}:\n\n${chunk}` },
        ],
        1200
      )
    );
  }
  return partials.map((p, n) => `[Part ${n + 1}]\n${p}`).join("\n\n");
}

export async function generateOutput(type: OutputType, title: string, transcript: string): Promise<string> {
  const material = await condense(transcript);
  return complete(
    [
      { role: "system", content: PROMPTS[type] },
      { role: "user", content: `Video title: ${title}\n\nTranscript:\n${material}` },
    ],
    type === "post" ? 700 : 1500
  );
}
