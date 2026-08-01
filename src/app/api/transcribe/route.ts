import { NextRequest, NextResponse } from "next/server";
import { transcribe } from "@/server/stt";
import { cleanup } from "@/server/cleanup";

export const runtime = "nodejs";
// Cold starts download the Whisper model from Hugging Face before the
// first transcription can run — that can take longer than the default
// 10s limit. 60s is the max duration allowed on Vercel's Hobby plan.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const f = formData.get("file") as File | null;

  if (!f) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const totalStart = Date.now();
  const buffer = Buffer.from(await f.arrayBuffer());

  const sttStart = Date.now();
  const raw = await transcribe(buffer);
  const sttMs = Date.now() - sttStart;

  if (raw.length === 0) {
    return NextResponse.json({
      raw: "",
      cleaned: "No speech detected.",
      usedLlm: false,
      formatter: "regex",
      timings: { sttMs, cleanupMs: 0, totalMs: Date.now() - totalStart },
    });
  }

  const cleanupStart = Date.now();
  const result = await cleanup(raw);
  const cleanupMs = Date.now() - cleanupStart;

  return NextResponse.json({
    ...result,
    timings: { sttMs, cleanupMs, totalMs: Date.now() - totalStart },
  });
}
