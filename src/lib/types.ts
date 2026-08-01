export type Formatter = "groq" | "regex";

interface CleanupTimings {
  sttMs?: number;
  cleanupMs: number;
  totalMs: number;
}

export interface TranscribeResponse {
  raw: string;
  cleaned: string;
  usedLlm: boolean;
  formatter: Formatter;
  timings: CleanupTimings;
}

export interface CleanResponse {
  raw: string;
  cleaned: string;
  usedLlm: boolean;
  formatter: Formatter;
}

export interface ChatMessage {
  id: string;
  raw: string;
  cleaned: string;
  usedLlm: boolean;
  formatter: Formatter;
  source: "text" | "voice";
  createdAt: string;
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
