create table if not exists geo_role_bindings (
  user_id text primary key,
  role text not null check (role in ('admin', 'editor', 'reviewer')),
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists geo_publish_requests (
  id uuid primary key default uuid_generate_v4(),
  scope text not null check (scope in ('site', 'page', 'rules', 'toggles')),
  locale text not null check (locale in ('zh', 'ja')),
  path text,
  draft_json jsonb not null,
  published_json jsonb,
  status text not null check (status in ('draft', 'pending', 'published', 'rejected')) default 'draft',
  requested_by text not null,
  reviewed_by text,
  review_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists idx_geo_publish_requests_pending_unique
on geo_publish_requests(scope, locale, coalesce(path, ''))
where status = 'pending';

create table if not exists geo_audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id text not null,
  actor_role text not null check (actor_role in ('admin', 'editor', 'reviewer')),
  action text not null check (action in ('create', 'update', 'request', 'review', 'publish', 'rollback', 'export')),
  scope text not null,
  resource_key text not null,
  before_json jsonb,
  after_json jsonb,
  is_emergency boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_geo_audit_logs_actor on geo_audit_logs(actor_id);
create index if not exists idx_geo_audit_logs_created_at on geo_audit_logs(created_at desc);

alter table geo_role_bindings enable row level security;
alter table geo_publish_requests enable row level security;
alter table geo_audit_logs enable row level security;

create policy "Service role can manage geo_role_bindings"
  on geo_role_bindings for all to service_role using (true) with check (true);
create policy "Service role can manage geo_publish_requests"
  on geo_publish_requests for all to service_role using (true) with check (true);
create policy "Service role can manage geo_audit_logs"
  on geo_audit_logs for all to service_role using (true) with check (true);
