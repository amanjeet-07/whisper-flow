export function LoadingIndicator() {
  return (
    <div className="flex w-full justify-start gap-3 animate-msg-in">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)] shadow-sm">
        <img src="/images/wspr.png" alt="WhisperFlow" className="h-full w-full object-cover" />
      </div>
      <div className="flex flex-col items-start gap-1.5 max-w-[80%]">
        <div
          className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)] px-5 py-4 shadow-lg shadow-[var(--color-ai-glow)]"
          aria-label="Loading response"
        >
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-bounce-dot [animation-delay:-0.3s]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-bounce-dot [animation-delay:-0.15s]" />
          <span className="h-2 w-2 rounded-full bg-[var(--color-accent)] animate-bounce-dot" />
        </div>
      </div>
    </div>
  );
}
