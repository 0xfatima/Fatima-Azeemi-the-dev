import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { resetDb } from "@/lib/db";
import { errorResponse } from "@/lib/errors";

export const runtime = "nodejs";

export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;
  try {
    return NextResponse.json(await resetDb());
  } catch (err) {
    return errorResponse(err);
  }
}
