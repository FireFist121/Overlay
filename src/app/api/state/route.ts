import { NextRequest, NextResponse } from "next/server";
import { getState, saveState, OverlayState, saveLog } from "@/lib/db";

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
  if (oldState.timer.remaining !== body.timer.remaining && !oldState.timer.running && !body.timer.running) {
    const diff = body.timer.remaining - oldState.timer.remaining;
    if (diff > 0) {
      logsToSave.push({ action: "Timer Added", details: `Added ${diff} seconds` });
    } else if (diff < 0) {
      logsToSave.push({ action: "Timer Reduced", details: `Removed ${Math.abs(diff)} seconds` });
    }
  }

  // Timer run state
  if (oldState.timer.running !== body.timer.running) {
    logsToSave.push({ action: "Timer Toggled", details: body.timer.running ? "Timer started" : "Timer paused" });
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