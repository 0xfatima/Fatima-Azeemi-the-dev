import { NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  authConfigured,
  checkPassword,
  clearFailures,
  createSessionToken,
  registerFailure,
  sessionCookieOptions,
  tooManyAttempts,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req) {
  if (!authConfigured()) {
    return NextResponse.json({ error: "Server auth is not configured" }, { status: 500 });
  }
  if (tooManyAttempts(req)) {
    return NextResponse.json({ error: "Too many attempts. Wait a few minutes and try again." }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  if (!checkPassword(body.password)) {
    registerFailure(req);
    return NextResponse.json({ error: "Incorrect passkey" }, { status: 401 });
  }

  clearFailures(req);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSessionToken(), sessionCookieOptions());
  return response;
}
