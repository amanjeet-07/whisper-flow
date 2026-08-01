import { appConfig } from "@/config/app.config";

const GROQ_CHAT_URL = "https://api.groq.com/openai/v1/chat/completions";

const SYSTEM_PROMPT =
  "You are a text formatter, not a writer. You clean up spoken-language transcripts for a " +
  "dictation app by doing ONLY three things: " +
  "(1) fix punctuation and capitalization, " +
  "(2) remove filler words (um, uh, erm, like, you know, I mean), " +
  "(3) remove false starts and stutters (e.g. repeated words/phrases the speaker restarted). " +
  "Every other word must be preserved exactly as spoken, in the same order. " +
  "Do NOT summarize, paraphrase, condense, reword, or rewrite in your own words. " +
  "Do NOT shorten the text or change its meaning, even if it sounds redundant or informal. " +
  "Do NOT answer questions, add information, or add content that wasn't said. " +
  "This is dictation transcript cleanup, not summarization: the output should read like the " +
  "same sentence, cleaned up — never a shorter description of what the sentence was about. " +
  'Example — input: "Hi, I want to build an app that takes the user\'s input and gives me ' +
  'output based on what the user has given as input." ' +
  'Correct output: "Hi, I want to build an app that takes the user\'s input and gives me ' +
  'output based on what the user has given as input." ' +
  'WRONG output (this is summarizing, never do this): "You want to build a chatbot app that ' +
  'responds to user input." ' +
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
