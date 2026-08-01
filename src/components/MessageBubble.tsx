"use client";

import { useState } from "react";
import type { ChatMessage } from "@/lib/types";

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.cleaned);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback silently
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-msg-in w-full">
      {/* ── User bubble (right-aligned) ── */}
      <div className="flex w-full justify-end gap-3">
        <div className="flex flex-col items-end gap-1.5 max-w-[80%]">
          <div className="rounded-2xl rounded-tr-sm bg-[var(--color-accent)] px-4 py-3 text-[var(--color-accent-contrast)] shadow-md shadow-[var(--color-accent)]/10">
            <p className="whitespace-pre-wrap leading-relaxed">{message.raw}</p>
          </div>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--color-surface-2)] shadow-sm">
          <img src="/images/user.png" alt="User" className="h-full w-full object-cover" />
        </div>
      </div>

      {/* ── AI bubble (left-aligned) ── */}
      <div className="flex w-full justify-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)] shadow-sm">
          <img src="/images/wspr.png" alt="WhisperFlow" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col items-start gap-1.5 max-w-[80%]">
          <div className="rounded-2xl rounded-tl-sm border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)] px-4 py-3 shadow-lg shadow-[var(--color-ai-glow)]">
            <p className="whitespace-pre-wrap leading-relaxed text-[var(--color-text)]">
              {message.cleaned}
            </p>
          </div>
          <div className="ml-1 flex items-center gap-2 text-xs text-[var(--color-text-muted)] mt-0.5">
            <span className="flex items-center gap-1 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-2)] px-2.5 py-0.5">
              {message.formatter === "groq" ? (
                <>✨ cleaned by groq</>
              ) : (
                <>
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                  </svg>
                  cleanup fallback
                </>
              )}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              aria-label="Copy to clipboard"
              className="flex items-center justify-center rounded-md p-1 transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] focus-visible:outline focus-visible:outline-1 focus-visible:outline-[var(--color-accent)]"
            >
              {copied ? (
                <svg className="h-3.5 w-3.5 text-green-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
