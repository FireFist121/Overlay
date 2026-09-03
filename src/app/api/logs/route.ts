import { NextRequest, NextResponse } from "next/server";
import { getLogs } from "@/lib/db";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token");
  const validToken = process.env.ADMIN_TOKEN || "secret_admin_token_123";

  if (!token || token.value !== validToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const room = req.nextUrl.searchParams.get("room") || "default";
  const limitStr = req.nextUrl.searchParams.get("limit");
  const limit = limitStr ? parseInt(limitStr, 10) : 100;
  
  const logs = await getLogs(room, limit);
  return NextResponse.json(logs, {
    headers: {
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
