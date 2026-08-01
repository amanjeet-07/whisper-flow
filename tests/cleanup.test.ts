import { describe, expect, it, vi, beforeEach } from "vitest";

const cleanWithGroqMock = vi.fn();

vi.mock("@/server/groqClient", () => ({
  cleanWithGroq: cleanWithGroqMock,
}));

const { cleanup, regexClean, wordCount } = await import("@/server/cleanup");

describe("regexClean", () => {
  it("strips filler words and fixes casing/punctuation", () => {
    const input = "um, hello there, uh, this is like a test of the, you know, pipeline";
    const result = regexClean(input);

    expect(result.toLowerCase()).not.toContain("um");
    expect(result.toLowerCase()).not.toContain("uh");
    expect(result.toLowerCase()).not.toMatch(/\blike\b/);
    expect(result.toLowerCase()).not.toContain("you know");
    expect(result).toMatch(/^[A-Z]/);
    expect(result).toMatch(/[.!?]$/);
  });

  it("collapses double spaces", () => {
    expect(regexClean("hello    world")).toBe("Hello world.");
  });
});

describe("wordCount", () => {
  it("counts whitespace-separated words", () => {
    expect(wordCount("one two three")).toBe(3);
    expect(wordCount("  spaced   out  ")).toBe(2);
  });
});

describe("cleanup (latency rule + Groq routing)", () => {
  beforeEach(() => {
    cleanWithGroqMock.mockReset();
  });

  it("skips Groq entirely for input under 10 words", async () => {
    const raw = "um, hello there, uh, quick test";
    expect(wordCount(raw)).toBeLessThan(10);

    const result = await cleanup(raw);

    expect(cleanWithGroqMock).not.toHaveBeenCalled();
    expect(result.usedLlm).toBe(false);
    expect(result.formatter).toBe("regex");
    expect(result.cleaned.toLowerCase()).not.toContain("um");
  });

  it("calls Groq for input with 10+ words", async () => {
    const raw = "um, hello there, uh, this is like a test of the, you know, pipeline";
    expect(wordCount(raw)).toBeGreaterThanOrEqual(10);
    cleanWithGroqMock.mockResolvedValue("Hello there, this is a test of the pipeline.");

    const result = await cleanup(raw);

    expect(cleanWithGroqMock).toHaveBeenCalledTimes(1);
    expect(result.usedLlm).toBe(true);
    expect(result.formatter).toBe("groq");
    expect(result.cleaned).toBe("Hello there, this is a test of the pipeline.");
  });

  it("falls back to regex cleanup when Groq fails", async () => {
    const raw = "um, hello there, uh, this is like a test of the, you know, pipeline";
    cleanWithGroqMock.mockResolvedValue(null);

    const result = await cleanup(raw);

    expect(cleanWithGroqMock).toHaveBeenCalledTimes(1);
    expect(result.usedLlm).toBe(false);
    expect(result.formatter).toBe("regex");
    expect(result.cleaned.toLowerCase()).not.toContain("um");
  });
});
