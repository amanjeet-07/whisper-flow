import { env, pipeline, type AutomaticSpeechRecognitionPipeline } from "@huggingface/transformers";
import { WaveFile } from "wavefile";
import { appConfig } from "@/config/app.config";

// transformers.js defaults its model cache to a path inside node_modules,
// which is read-only on Vercel's serverless filesystem (only /tmp is
// writable). Without this, the first transcribe request in production
// crashes trying to cache the downloaded model.
if (process.env.VERCEL) {
  env.cacheDir = "/tmp/transformers-cache";
}

declare global {
  // eslint-disable-next-line no-var
  var __sttPipelinePromise: Promise<AutomaticSpeechRecognitionPipeline> | undefined;
}

function getPipeline(): Promise<AutomaticSpeechRecognitionPipeline> {
  if (!globalThis.__sttPipelinePromise) {
    // Casting the function itself sidesteps a TS overload-resolution blowup
    // ("union type too complex") in @huggingface/transformers' pipeline() typing.
    const untypedPipeline = pipeline as (...args: unknown[]) => Promise<AutomaticSpeechRecognitionPipeline>;
    globalThis.__sttPipelinePromise = untypedPipeline("automatic-speech-recognition", appConfig.sttModel, {
      dtype: appConfig.dtype,
      session_options: { interOpNumThreads: 1, intraOpNumThreads: 1 },
    });
  }
  return globalThis.__sttPipelinePromise;
}

function decodeWavTo16kMono(buffer: Buffer): Float32Array {
  const wav = new WaveFile(buffer);
  wav.toBitDepth("32f");
  wav.toSampleRate(16_000);
  const samples = wav.getSamples(false, Float32Array);
  const channelData = Array.isArray(samples) ? samples[0] : samples;
  return channelData as Float32Array;
}

/** Transcribes a WAV buffer to raw text. Returns "" for empty/silent input. */
export async function transcribe(wavBuffer: Buffer): Promise<string> {
  const audio = decodeWavTo16kMono(wavBuffer);

  if (audio.length === 0 || audio.every((sample) => sample === 0)) {
    return "";
  }

  const transcriber = await getPipeline();
  const output = await transcriber(audio);
  const result = Array.isArray(output) ? output[0] : output;
  return (result?.text ?? "").trim();
}
