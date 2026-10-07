import fs from "fs";
import path from "path";
import { seedData } from "./seed";
import { HttpError } from "./errors";
import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";

export const COLLECTIONS = [
  "projects",
  "skills",
  "experience",
  "education",
  "courses",
  "albums",
  "gallery",
  "publications",
];

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "portfolio.json");

function emptyDb() {
  return Object.fromEntries(COLLECTIONS.map((name) => [name, []]));
}

function ensureJsonDb() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) writeJsonDb(seedData());
}

function writeJsonDb(db) {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const tmp = `${dbPath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  try {
    fs.renameSync(tmp, dbPath);
  } catch {
    fs.copyFileSync(tmp, dbPath);
    fs.unlinkSync(tmp);
  }
}

function readJsonDb() {
  ensureJsonDb();
  const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
  for (const name of COLLECTIONS) {
    if (!Array.isArray(db[name])) db[name] = [];
  }
  return db;
}

async function readSupabaseDb() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("portfolio_records")
    .select("id, collection, data")
    .order("created_at", { ascending: true });
  if (error) throw new HttpError(500, error.message);

  const db = emptyDb();
  for (const row of data || []) {
    if (!COLLECTIONS.includes(row.collection)) continue;
    db[row.collection].push({ id: row.id, ...(row.data || {}) });
  }
  return db;
}

export function assertCollection(name) {
  if (!COLLECTIONS.includes(name)) throw new HttpError(404, "Unknown collection");
}

export async function getDb() {
  if (isSupabaseConfigured()) return readSupabaseDb();
  return readJsonDb();
}

export async function resetDb() {
  const next = seedData();
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { error: delError } = await supabase.from("portfolio_records").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (delError) throw new HttpError(500, delError.message);

    const rows = [];
    for (const collection of COLLECTIONS) {
      for (const record of next[collection] || []) {
        const { id, ...data } = record;
        rows.push({ id, collection, data, updated_at: new Date().toISOString() });
      }
    }
    if (rows.length) {
      const { error } = await supabase.from("portfolio_records").insert(rows);
      if (error) throw new HttpError(500, error.message);
    }
    return next;
  }
  writeJsonDb(next);
  return next;
}

export async function insertRecord(collection, record) {
  assertCollection(collection);
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { id, ...data } = record;
    const { error } = await supabase.from("portfolio_records").insert({
      id,
      collection,
      data,
      updated_at: new Date().toISOString(),
    });
    if (error) throw new HttpError(500, error.message);
    return record;
  }
  const db = readJsonDb();
  db[collection].push(record);
  writeJsonDb(db);
  return record;
}

export async function updateRecord(collection, id, record) {
  assertCollection(collection);
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { id: _id, ...data } = record;
    const { data: updated, error } = await supabase
      .from("portfolio_records")
      .update({ data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("collection", collection)
      .select("id");
    if (error) throw new HttpError(500, error.message);
    if (!updated?.length) throw new HttpError(404, "Record not found");
    return record;
  }
  const db = readJsonDb();
  const index = db[collection].findIndex((item) => item.id === id);
  if (index === -1) throw new HttpError(404, "Record not found");
  db[collection][index] = record;
  writeJsonDb(db);
  return record;
}

export async function deleteRecord(collection, id) {
  assertCollection(collection);
  if (isSupabaseConfigured()) {
    const supabase = getSupabaseAdmin();
    const { data: removed, error } = await supabase
      .from("portfolio_records")
      .delete()
      .eq("id", id)
      .eq("collection", collection)
      .select("id");
    if (error) throw new HttpError(500, error.message);
    if (!removed?.length) throw new HttpError(404, "Record not found");

    if (collection === "albums") {
      const { data: photos, error: photoError } = await supabase
        .from("portfolio_records")
        .select("id, data")
        .eq("collection", "gallery");
      if (photoError) throw new HttpError(500, photoError.message);
      for (const photo of photos || []) {
        if ((photo.data || {}).albumId !== id) continue;
        const nextData = { ...photo.data, albumId: "" };
        const { error: updateError } = await supabase
          .from("portfolio_records")
          .update({ data: nextData, updated_at: new Date().toISOString() })
          .eq("id", photo.id);
        if (updateError) throw new HttpError(500, updateError.message);
      }
    }
    return;
  }

  const db = readJsonDb();
  const next = db[collection].filter((item) => item.id !== id);
  if (next.length === db[collection].length) throw new HttpError(404, "Record not found");
  db[collection] = next;
  if (collection === "albums" && Array.isArray(db.gallery)) {
    db.gallery = db.gallery.map((photo) =>
      photo.albumId === id ? { ...photo, albumId: "" } : photo
    );
  }
  writeJsonDb(db);
}
