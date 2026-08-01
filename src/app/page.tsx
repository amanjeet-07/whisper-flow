"use client";

import { useCallback, useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { MessageList } from "@/components/MessageList";
import { InputBar } from "@/components/InputBar";
import { useChats } from "@/hooks/useChats";
import { useRecorder } from "@/hooks/useRecorder";
import { postClean, postTranscribe } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";

export default function Home() {
  const { chats, activeChatId, setActiveChatId, newChat, removeChat, renameChat, appendMessage, ensureActiveChat } =
    useChats();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeChat = chats.find((c) => c.id === activeChatId) ?? null;

  const showError = useCallback((message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  }, []);

  const handleSendText = useCallback(
    async (text: string) => {
      const chatId = ensureActiveChat();
      setIsLoading(true);
      try {
        const result = await postClean(text);
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          raw: result.raw,
          cleaned: result.cleaned,
          usedLlm: result.usedLlm,
          formatter: result.formatter,
          source: "text",
          createdAt: new Date().toISOString(),
        };
        appendMessage(chatId, message);
      } catch {
        showError("Something went wrong reaching the backend. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [ensureActiveChat, appendMessage, showError],
  );

  const handleVoiceResult = useCallback(
    async (wav: Blob) => {
      const chatId = ensureActiveChat();
      setIsLoading(true);
      try {
        const result = await postTranscribe(wav);
        const message: ChatMessage = {
          id: crypto.randomUUID(),
          raw: result.raw,
          cleaned: result.cleaned,
          usedLlm: result.usedLlm,
          formatter: result.formatter,
          source: "voice",
          createdAt: new Date().toISOString(),
        };
        appendMessage(chatId, message);
      } catch {
        showError("Something went wrong reaching the backend. Please try again.");
      } finally {
        setIsLoading(false);
      }
    },
    [ensureActiveChat, appendMessage, showError],
  );

  const { micState, elapsedMs, toggle, micReady, audioLevelRef } = useRecorder({
    onResult: handleVoiceResult,
    onError: showError,
  });

  return (
    <div className="flex h-dvh w-full overflow-hidden">
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelect={setActiveChatId}
        onNewChat={newChat}
        onDelete={removeChat}
        onRename={renameChat}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        {/* ── Centered header with logo ── */}
        <header className="glass flex items-center justify-center gap-2.5 border-b border-[var(--glass-border)] px-6 py-3.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--color-surface-2)] shadow-sm">
            <img src="/images/wspr.png" alt="WhisperFlow" className="h-full w-full object-cover" />
          </div>
          <h1 className="font-display text-lg font-semibold tracking-tight">WhisperFlow</h1>
        </header>

        {/* ── Chat messages ── */}
        <div className="flex-1 overflow-y-auto px-6">
          <div className="mx-auto max-w-3xl h-full">
            <MessageList messages={activeChat?.messages ?? []} isLoading={isLoading} />
          </div>
        </div>

        {/* ── Input bar ── */}
        <div className="px-6 pb-6 pt-2">
          <div className="mx-auto max-w-3xl">
            {error && (
              <div
                role="alert"
                className="mb-3 rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 px-4 py-2.5 text-sm text-[var(--color-danger)]"
              >
                {error}
              </div>
            )}
            <InputBar
              onSend={handleSendText}
              micState={micState}
              elapsedMs={elapsedMs}
              onMicClick={toggle}
              micReady={micReady}
              audioLevelRef={audioLevelRef}
              disabled={isLoading}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
