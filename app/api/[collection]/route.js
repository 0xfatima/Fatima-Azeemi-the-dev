import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertCollection, getDb, insertRecord } from "@/lib/db";
import { errorResponse } from "@/lib/errors";
import { buildRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req, context) {
  try {
    const { collection } = await context.params;
    assertCollection(collection);
    const db = await getDb();
    return NextResponse.json(db[collection], {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req, context) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { collection } = await context.params;
    assertCollection(collection);
    const record = await buildRecord(collection, await req.json());
    await insertRecord(collection, record);
    return NextResponse.json(record, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
