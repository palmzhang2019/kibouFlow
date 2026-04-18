create table if not exists geo_rules (
  id uuid primary key default uuid_generate_v4(),
  locale text not null check (locale in ('zh', 'ja')),
  faq_exclude_heading_patterns jsonb not null default '[]'::jsonb,
  faq_min_items integer not null default 2 check (faq_min_items >= 1),
  howto_section_patterns jsonb not null default '[]'::jsonb,
  howto_min_steps integer not null default 2 check (howto_min_steps >= 1),
  article_abstract_from_tldr boolean not null default false,
  updated_by text,
  updated_at timestamptz not null default now(),
  unique (locale)
);

create table if not exists geo_page_schema_toggles (
  locale text not null check (locale in ('zh', 'ja')),
  path text not null,
  enable_article boolean not null default true,
  enable_faqpage boolean not null default true,
  enable_howto boolean not null default true,
  enable_breadcrumb boolean not null default true,
  enable_website boolean not null default true,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (locale, path)
);

create table if not exists geo_rule_change_logs (
  id uuid primary key default uuid_generate_v4(),
  scope text not null check (scope in ('rules', 'toggles')),
  locale text not null check (locale in ('zh', 'ja')),
  path text,
  before_json jsonb,
  after_json jsonb,
  changed_by text,
  created_at timestamptz not null default now()
);

create index if not exists idx_geo_rule_change_logs_locale on geo_rule_change_logs(locale);
create index if not exists idx_geo_rule_change_logs_created_at on geo_rule_change_logs(created_at desc);

alter table geo_rules enable row level security;
alter table geo_page_schema_toggles enable row level security;
alter table geo_rule_change_logs enable row level security;

create policy "Service role can manage geo_rules"
  on geo_rules
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service role can manage geo_page_schema_toggles"
  on geo_page_schema_toggles
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service role can manage geo_rule_change_logs"
  on geo_rule_change_logs
  for all
  to service_role
  using (true)
  with check (true);
