import { createClient } from "@supabase/supabase-js";

// Env values pasted into Vercel often carry stray spaces, quotes or a
// trailing slash. Clean them so the client gets a valid URL/key.
function clean(value) {
  return (value || "").trim().replace(/^["']|["']$/g, "").trim();
}

function supabaseUrl() {
  return clean(process.env.NEXT_PUBLIC_SUPABASE_URL)
    .replace(/\/rest\/v1\/?$/, "")
    .replace(/\/+$/, "");
}

function serviceKey() {
  return clean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function isSupabaseConfigured() {
  return Boolean(supabaseUrl() && serviceKey());
}

export function getSupabaseAdmin() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured");
  }
  return createClient(
    supabaseUrl(),
    serviceKey(),
    {
      auth: { persistSession: false, autoRefreshToken: false },
    }
  );
}

export const UPLOAD_BUCKET = "portfolio-uploads";
