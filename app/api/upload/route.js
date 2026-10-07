import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse, HttpError } from "@/lib/errors";
import { persistImage } from "@/lib/images";

export const runtime = "nodejs";

export async function POST(req) {
  const denied = requireAdmin(req);
  if (denied) return denied;

  try {
    const body = await req.json();
    if (typeof body.dataUrl !== "string" || !body.dataUrl.startsWith("data:image")) {
      throw new HttpError(400, "Image is required");
    }
    const url = await persistImage(body.dataUrl);
    return NextResponse.json({ url });
  } catch (err) {
    return errorResponse(err);
  }
}
