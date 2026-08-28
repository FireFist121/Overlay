import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room = searchParams.get("room") || "default";
  const minutes = parseInt(searchParams.get("minutes") || "0");
  const secret = searchParams.get("secret") || "";

  // Simple secret key check to prevent abuse
  const EXPECTED_SECRET = process.env.TIMER_SECRET || "firefist";
  if (secret !== EXPECTED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!minutes || isNaN(minutes) || minutes < 1 || minutes > 180) {
    return NextResponse.json({ error: "Invalid minutes (1-180)" }, { status: 400 });
  }

  try {
    const db = await getDb();
    const col = db.collection("states");
    const doc = await col.findOne({ room });
    if (!doc) return NextResponse.json({ error: "Room not found" }, { status: 404 });

    const addSecs = minutes * 60;
    const now = Date.now();
    const timer = doc.timer || {};
    const newRemaining = Math.max(0, (timer.remaining || 0) + addSecs);
    let targetEndTime: number | undefined;
    if (timer.running && timer.targetEndTime) {
      targetEndTime = timer.targetEndTime + addSecs * 1000;
    }

    const updatedTimer = {
      ...timer,
      remaining: newRemaining,
      ...(targetEndTime ? { targetEndTime } : {}),
    };

    await col.updateOne(
      { room },
      { $set: { timer: updatedTimer, updatedAt: now } },
      { upsert: true }
    );

    return NextResponse.json({ ok: true, added: `${minutes}m`, newRemaining });
  } catch (e) {
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}