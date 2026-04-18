create table if not exists geo_site_settings (
  id boolean primary key default true check (id = true),
  site_name text not null,
  default_title_template text not null,
  default_description text not null,
  default_locale text not null check (default_locale in ('zh', 'ja')),
  site_url text not null,
  robots_policy text,
  updated_by text,
  updated_at timestamptz not null default now()
);

create table if not exists geo_page_settings (
  locale text not null check (locale in ('zh', 'ja')),
  path text not null,
  meta_title text,
  meta_description text,
  canonical_url text,
  og_title text,
  og_description text,
  og_image text,
  noindex boolean not null default false,
  jsonld_overrides jsonb,
  updated_by text,
  updated_at timestamptz not null default now(),
  primary key (locale, path)
);

create index if not exists idx_geo_page_settings_path on geo_page_settings(path);
create index if not exists idx_geo_page_settings_updated_at on geo_page_settings(updated_at desc);

alter table geo_site_settings enable row level security;
alter table geo_page_settings enable row level security;

create policy "Service role can manage geo_site_settings"
  on geo_site_settings
  for all
  to service_role
  using (true)
  with check (true);

create policy "Service role can manage geo_page_settings"
  on geo_page_settings
  for all
  to service_role
  using (true)
  with check (true);
