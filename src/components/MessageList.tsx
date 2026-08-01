import type { ChatMessage } from "@/lib/types";
import { MessageBubble } from "./MessageBubble";
import { LoadingIndicator } from "./LoadingIndicator";

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[var(--color-ai-border)] bg-[var(--color-ai-surface)] shadow-sm animate-msg-in">
          <img src="/images/wspr.png" alt="WhisperFlow" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="font-display text-2xl font-semibold text-[var(--color-text)]">
            Say something.
          </p>
          <p className="max-w-sm text-sm text-[var(--color-text-muted)]">
            Type below or tap the mic to dictate. Your words get cleaned up automatically by AI.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      {isLoading && <LoadingIndicator />}
    </div>
  );
}
