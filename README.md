# WhisperFlow Clone

A local-first WhisperFlow-style dictation web app built on **Next.js 15 + React 19 + TypeScript**.

Pipeline: mic (client-side Silero VAD) or typed text → **local Whisper STT** (Transformers.js,
server-side, fully offline after the first model download) → **Groq** transcript cleanup →
cleaned message rendered in a chat UI. Chat history lives in the browser's `localStorage`.

The only external dependency needed to run the site is a **Groq API key**.

## Features

- **Voice dictation** — tap the mic, speak, tap again. Client-side Silero VAD (via
  `@ricky0123/vad-react`) detects speech boundaries so silence isn't sent for transcription. The
  mic button is disabled with a loading state until the VAD model finishes loading, and a live
  10-bar equalizer meter (`MicLevelMeter`) renders centered in the input box while recording, driven
  directly off each audio frame's RMS level.
- **Text input** as a fallback/alternative to voice, sharing the same Groq cleanup pipeline.
- **Multi-chat sidebar** — create, rename, and delete chats; history persists per-browser in
  `localStorage` (see [Privacy](#privacy) for what is/isn't sent off-device).
- **Graceful degradation** — no Groq key, Groq down, or a too-short transcript all fall back to a
  built-in regex cleaner instead of failing the request.

## Privacy

- **Audio never leaves your machine.** Recording, voice-activity detection, and speech-to-text all
  run locally (VAD in the browser, Whisper on the local Node server).
- **Transcript text is sent to Groq** for punctuation/filler cleanup — text only, never audio.
  Inputs under 10 words skip Groq entirely, and if Groq is unreachable (or no key is set) the app
  falls back to a built-in regex cleaner. Nothing else is sent anywhere.

## Requirements

- **Node.js 20+** and npm
- A **Groq API key** — free at [console.groq.com/keys](https://console.groq.com/keys)

## Setup (macOS, zsh)

```zsh
git clone <this-repo>
cd "Wispr Flow Clone"
npm install          # postinstall copies Silero VAD assets into public/vad/

echo 'GROQ_API_KEY=gsk_your_key_here' > .env.local

npm run dev
```

Open http://localhost:3000. The first voice request downloads the Whisper model weights to a local
cache (one-time); all STT after that is fully offline.

No key? The app still runs — cleanup just uses the regex tier and bubbles show a
"cleanup fallback" badge.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the app (frontend + API routes) at `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Run the production build |
| `npm test` | Run the Vitest suite (STT and Groq fully mocked, zero network) |
| `npm run dry-run` | Run `assets/sample.wav` through STT → cleanup and print the transcript |
| `npm run make-sample` | Regenerate `assets/sample.wav` with macOS `say` + `afconvert` |

## Configuration

All tunables live in `src/config/app.config.ts`:

```ts
export const appConfig: AppConfig = {
  sttModel: "onnx-community/whisper-tiny.en", // or whisper-base / whisper-small / whisper-large-v3-turbo
  dtype: "q8",
  cleanup: {
    model: "llama-3.1-8b-instant", // Groq model for transcript cleanup
    apiKeyEnv: "GROQ_API_KEY",     // read server-side only; never exposed to the browser
    timeoutMs: 10_000,
    minWordsForLLM: 10,            // inputs under 10 words skip Groq (regex cleanup still applies)
  },
  holdToTalk: false,               // true = hold the mic button instead of tap-to-toggle
};
```

Environment (`.env.local`, see `.env.example`): `GROQ_API_KEY` only. The key is server-only —
it is never prefixed `NEXT_PUBLIC_`, never logged, and never returned by any endpoint.

### VAD assets

Silero VAD's ONNX model and worklet/WASM runtime files are copied from `node_modules` into
`public/vad/` by the `postinstall` script (`scripts/copy-vad-assets.mjs`) and served locally —
no CDN requests.

## Deploying to Vercel

The app deploys zero-config as a standard Next.js project. Two things in `src/server/stt.ts` and
`src/app/api/transcribe/route.ts` already account for running Whisper inference in a serverless
function:

- **Model cache dir** — Transformers.js defaults its model cache to a path inside `node_modules`,
  which is read-only on Vercel (only `/tmp` is writable). `stt.ts` redirects the cache to
  `/tmp/transformers-cache` when `process.env.VERCEL` is set.
- **`maxDuration = 60`** on the transcribe route — a cold start has to download the Whisper model
  from Hugging Face before it can transcribe, which can exceed the default 10s function timeout.
  60s is the max allowed on Vercel's Hobby plan.

Steps:

1. Push this repo to GitHub. `public/vad/` is gitignored on purpose (see below) — don't force-add
   it — but double-check everything under `public/images/` and `src/` is actually committed.
2. In Vercel: **Add New → Project → Import** the repo. Framework preset auto-detects as Next.js;
   no build/output overrides are needed. Set **Root Directory** if this project isn't the repo root.
3. **Environment Variables** (Project Settings → Environment Variables): add `GROQ_API_KEY` — it's
   gitignored locally and won't come across automatically.
4. **Node.js version** (Project Settings → General): set to 20.x to match `engines.node` in
   `package.json`.
5. Deploy, then test on the live HTTPS URL. Expect the **first** transcription after any idle
   period to be noticeably slower than local dev: `/tmp` is wiped between cold starts, so the
   Whisper model (tens of MB) re-downloads from Hugging Face each time. That's an inherent tradeoff
   of on-request local inference on serverless, not a bug.

## Testing

```zsh
npm test
```

STT (`src/server/stt.ts`) and Groq (`src/server/groqClient.ts`) are mocked with `vi.mock`;
tests never touch the network or download models.
