# Supabase setup (free)

This portfolio can use **Supabase** (free) for:
- Postgres database content (projects, gallery metadata, etc.)
- File storage for uploads (1 GB free)

Without these env vars, the app still runs on local `data/portfolio.json`.

## 1. Create a free project

1. Go to https://supabase.com and create a free project
2. Open **Project Settings → API**
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (keep secret)

## 2. Create tables + storage bucket

1. Open **SQL Editor**
2. Paste and run everything in `supabase/schema.sql`

## 3. Configure this app

Add to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Restart `npm run dev`.

## 4. Load your current content into Supabase

With the server stopped or running:

```bash
node scripts/migrate-to-supabase.mjs
```

Or use Admin → Reset/Seed after env is set (that writes seed data into Supabase).

## Gallery size limits (to stay on free tier)

Uploads are compressed in the browser first:
- Gallery photos: max ~1280px, target under ~220 KB each
- Logos/icons: max ~512px, target under ~80 KB each

At ~200 KB/photo, 1 GB free storage fits roughly **4,000+ gallery photos**.
