import { NextResponse } from "next/server";
import { appConfig } from "@/config/app.config";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    sttModel: appConfig.sttModel,
    formatter: "groq",
    groqKeyPresent: Boolean(process.env[appConfig.cleanup.apiKeyEnv]),
  });
}
