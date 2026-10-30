-- Run this once in the Supabase SQL Editor (Dashboard → SQL → New query).

create table if not exists public.portfolio_records (
  id uuid primary key,
  collection text not null check (
    collection in (
      'projects',
      'skills',
      'experience',
      'education',
      'courses',
      'albums',
      'gallery',
      'publications'
    )
  ),
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists portfolio_records_collection_idx
  on public.portfolio_records (collection);

-- Lock the table down. The site talks to Supabase only from the server with
-- the service-role key, which bypasses RLS. With RLS on and no policies, the
-- public anon key can neither read nor modify portfolio content.
alter table public.portfolio_records enable row level security;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio-uploads',
  'portfolio-uploads',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read portfolio uploads" on storage.objects;
create policy "Public read portfolio uploads"
  on storage.objects
  for select
  using (bucket_id = 'portfolio-uploads');

-- Writes happen only from the server with the service-role key (which
-- bypasses these policies), so no insert/update/delete policies are granted.
-- The old policies allowed ANY caller, including the anon key, to write.
drop policy if exists "Authenticated upload portfolio uploads" on storage.objects;
drop policy if exists "Authenticated update portfolio uploads" on storage.objects;
drop policy if exists "Authenticated delete portfolio uploads" on storage.objects;
