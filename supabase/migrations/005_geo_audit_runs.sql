create table if not exists geo_audit_runs (
  id uuid primary key default uuid_generate_v4(),
  status text not null check (status in ('running', 'success', 'failed')),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  overall_score numeric(4, 1),
  retrievability_score numeric(4, 1),
  chunkability_score numeric(4, 1),
  extractability_score numeric(4, 1),
  trust_score numeric(4, 1),
  attributability_score numeric(4, 1),
  report_markdown text,
  report_json jsonb,
  error_message text,
  used_llm boolean not null default false,
  llm_model text,
  script_version text,
  target_path text,
  created_by text
);

create index if not exists idx_geo_audit_runs_started_at on geo_audit_runs(started_at desc);
create index if not exists idx_geo_audit_runs_status on geo_audit_runs(status);
