"use client";

import { useCallback, useRef, useState } from "react";
import { useMicVAD } from "@ricky0123/vad-react";
import { appConfig } from "@/config/app.config";
import { encodeWav } from "@/lib/wav";

export type MicState = "idle" | "recording" | "processing";

interface UseRecorderOptions {
  onResult: (wav: Blob) => Promise<void> | void;
  onError: (message: string) => void;
}

function computeRms(frame: Float32Array): number {
  let sumSquares = 0;
  for (let i = 0; i < frame.length; i++) {
    sumSquares += frame[i] * frame[i];
  }
  return Math.sqrt(sumSquares / frame.length);
}

export function useRecorder({ onResult, onError }: UseRecorderOptions) {
  const [micState, setMicState] = useState<MicState>("idle");
  const [elapsedMs, setElapsedMs] = useState(0);
  const framesRef = useRef<Float32Array[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(0);
  // Driven directly from each VAD frame (10-30x/sec) rather than React
  // state — a meter component polls this via requestAnimationFrame so
  // the mic level doesn't force the whole page to re-render every frame.
  const audioLevelRef = useRef(0);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setElapsedMs(0);
  }, []);

  const vad = useMicVAD({
    startOnLoad: false,
    baseAssetPath: "/vad/",
    onnxWASMBasePath: "/vad/",
    // Without this, calling vad.pause() (our stop()) discards any
    // in-progress speech instead of finalizing it — the recording is
    // thrown away unless the user stays silent for ~1.4s before
    // clicking stop, which is why every take reported "no speech".
    submitUserSpeechOnPause: true,
    onSpeechStart: () => {
      // frames accumulate via onSpeechEnd per speech segment
    },
    onSpeechEnd: (audio: Float32Array) => {
      framesRef.current.push(audio);
    },
    onVADMisfire: () => {
      // ignore short non-speech blips
    },
    onFrameProcessed: (_probs, frame) => {
      // Cheap attack/slow decay smoothing so the meter reacts instantly
      // to speech but doesn't flicker to zero between syllables.
      const level = Math.min(1, computeRms(frame) * 6);
      audioLevelRef.current =
        level > audioLevelRef.current
          ? level
          : audioLevelRef.current * 0.75 + level * 0.25;
    },
  });

  const start = useCallback(async () => {
    if (appConfig.holdToTalk) {
      // hold-to-talk callers invoke start()/stop() directly on press/release
    }
    // The speech-detection model is tens of MB of ONNX/WASM and loads
    // async after mount. vad.start() silently no-ops while vad.loading
    // is true instead of rejecting, so without this guard the UI would
    // flip to "recording" and run the timer while nothing is actually
    // being captured — guaranteeing "no speech detected" on every take
    // for anyone who clicks before the model finishes loading.
    if (vad.loading || vad.errored) {
      onError(
        vad.errored
          ? "Voice input failed to load. Please refresh the page."
          : "Voice input is still loading. Try again in a moment."
      );
      return;
    }
    try {
      framesRef.current = [];
      audioLevelRef.current = 0;
      await vad.start();
      setMicState("recording");
      startRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - startRef.current);
      }, 200);
    } catch {
      onError("Microphone permission was denied. Allow mic access and try again.");
      setMicState("idle");
    }
  }, [vad, onError]);

  const stop = useCallback(async () => {
    stopTimer();
    setMicState("processing");
    audioLevelRef.current = 0;
    // pause() is async: with submitUserSpeechOnPause it synchronously
    // finalizes the in-progress segment and fires onSpeechEnd, but that
    // callback only lands once this promise's microtasks run — reading
    // framesRef before awaiting here would race it and see an empty array.
    await vad.pause();

    const frames = framesRef.current;
    framesRef.current = [];

    const totalLength = frames.reduce((sum, f) => sum + f.length, 0);
    if (totalLength === 0) {
      setMicState("idle");
      onError("No speech detected. Try speaking closer to the microphone.");
      return;
    }

    const merged = new Float32Array(totalLength);
    let offset = 0;
    for (const frame of frames) {
      merged.set(frame, offset);
      offset += frame.length;
    }

    try {
      const wav = encodeWav(merged);
      await onResult(wav);
    } finally {
      setMicState("idle");
    }
  }, [vad, onResult, onError, stopTimer]);

  const toggle = useCallback(() => {
    if (micState === "idle") {
      void start();
    } else if (micState === "recording") {
      void stop();
    }
  }, [micState, start, stop]);

  return {
    micState,
    elapsedMs,
    start,
    stop,
    toggle,
    micReady: !vad.loading && !vad.errored,
    vadLoading: vad.loading,
    vadErrored: vad.errored,
    audioLevelRef,
  };
}
