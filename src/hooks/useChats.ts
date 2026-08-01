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

  const persist = useCallback((next: Chat[]) => {
    setChats(next);
    saveLocal(next);
  }, []);

  const newChat = useCallback(() => {
    const chat = makeChat();
    persist([chat, ...chats]);
    setActiveChatId(chat.id);
    return chat.id;
  }, [chats, persist]);

  const removeChat = useCallback(
    (id: string) => {
      const next = chats.filter((c) => c.id !== id);
      persist(next);
      if (activeChatId === id) {
        setActiveChatId(next[0]?.id ?? null);
      }
    },
    [chats, activeChatId, persist],
  );

  const appendMessage = useCallback(
    (chatId: string, message: ChatMessage) => {
      const next = chats.map((c) => {
        if (c.id !== chatId) return c;
        const isFirstMessage = c.messages.length === 0;
        return {
          ...c,
          title: isFirstMessage ? message.cleaned.slice(0, 40) || "New chat" : c.title,
          messages: [...c.messages, message],
          updatedAt: new Date().toISOString(),
        };
      });
      persist(next);
    },
    [chats, persist],
  );

  const ensureActiveChat = useCallback(() => {
    if (activeChatId && chats.some((c) => c.id === activeChatId)) return activeChatId;
    return newChat();
  }, [activeChatId, chats, newChat]);

  const renameChat = useCallback(
    (id: string, newTitle: string) => {
      const next = chats.map((c) => (c.id === id ? { ...c, title: newTitle } : c));
      persist(next);
    },
    [chats, persist],
  );

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
