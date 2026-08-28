import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get("token") || "";
    if (!token) return NextResponse.json({ valid: false }, { status: 401 });
    const db = await getDb();
    const session = await db.collection("sessions").findOne({ token, active: true });
    return NextResponse.json({ valid: !!session });
  } catch {
    return NextResponse.json({ valid: false }, { status: 500 });
  }
}