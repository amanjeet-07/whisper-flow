"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import type { Chat } from "@/lib/types";

interface SidebarProps {
  chats: Chat[];
  activeChatId: string | null;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
}

export function Sidebar({ chats, activeChatId, onSelect, onNewChat, onDelete, onRename }: SidebarProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
    }
  }, [renamingId]);

  const submitRename = (id: string) => {
    if (editTitle.trim()) {
      onRename(id, editTitle.trim());
    }
    setRenamingId(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, id: string) => {
    if (e.key === "Enter") {
      submitRename(id);
    } else if (e.key === "Escape") {
      setRenamingId(null);
    }
  };

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface-0)]">
      {/* ── New Chat button ── */}
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-[var(--color-accent-light)] to-[var(--color-accent)] px-3 py-2.5 text-sm font-semibold text-[var(--color-accent-contrast)] shadow-md shadow-[var(--color-accent)]/25 transition-all hover:shadow-lg hover:shadow-[var(--color-accent)]/40 hover:brightness-110 active:scale-[0.98] active:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4a1 1 0 0 1 1 1v6h6a1 1 0 1 1 0 2h-6v6a1 1 0 1 1-2 0v-6H5a1 1 0 1 1 0-2h6V5a1 1 0 0 1 1-1Z" />
          </svg>
          New chat
        </button>
      </div>

      {/* ── Recent Chats label ── */}
      <div className="px-4 pb-2 pt-1">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
          Recent Chats
        </span>
      </div>

      {/* ── Chat list ── */}
      <nav className="flex-1 overflow-y-auto px-2 pb-3">
        {chats.length === 0 && (
          <p className="px-2 py-4 text-center text-xs text-[var(--color-text-muted)]">
            No chats yet
          </p>
        )}
        <ul className="flex flex-col gap-0.5">
          {chats.map((chat) => (
            <li key={chat.id} className="group relative">
              {renamingId === chat.id ? (
                <div className="flex w-full items-center px-3 py-2.5">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, chat.id)}
                    onBlur={() => submitRename(chat.id)}
                    className="w-full rounded bg-[var(--color-surface-3)] px-2 py-0.5 text-sm text-[var(--color-text)] outline-none ring-1 ring-[var(--color-accent)]"
                  />
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => onSelect(chat.id)}
                    className={[
                      "block w-full truncate rounded-lg px-3 py-2.5 pr-8 text-left text-sm transition-all",
                      chat.id === activeChatId
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text)] border-l-2 border-[var(--color-accent)]"
                        : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-text)]",
                    ].join(" ")}
                  >
                    {chat.title || "New chat"}
                  </button>
                  <div className="absolute right-1 top-1.5 hidden group-hover:flex items-start justify-end z-10 group/menu">
                    <button
                      type="button"
                      aria-label="Options"
                      className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-3)] hover:text-[var(--color-text)]"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="12" r="1.5" />
                        <circle cx="12" cy="5" r="1.5" />
                        <circle cx="12" cy="19" r="1.5" />
                      </svg>
                    </button>
                    <div className="absolute right-0 top-6 hidden w-28 flex-col overflow-hidden rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-0)] shadow-md group-hover/menu:flex animate-in fade-in zoom-in-95 duration-100">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditTitle(chat.title || "New chat");
                          setRenamingId(chat.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-text)] transition-colors hover:bg-[var(--color-surface-2)]"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                        Rename
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(chat.id);
                        }}
                        className="flex items-center gap-2 px-3 py-2 text-left text-xs font-medium text-[var(--color-danger)] transition-colors hover:bg-[var(--color-danger)]/10"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18" />
                          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                        </svg>
                        Delete
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
