"use client";

import type { MicState } from "@/hooks/useRecorder";

interface MicButtonProps {
  state: MicState;
  elapsedMs: number;
  onClick: () => void;
  micReady: boolean;
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function MicButton({ state, elapsedMs, onClick, micReady }: MicButtonProps) {
  const disabled = state === "processing" || (!micReady && state === "idle");

  return (
    <div className="flex items-center gap-2">
      {state === "recording" && (
        <span className="text-xs font-mono text-[var(--color-accent)] tabular-nums">
          {formatElapsed(elapsedMs)}
        </span>
      )}
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={!micReady && state === "idle" ? "Voice input is loading…" : undefined}
        aria-label={state === "recording" ? "Stop recording" : "Start recording"}
        className={[
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
          state === "idle" && "bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] text-[var(--color-text)]",
          state === "recording" && "bg-[var(--color-danger)] text-white animate-pulse-ring",
          state === "processing" && "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] cursor-not-allowed opacity-60",
          state === "idle" && !micReady && "cursor-not-allowed opacity-40",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {state === "processing" ? (
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-90" d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Z" />
            <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V21H9a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2h-2v-3.07A7 7 0 0 0 19 11Z" />
          </svg>
        )}
      </button>
    </div>
  );
}
