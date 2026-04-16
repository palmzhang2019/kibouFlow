-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Trial submissions table
create table if not exists trial_submissions (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  contact text not null,
  current_status text,
  main_concern text,
  goal text,
  willing_followup boolean default true,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_page text,
  source_note text,
  locale text default 'zh',
  ip_address text,
  created_at timestamptz default now()
);

-- Partner submissions table
create table if not exists partner_submissions (
  id uuid primary key default uuid_generate_v4(),
  org_name text not null,
  contact_person text not null,
  contact_method text not null,
  org_type text,
  cooperation_interest text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  landing_page text,
  locale text default 'zh',
  ip_address text,
  created_at timestamptz default now()
);

-- Tracking events table
create table if not exists tracking_events (
  id uuid primary key default uuid_generate_v4(),
  event_name text not null,
  page_path text,
  element_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  referrer text,
  session_id text,
  locale text,
  user_agent text,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index if not exists idx_trial_created_at on trial_submissions(created_at desc);
create index if not exists idx_partner_created_at on partner_submissions(created_at desc);
create index if not exists idx_tracking_event_name on tracking_events(event_name);
create index if not exists idx_tracking_created_at on tracking_events(created_at desc);
create index if not exists idx_tracking_session on tracking_events(session_id);

-- Row Level Security
alter table trial_submissions enable row level security;
alter table partner_submissions enable row level security;
alter table tracking_events enable row level security;

-- Allow inserts from anon key (public API)
create policy "Allow anonymous inserts on trial_submissions"
  on trial_submissions for insert
  to anon
  with check (true);

create policy "Allow anonymous inserts on partner_submissions"
  on partner_submissions for insert
  to anon
  with check (true);

create policy "Allow anonymous inserts on tracking_events"
  on tracking_events for insert
  to anon
  with check (true);

-- Only service role can read
create policy "Service role can read trial_submissions"
  on trial_submissions for select
  to service_role
  using (true);

create policy "Service role can read partner_submissions"
  on partner_submissions for select
  to service_role
  using (true);

create policy "Service role can read tracking_events"
  on tracking_events for select
  to service_role
  using (true);
