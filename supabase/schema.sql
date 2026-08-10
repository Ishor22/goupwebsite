-- Run this once in the Supabase SQL Editor to set up the brothers table.
-- See the setup instructions given by Claude for exact click-by-click steps.

create table if not exists public.brothers (
  id bigint generated always as identity primary key,
  name text not null,
  created_at timestamptz not null default now()
);

-- Row Level Security: once enabled, ALL access is denied by default
-- unless a policy explicitly allows it. We only add a policy for public
-- reads. There is no insert/update/delete policy for anon or authenticated
-- roles, so the database itself rejects any direct write attempt from the
-- browser -- only the server-side service role key (used exclusively in
-- our Vercel API functions, never sent to the browser) can bypass RLS and
-- write to this table.
alter table public.brothers enable row level security;

create policy "Public can read brothers"
  on public.brothers
  for select
  to anon, authenticated
  using (true);

-- Seed the two names that already existed on the site before this change.
-- (Names are shown in the order they were added, oldest first.)
insert into public.brothers (name)
values ('राम थापा'), ('हरी कुमार');
