import { NextRequest, NextResponse } from "next/server";
import { getState, saveState, OverlayState } from "@/lib/db";

export async function GET(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room") || "default";
  const state = await getState(room);
  return NextResponse.json(state, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function POST(req: NextRequest) {
  const room = req.nextUrl.searchParams.get("room") || "default";
  const body: OverlayState = await req.json();
  await saveState(room, body);
  return NextResponse.json({ ok: true });
}

export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}