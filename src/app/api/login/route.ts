import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { randomBytes } from "crypto";

const EMAIL = "FIREFIST@MAIL.COM";
const PASS  = "OVERLAY.PP";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (email?.toUpperCase() !== EMAIL || password !== PASS)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const token = randomBytes(32).toString("hex");
    const db = await getDb();
    await db.collection("sessions").insertOne({ token, createdAt: new Date(), active: true });

    return NextResponse.json({ token });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}