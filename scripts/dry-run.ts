import { readFile } from "node:fs/promises";
import path from "node:path";
import { transcribe } from "../src/server/stt";
import { cleanup, wordCount } from "../src/server/cleanup";
import { appConfig } from "../src/config/app.config";

async function main() {
  const samplePath = path.join(process.cwd(), "assets", "sample.wav");
  console.log(`Loading ${samplePath}...`);
  const wavBuffer = await readFile(samplePath);

  console.log("Running STT...");
  const raw = await transcribe(wavBuffer);
  console.log(`Raw transcript: "${raw}"`);

  if (raw.length === 0) {
    console.log("No speech detected.");
    process.exitCode = 0;
    return;
  }

  const result = await cleanup(raw);
  console.log(`Cleaned transcript: "${result.cleaned}"`);

  if (result.formatter === "regex" && wordCount(raw) >= appConfig.cleanup.minWordsForLLM) {
    console.log("cleanup fallback: Groq unavailable (missing key, timeout, or error) — used regex tier");
  }
  console.log(`Formatter: ${result.formatter}`);

  process.exitCode = 0;
}

main().catch((err) => {
  console.error("dry-run failed:", err);
  process.exitCode = 1;
});
