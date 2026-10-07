import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { HttpError } from "./errors";
import { getSupabaseAdmin, isSupabaseConfigured, UPLOAD_BUCKET } from "./supabase";

const uploadDir = path.join(process.cwd(), "public", "uploads");

function parseDataUrl(value) {
  const match = value.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) throw new HttpError(400, "Image must be a JPEG, PNG, or WebP");
  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if (!buffer.length || buffer.length > 2_000_000) {
    throw new HttpError(400, "Image must be under 2MB after compression");
  }
  const ext = match[1] === "image/png" ? "png" : match[1] === "image/webp" ? "webp" : "jpg";
  return { buffer, ext, contentType: match[1] };
}

async function persistToSupabase(value) {
  const supabase = getSupabaseAdmin();
  const { buffer, ext, contentType } = parseDataUrl(value);
  const filename = `${randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(UPLOAD_BUCKET).upload(filename, buffer, {
    contentType,
    upsert: false,
  });
  if (error) throw new HttpError(500, error.message || "Upload failed");
  const { data } = supabase.storage.from(UPLOAD_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

function persistLocally(value) {
  const { buffer, ext } = parseDataUrl(value);
  const filename = `${randomUUID()}.${ext}`;
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function persistImage(value) {
  if (value == null || value === "") return "";
  if (typeof value !== "string") throw new HttpError(400, "Invalid image");
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  if (value.startsWith("/uploads/")) {
    if (!/^\/uploads\/[a-zA-Z0-9-]+\.(jpg|png|webp)$/.test(value)) {
      throw new HttpError(400, "Invalid image path");
    }
    return value;
  }
  if (!value.startsWith("data:image")) {
    throw new HttpError(400, "Invalid image");
  }
  if (isSupabaseConfigured()) return persistToSupabase(value);
  return persistLocally(value);
}
