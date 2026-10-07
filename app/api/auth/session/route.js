import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  return NextResponse.json({ admin: verifySessionToken(token) });
}
