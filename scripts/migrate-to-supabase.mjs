import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "crypto";

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const COLLECTIONS = [
  "projects",
  "skills",
  "experience",
  "education",
  "courses",
  "albums",
  "gallery",
  "publications",
];

const dbPath = path.join(process.cwd(), "data", "portfolio.json");
if (!fs.existsSync(dbPath)) {
  console.error("No data/portfolio.json found to migrate");
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, "utf8"));
const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const rows = [];
for (const collection of COLLECTIONS) {
  for (const record of db[collection] || []) {
    const id = record.id || randomUUID();
    const { id: _id, ...data } = record;
    rows.push({
      id,
      collection,
      data,
      updated_at: new Date().toISOString(),
    });
  }
}

const { error: delError } = await supabase
  .from("portfolio_records")
  .delete()
  .neq("id", "00000000-0000-0000-0000-000000000000");
if (delError) {
  console.error("Failed clearing table:", delError.message);
  process.exit(1);
}

if (rows.length) {
  const { error } = await supabase.from("portfolio_records").insert(rows);
  if (error) {
    console.error("Failed inserting records:", error.message);
    process.exit(1);
  }
}

console.log(`Migrated ${rows.length} records to Supabase.`);
for (const collection of COLLECTIONS) {
  console.log(`- ${collection}: ${(db[collection] || []).length}`);
}
