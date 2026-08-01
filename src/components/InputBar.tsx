"use client";

import { useState, type KeyboardEvent, type RefObject } from "react";
import { MicButton } from "./MicButton";
import { MicLevelMeter } from "./MicLevelMeter";
import type { MicState } from "@/hooks/useRecorder";

interface InputBarProps {
  onSend: (text: string) => void;
  micState: MicState;
  elapsedMs: number;
  onMicClick: () => void;
  micReady: boolean;
  audioLevelRef: RefObject<number>;
  disabled: boolean;
}

export function InputBar({
  onSend,
  micState,
  elapsedMs,
  onMicClick,
  micReady,
  audioLevelRef,
  disabled,
}: InputBarProps) {
  const [value, setValue] = useState("");

  const submit = () => {
    const trimmed = value.trim();
    if (trimmed.length === 0) return;
    onSend(trimmed);
    setValue("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="glass flex items-end gap-3 rounded-2xl p-2 shadow-lg shadow-black/20">
      <div className="relative flex-1 self-stretch">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          disabled={disabled}
          className="max-h-32 w-full resize-none bg-transparent px-3 py-2.5 text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:opacity-50"
        />
        {micState === "recording" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-[var(--color-surface-1)]">
            <MicLevelMeter active audioLevelRef={audioLevelRef} />
          </div>
        )}
      </div>
      <MicButton
        state={micState}
        elapsedMs={elapsedMs}
        onClick={onMicClick}
        micReady={micReady}
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || value.trim().length === 0}
        aria-label="Send message"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-[var(--color-accent-contrast)] transition-all hover:opacity-90 hover:shadow-md hover:shadow-[var(--color-accent)]/20 disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3.4 20.6 21 12 3.4 3.4 3 10l12 2-12 2 .4 6.6Z" />
        </svg>
      </button>
    </div>
  );
}
