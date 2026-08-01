import { NextRequest, NextResponse } from "next/server";
import { cleanup } from "@/server/cleanup";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const text = typeof body?.text === "string" ? body.text : "";

  if (text.trim().length === 0) {
    return NextResponse.json({ error: "No text provided" }, { status: 400 });
  }

  const result = await cleanup(text);
  return NextResponse.json(result);
}
