import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { assertCollection, deleteRecord, getDb, updateRecord } from "@/lib/db";
import { errorResponse, HttpError } from "@/lib/errors";
import { buildRecord } from "@/lib/records";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readParams(context) {
  const { collection, id } = await context.params;
  assertCollection(collection);
  return { collection, id };
}

export async function GET(_req, context) {
  try {
    const { collection, id } = await readParams(context);
    const db = await getDb();
    const record = db[collection].find((item) => item.id === id);
    if (!record) throw new HttpError(404, "Record not found");
    return NextResponse.json(record);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req, context) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { collection, id } = await readParams(context);
    const record = await buildRecord(collection, await req.json(), id);
    return NextResponse.json(await updateRecord(collection, id, record));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req, context) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const { collection, id } = await readParams(context);
    await deleteRecord(collection, id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
