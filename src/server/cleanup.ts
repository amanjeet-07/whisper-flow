import { appConfig } from "@/config/app.config";
import { cleanWithGroq } from "./groqClient";

const FILLER_PATTERN =
  /,?\s*\b(um+|uh+|erm+)\b,?|,?\s*\blike\b,?|,?\s*\byou know\b,?|,?\s*\bi mean\b,?/gi;

type Formatter = "groq" | "regex";

export interface CleanupResult {
  raw: string;
  cleaned: string;
  usedLlm: boolean;
  formatter: Formatter;
}

export function regexClean(text: string): string {
  let result = text.replace(FILLER_PATTERN, " ");
  result = result.replace(/\s+/g, " ").trim();
  result = result.replace(/\s+([,.!?])/g, "$1");
  result = result.replace(/,(\s*,)+/g, ",");
  result = result.replace(/^[,.\s]+/, "").replace(/[,\s]+$/, "");

  if (result.length === 0) return result;

  result = result
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.charAt(0).toUpperCase() + sentence.slice(1))
    .join(" ");

  if (!/[.!?]$/.test(result)) {
    result += ".";
  }

  return result;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export async function cleanup(raw: string): Promise<CleanupResult> {
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return { raw: trimmed, cleaned: "", usedLlm: false, formatter: "regex" };
  }

  const regexResult = regexClean(trimmed);

  if (wordCount(trimmed) < appConfig.cleanup.minWordsForLLM) {
    return { raw: trimmed, cleaned: regexResult, usedLlm: false, formatter: "regex" };
  }

  const groqResult = await cleanWithGroq(trimmed);
  if (groqResult === null) {
    return { raw: trimmed, cleaned: regexResult, usedLlm: false, formatter: "regex" };
  }

  return { raw: trimmed, cleaned: groqResult, usedLlm: true, formatter: "groq" };
}
