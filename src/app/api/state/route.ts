import { NextRequest, NextResponse } from "next/server";
import { getState, saveState, OverlayState, saveLog } from "@/lib/db";

function fmt(secs: number) {
  secs = Math.max(0, secs);
  const h = Math.floor(secs / 3600), m = Math.floor((secs % 3600) / 60), s = secs % 60;
  return `${h > 0 ? String(h).padStart(2, "0") + ":" : ""}${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

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
  const oldState = await getState(room);
  
  await saveState(room, body);

  // Generate logs
  const logsToSave = [];
  
  // Timer changes
  if (!oldState.timer.running && body.timer.running) {
    logsToSave.push({ action: "Timer Started", details: `Timer resumed/started` });
  } else if (oldState.timer.running && !body.timer.running) {
    logsToSave.push({ action: "Timer Paused", details: `Timer paused` });
  }

  // Detect Reset
  if (body.timer.remaining === body.timer.total && body.timer.total > 0 && oldState.timer.remaining !== body.timer.remaining) {
    logsToSave.push({ action: "Timer Reset", details: `Reset to ${fmt(body.timer.total)} (was ${fmt(oldState.timer.remaining)})` });
  } else {
    // Detect Added/Removed Time
    let timeDiff = 0;
    let oldSecs = oldState.timer.remaining;
    let newSecs = body.timer.remaining;

    if (body.timer.running && oldState.timer.running && body.timer.targetEndTime && oldState.timer.targetEndTime) {
      timeDiff = Math.round((body.timer.targetEndTime - oldState.timer.targetEndTime) / 1000);
      oldSecs = Math.max(0, Math.round((oldState.timer.targetEndTime - Date.now()) / 1000));
      newSecs = Math.max(0, Math.round((body.timer.targetEndTime - Date.now()) / 1000));
    } else if (!body.timer.running && !oldState.timer.running) {
      timeDiff = body.timer.remaining - oldState.timer.remaining;
    }

    if (timeDiff > 0) {
      logsToSave.push({ action: "Timer Added", details: `Added ${Math.abs(timeDiff)} sec (${fmt(oldSecs)} -> ${fmt(newSecs)})` });
    } else if (timeDiff < 0) {
      logsToSave.push({ action: "Timer Reduced", details: `Removed ${Math.abs(timeDiff)} sec (${fmt(oldSecs)} -> ${fmt(newSecs)})` });
    }
  }

  // Donor changes
  if (oldState.donors.length < body.donors.length) {
    const newDonors = body.donors.filter(d => !oldState.donors.find(od => od.name === d.name && od.amount === d.amount));
    newDonors.forEach(d => logsToSave.push({ action: "Donor Added", details: `${d.name} ($${d.amount})` }));
  } else if (oldState.donors.length > body.donors.length) {
    const removedDonors = oldState.donors.filter(od => !body.donors.find(d => d.name === od.name && d.amount === od.amount));
    removedDonors.forEach(d => logsToSave.push({ action: "Donor Removed", details: `${d.name} ($${d.amount})` }));
  }

  // Visibility changes
  if (oldState.showTimer !== body.showTimer) {
    logsToSave.push({ action: "Visibility Changed", details: `Timer visibility: ${body.showTimer ? "Show" : "Hide"}` });
  }
  if (oldState.showDonors !== body.showDonors) {
    logsToSave.push({ action: "Visibility Changed", details: `Donors visibility: ${body.showDonors ? "Show" : "Hide"}` });
  }

  for (const log of logsToSave) {
    await saveLog(room, log.action, log.details);
  }

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