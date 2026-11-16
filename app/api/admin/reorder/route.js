import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertCollection, reorderRecords } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json().catch(() => ({}));
    assertCollection(body.collection);
    const ids = body.ids;
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every((id) => typeof id === "string" && id.length <= 80)) {
      throw new HttpError(400, "ids must be a list of record ids");
    }
    if (new Set(ids).size !== ids.length) throw new HttpError(400, "ids must be unique");
    await reorderRecords(body.collection, ids);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
