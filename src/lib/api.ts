import type { CleanResponse, TranscribeResponse } from "./types";

async function parseOrThrow<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed with ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export async function postClean(text: string): Promise<CleanResponse> {
  const res = await fetch("/api/clean", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return parseOrThrow<CleanResponse>(res);
}

export async function postTranscribe(file: Blob): Promise<TranscribeResponse> {
  const formData = new FormData();
  formData.append("file", file, "recording.wav");
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  });
  return parseOrThrow<TranscribeResponse>(res);
}
