create table if not exists geo_audit_issues (
  id uuid primary key default uuid_generate_v4(),
  run_id uuid not null references geo_audit_runs(id) on delete cascade,
  code text not null,
  title text not null,
  severity text not null check (severity in ('critical', 'high', 'medium', 'low')),
  layer text not null check (layer in ('site', 'template', 'page', 'locale_pair')),
  status text not null default 'open' check (status in ('open', 'superseded')),
  evidence jsonb not null default '{}'::jsonb,
  facts_snapshot jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_geo_audit_issues_run_id on geo_audit_issues(run_id);
create index if not exists idx_geo_audit_issues_code_status on geo_audit_issues(code, status);
create index if not exists idx_geo_audit_issues_severity on geo_audit_issues(severity);
