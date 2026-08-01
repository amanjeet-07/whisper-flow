import { describe, expect, it, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

const transcribeMock = vi.fn();
const cleanWithGroqMock = vi.fn();

vi.mock("@/server/stt", () => ({
  transcribe: transcribeMock,
}));

vi.mock("@/server/groqClient", () => ({
  cleanWithGroq: cleanWithGroqMock,
}));

const { POST: cleanRoute } = await import("@/app/api/clean/route");
const { POST: transcribeRoute } = await import("@/app/api/transcribe/route");
const { GET: healthRoute } = await import("@/app/api/health/route");

function jsonRequest(body: unknown): NextRequest {
  return new Request("http://localhost/api/clean", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function formDataRequest(file: File): NextRequest {
  const formData = new FormData();
  formData.append("file", file);
  return new Request("http://localhost/api/transcribe", {
    method: "POST",
    body: formData,
  }) as unknown as NextRequest;
}

describe("GET /api/health", () => {
  it("returns status, sttModel, formatter, and groqKeyPresent", async () => {
    const res = await healthRoute();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body).toHaveProperty("sttModel");
    expect(body.formatter).toBe("groq");
    expect(typeof body.groqKeyPresent).toBe("boolean");
  });
});

describe("POST /api/clean", () => {
  beforeEach(() => {
    cleanWithGroqMock.mockReset();
  });

  it("returns the schema fields for a short input (skips Groq)", async () => {
    const req = jsonRequest({ text: "um, quick test" });
    const res = await cleanRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("raw");
    expect(body).toHaveProperty("cleaned");
    expect(body).toHaveProperty("usedLlm", false);
    expect(body).toHaveProperty("formatter", "regex");
    expect(cleanWithGroqMock).not.toHaveBeenCalled();
  });

  it("returns the schema fields for a long input (uses mocked Groq)", async () => {
    cleanWithGroqMock.mockResolvedValue("Hello there, this is a cleaned sentence for testing.");
    const req = jsonRequest({ text: "um, hello there, uh, this is like a test of the, you know, pipeline" });
    const res = await cleanRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.usedLlm).toBe(true);
    expect(body.formatter).toBe("groq");
    expect(body.cleaned).toBe("Hello there, this is a cleaned sentence for testing.");
  });

  it("falls back to regex when Groq fails", async () => {
    cleanWithGroqMock.mockResolvedValue(null);
    const req = jsonRequest({ text: "um, hello there, uh, this is like a test of the, you know, pipeline" });
    const res = await cleanRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.usedLlm).toBe(false);
    expect(body.formatter).toBe("regex");
    expect(body.cleaned.toLowerCase()).not.toContain("um");
  });

  it("rejects empty text with 400", async () => {
    const req = jsonRequest({ text: "" });
    const res = await cleanRoute(req);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/transcribe", () => {
  beforeEach(() => {
    transcribeMock.mockReset();
    cleanWithGroqMock.mockReset();
  });

  it("returns the schema fields with STT and Groq mocked", async () => {
    transcribeMock.mockResolvedValue("um, hello there, uh, this is like a test of the, you know, pipeline");
    cleanWithGroqMock.mockResolvedValue("Hello there, this is a test of the pipeline.");

    const file = new File([new Uint8Array([0, 1, 2, 3])], "recording.wav", { type: "audio/wav" });
    const req = formDataRequest(file);
    const res = await transcribeRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveProperty("raw");
    expect(body).toHaveProperty("cleaned");
    expect(body).toHaveProperty("usedLlm", true);
    expect(body).toHaveProperty("formatter", "groq");
    expect(body).toHaveProperty("timings");
    expect(transcribeMock).toHaveBeenCalledTimes(1);
  });

  it("returns a friendly message when no speech is detected", async () => {
    transcribeMock.mockResolvedValue("");

    const file = new File([new Uint8Array([0, 0, 0, 0])], "silence.wav", { type: "audio/wav" });
    const req = formDataRequest(file);
    const res = await transcribeRoute(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.raw).toBe("");
    expect(body.cleaned.toLowerCase()).toContain("no speech detected");
    expect(body.formatter).toBe("regex");
    expect(cleanWithGroqMock).not.toHaveBeenCalled();
  });

  it("rejects missing file with 400", async () => {
    const req = new Request("http://localhost/api/transcribe", {
      method: "POST",
      body: new FormData(),
    }) as unknown as NextRequest;
    const res = await transcribeRoute(req);
    expect(res.status).toBe(400);
  });
});
