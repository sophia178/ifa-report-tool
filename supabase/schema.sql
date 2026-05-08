create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  subscribed boolean not null default false,
  stripe_price_id text,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles add column if not exists stripe_price_id text;
alter table public.profiles add column if not exists subscribed boolean not null default false;
alter table public.profiles add column if not exists jurisdiction text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists firm_logo_url text;
alter table public.profiles add column if not exists firm_name text;
alter table public.profiles add column if not exists regulator_number text;
alter table public.profiles add column if not exists registered_address text;
alter table public.profiles add column if not exists custom_footer_text text;
alter table public.profiles add column if not exists stripe_customer_id text;
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

create table if not exists public.compliance_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  input_text text not null,
  score integer not null,
  issues jsonb not null,
  recommendation text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.compliance_checks enable row level security;

create policy "Users can view own compliance_checks"
on public.compliance_checks
for select
using (auth.uid() = user_id);

create policy "Users can insert own compliance_checks"
on public.compliance_checks
for insert
with check (auth.uid() = user_id);

create table if not exists public.usa_financial_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  client_name text not null,
  meeting_notes text not null,
  plan_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.usa_financial_plans enable row level security;

create policy "Users can view own usa_financial_plans"
on public.usa_financial_plans
for select
using (auth.uid() = user_id);

create policy "Users can insert own usa_financial_plans"
on public.usa_financial_plans
for insert
with check (auth.uid() = user_id);

create table if not exists public.trades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  asset_name text not null,
  entry_price numeric not null,
  exit_price numeric not null,
  position_size numeric not null,
  trade_date date not null,
  rationale text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.trades enable row level security;

create policy "Users can view own trades"
on public.trades
for select
using (auth.uid() = user_id);

create policy "Users can insert own trades"
on public.trades
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own trades"
on public.trades
for delete
using (auth.uid() = user_id);

create table if not exists public.market_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  briefing_text text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.market_briefings enable row level security;

create policy "Users can view own briefings"
on public.market_briefings
for select
using (auth.uid() = user_id);

create policy "Users can insert own briefings"
on public.market_briefings
for insert
with check (auth.uid() = user_id);

create table if not exists public.portfolio_risk_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  holdings jsonb not null,
  analysis_result jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.portfolio_risk_analyses enable row level security;

create policy "Users can view own portfolio_risk_analyses"
on public.portfolio_risk_analyses
for select
using (auth.uid() = user_id);

create policy "Users can insert own portfolio_risk_analyses"
on public.portfolio_risk_analyses
for insert
with check (auth.uid() = user_id);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.report_templates enable row level security;

create policy "Users can view own templates"
on public.report_templates
for select
using (auth.uid() = user_id);

create policy "Users can insert own templates"
on public.report_templates
for insert
with check (auth.uid() = user_id);

create policy "Users can update own templates"
on public.report_templates
for update
using (auth.uid() = user_id);

create policy "Users can delete own templates"
on public.report_templates
for delete
using (auth.uid() = user_id);

create table if not exists public.regulatory_summaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jurisdictions text[] not null,
  updates jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.regulatory_summaries enable row level security;

create policy "Users can view own regulatory_summaries"
on public.regulatory_summaries
for select
using (auth.uid() = user_id);

create policy "Users can insert own regulatory_summaries"
on public.regulatory_summaries
for insert
with check (auth.uid() = user_id);

create table if not exists public.trade_strategies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  idea text not null,
  strategy_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.trade_strategies enable row level security;

create policy "Users can view own trade_strategies"
on public.trade_strategies
for select
using (auth.uid() = user_id);

create policy "Users can insert own trade_strategies"
on public.trade_strategies
for insert
with check (auth.uid() = user_id);

create table if not exists public.news_briefings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keywords text[] not null,
  briefing_json jsonb not null,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.news_briefings enable row level security;

create policy "Users can view own news_briefings"
on public.news_briefings
for select
using (auth.uid() = user_id);

create policy "Users can insert own news_briefings"
on public.news_briefings
for insert
with check (auth.uid() = user_id);

create table if not exists public.white_label_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  firm_name text not null,
  firm_address text,
  fca_number text,
  logo_url text,
  footer_message text,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.white_label_settings enable row level security;

create policy "Users can view own white_label_settings"
on public.white_label_settings
for select
using (auth.uid() = user_id);

create policy "Users can upsert own white_label_settings"
on public.white_label_settings
for insert
with check (auth.uid() = user_id);

create policy "Users can update own white_label_settings"
on public.white_label_settings
for update
using (auth.uid() = user_id);

create table if not exists public.market_data_cache (
  id text primary key, -- 'global_markets'
  data jsonb not null,
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.market_data_cache enable row level security;

create policy "Anyone can view market_data_cache"
on public.market_data_cache
for select
using (true);

create policy "Service role can manage market_data_cache"
on public.market_data_cache
for all
using (true);

create or replace function public.delete_user_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid references auth.users(id) on delete set null,
  member_email text not null,
  status text not null default 'pending', -- 'pending' or 'active'
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.team_members enable row level security;

create policy "Owners can view their team"
on public.team_members
for select
using (auth.uid() = team_owner_id);

create policy "Owners can manage their team"
on public.team_members
for insert
with check (auth.uid() = team_owner_id);

create policy "Owners can delete members"
on public.team_members
for delete
using (auth.uid() = team_owner_id);

create policy "Members can view their ownership"
on public.team_members
for select
using (auth.uid() = member_id);

insert into storage.buckets (id, name, public)
values ('meeting-audio', 'meeting-audio', false)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('white-labels', 'white-labels', true)
on conflict (id) do nothing;

drop policy if exists "Users can access own audio objects" on storage.objects;
create policy "Users can access own audio objects"
on storage.objects
for select
using (
  bucket_id = 'meeting-audio'
  and auth.uid()::text = (storage.foldername(name))[1]
);
