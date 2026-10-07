import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";

export const SESSION_COOKIE = "portfolio_session";
const MAX_AGE = 60 * 60 * 24 * 7;
const fails = new Map();

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

export function authConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD && process.env.SESSION_SECRET);
}

export function createSessionToken() {
  const exp = Date.now() + MAX_AGE * 1000;
  const payload = `admin.${exp}`;
  const sig = createHmac("sha256", secret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !process.env.SESSION_SECRET) return false;
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [role, exp, sig] = parts;
  if (role !== "admin") return false;
  const expected = createHmac("sha256", secret()).update(`${role}.${exp}`).digest("base64url");
  const left = Buffer.from(sig);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return false;
  return Number(exp) > Date.now();
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  };
}

export function requireAdmin(req) {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!verifySessionToken(token)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

function clientKey(req) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
}

export function tooManyAttempts(req) {
  const now = Date.now();
  const recent = (fails.get(clientKey(req)) || []).filter((time) => now - time < 10 * 60 * 1000);
  return recent.length >= 8;
}

export function registerFailure(req) {
  const key = clientKey(req);
  const now = Date.now();
  const recent = (fails.get(key) || []).filter((time) => now - time < 10 * 60 * 1000);
  recent.push(now);
  fails.set(key, recent);
}

export function clearFailures(req) {
  fails.delete(clientKey(req));
}

export function checkPassword(password) {
  const expected = process.env.ADMIN_PASSWORD || "";
  if (!expected || typeof password !== "string") return false;
  const left = Buffer.from(password);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
