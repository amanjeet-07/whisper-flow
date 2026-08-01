import { appConfig } from "@/config/app.config";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT =
  "You clean up spoken-language transcripts for a dictation app. " +
  "Fix punctuation and casing, and remove filler words (um, uh, erm, like, you know, I mean). " +
  "Keep the wording otherwise unchanged. Never answer questions or add content that wasn't said. " +
  "Return only the cleaned text, with no quotes, preamble, or explanation.";

let warnedMissingKey = false;

function stripWrappingQuotes(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^["']([\s\S]*)["']$/);
  return match ? match[1].trim() : trimmed;
}

/** Returns cleaned text, or null on any failure (missing key, timeout, HTTP error) — caller falls back to regex. */
export async function cleanWithGroq(raw: string): Promise<string | null> {
  const apiKey = process.env[appConfig.cleanup.apiKeyEnv];
  if (!apiKey) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        `${appConfig.cleanup.apiKeyEnv} is not set — transcript cleanup falls back to the regex tier. ` +
          "Add it to .env.local to enable Groq formatting.",
      );
    }
    return null;
  }

  try {
    const res = await fetch(GROQ_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: appConfig.cleanup.model,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: raw },
        ],
      }),
      signal: AbortSignal.timeout(appConfig.cleanup.timeoutMs),
    });

    if (!res.ok) return null;

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string" || content.trim().length === 0) return null;

    return stripWrappingQuotes(content);
  } catch {
    return null;
  }
}
