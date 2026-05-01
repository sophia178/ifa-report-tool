create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  subscribed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists subscribed boolean not null default false;
alter table public.profiles enable row level security;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile"
on public.profiles
for select
using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, subscribed)
  values (new.id, new.email, false)
  on conflict (id) do update
  set email = excluded.email;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

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

create table if not exists public.research_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  summary text not null,
  key_points text[] not null,
  risks text,
  relevance_rating integer not null check (relevance_rating >= 1 and relevance_rating <= 10),
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.research_summaries enable row level security;

create policy "Users can view own research_summaries"
on public.research_summaries
for select
using (auth.uid() = user_id);

create policy "Users can insert own research_summaries"
on public.research_summaries
for insert
with check (auth.uid() = user_id);

create table if not exists public.client_emails (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  purpose text not null,
  key_points text not null,
  tone text not null,
  email_content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.client_emails enable row level security;

create policy "Users can view own client_emails"
on public.client_emails
for select
using (auth.uid() = user_id);

create policy "Users can insert own client_emails"
on public.client_emails
for insert
with check (auth.uid() = user_id);

create table if not exists public.australian_soas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  meeting_notes text not null,
  soa_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.australian_soas enable row level security;

create policy "Users can view own australian_soas"
on public.australian_soas
for select
using (auth.uid() = user_id);

create policy "Users can insert own australian_soas"
on public.australian_soas
for insert
with check (auth.uid() = user_id);

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
