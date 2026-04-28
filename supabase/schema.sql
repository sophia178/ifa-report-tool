create extension if not exists pgcrypto;

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  client_email text not null,
  source_type text not null check (source_type in ('notes', 'audio')),
  meeting_date date not null,
  next_review_date date not null,
  audio_path text,
  meeting_notes text,
  transcript text,
  report_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.reports enable row level security;

drop policy if exists "Users can view own reports" on public.reports;
create policy "Users can view own reports"
on public.reports
for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own reports" on public.reports;
create policy "Users can insert own reports"
on public.reports
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own reports" on public.reports;
create policy "Users can delete own reports"
on public.reports
for delete
using (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('meeting-audio', 'meeting-audio', false)
on conflict (id) do nothing;

drop policy if exists "Users can access own audio objects" on storage.objects;
create policy "Users can access own audio objects"
on storage.objects
for select
using (
  bucket_id = 'meeting-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);
