"use client";

import { useCallback, useEffect, useState } from "react";
import type { Chat, ChatMessage } from "@/lib/types";

const STORAGE_KEY = "wispr-flow-chats";

function loadLocal(): Chat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Chat[]) : [];
  } catch {
    return [];
  }
}

function saveLocal(chats: Chat[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(chats));
}

function makeChat(): Chat {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: "New chat",
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

export function useChats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  useEffect(() => {
    const local = loadLocal();
    if (local.length > 0) {
      setChats(local);
      setActiveChatId(local[0].id);
    }
  }, []);

  // Persist on every change instead of pairing each mutator with its own
  // read-then-write of `chats` from render scope — mutators below use
  // functional setState updates so they always see the true current state,
  // not a stale closure snapshot (see newChat/appendMessage).
  useEffect(() => {
    saveLocal(chats);
  }, [chats]);

  const newChat = useCallback(() => {
    const chat = makeChat();
    setChats((prev) => [chat, ...prev]);
    setActiveChatId(chat.id);
    return chat.id;
  }, []);

  const removeChat = useCallback((id: string) => {
    setChats((prev) => {
      const next = prev.filter((c) => c.id !== id);
      setActiveChatId((current) => (current === id ? (next[0]?.id ?? null) : current));
      return next;
    });
  }, []);

  const appendMessage = useCallback((chatId: string, message: ChatMessage) => {
    // Functional update: without this, a message sent right after
    // ensureActiveChat() creates a brand-new chat can run against a closure
    // where `chats` was still empty (captured before that chat existed),
    // silently discarding both the new chat and the message.
    setChats((prev) =>
      prev.map((c) => {
        if (c.id !== chatId) return c;
        const isFirstMessage = c.messages.length === 0;
        return {
          ...c,
          title: isFirstMessage ? message.cleaned.slice(0, 40) || "New chat" : c.title,
          messages: [...c.messages, message],
          updatedAt: new Date().toISOString(),
        };
      }),
    );
  }, []);

  const ensureActiveChat = useCallback(() => {
    if (activeChatId && chats.some((c) => c.id === activeChatId)) return activeChatId;
    return newChat();
  }, [activeChatId, chats, newChat]);

  const renameChat = useCallback((id: string, newTitle: string) => {
    setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)));
  }, []);

  return {
    chats,
    activeChatId,
    setActiveChatId,
    newChat,
    removeChat,
    renameChat,
    appendMessage,
    ensureActiveChat,
  };
}
