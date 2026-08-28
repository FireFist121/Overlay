import { NextRequest, NextResponse } from "next/server";
import { getDb, getDefaultState } from "@/lib/db";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const room    = searchParams.get("room") || "default";
  const minutes = parseInt(searchParams.get("minutes") || "0");
  const secret  = searchParams.get("secret") || "";

  const EXPECTED_SECRET = process.env.TIMER_SECRET || "firefist";
  if (secret !== EXPECTED_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!minutes || isNaN(minutes) || Math.abs(minutes) < 1 || Math.abs(minutes) > 180)
    return NextResponse.json({ error: "Invalid minutes (1-180)" }, { status: 400 });

  try {
    const db  = await getDb();
    const col = db.collection("states");
    let doc = await col.findOne({ room });

    // Auto-create room if it doesn't exist yet
    if (!doc) {
      const def = getDefaultState();
      await col.updateOne({ room }, { $set: { room, state: def, updatedAt: def.updatedAt } }, { upsert: true });
      doc = await col.findOne({ room });
    }

    const state = doc?.state || getDefaultState();
    const addSecs    = minutes * 60;
    const now        = Date.now();
    const timer      = state.timer || {};
    const newRemaining = Math.max(0, (timer.remaining || 0) + addSecs);

    let targetEndTime: number | undefined;
    if (timer.running && timer.targetEndTime) {
      targetEndTime = Math.max(now, timer.targetEndTime + addSecs * 1000);
    }

    const updatedTimer = { ...timer, remaining: newRemaining, ...(targetEndTime ? { targetEndTime } : {}) };
    const updatedState = { ...state, timer: updatedTimer, updatedAt: now };

    await col.updateOne(
      { room },
      { $set: { room, state: updatedState, updatedAt: now } },
      { upsert: true }
    );

    const action = minutes > 0 ? `+${minutes}m` : `${minutes}m`;
    return NextResponse.json({ ok: true, action, newRemaining });
  } catch (e) {
    console.error("addtimer error:", e);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
}