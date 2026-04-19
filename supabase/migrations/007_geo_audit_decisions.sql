create table if not exists geo_audit_decisions (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid not null references geo_audit_issues(id) on delete cascade,
  choice text not null check (choice in ('ignore', 'template_track', 'content_track', 'recheck_later')),
  created_at timestamptz not null default now()
);

create index if not exists idx_geo_audit_decisions_issue_id on geo_audit_decisions(issue_id);
create index if not exists idx_geo_audit_decisions_created_at on geo_audit_decisions(created_at desc);
