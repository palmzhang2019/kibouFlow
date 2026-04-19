-- Phase 3: enrich geo_audit_decisions with fields for "决策中心".
-- New decisions write both legacy `choice` (kept for the existing check constraint)
-- and the new `selected_action` enum. Readers prefer `selected_action` and
-- fall back to `choice` for pre-phase-3 rows.

alter table geo_audit_decisions
  add column if not exists selected_action text
    check (selected_action in (
      'template_fix',
      'content_fix',
      'manual_validation',
      'postpone',
      'closed'
    ));

alter table geo_audit_decisions
  add column if not exists note text;

alter table geo_audit_decisions
  add column if not exists created_by text;

-- Snapshot of the issue code at decision time so drilldowns still work
-- after an issue row is superseded by later runs.
alter table geo_audit_decisions
  add column if not exists issue_code text;

create index if not exists idx_geo_audit_decisions_selected_action
  on geo_audit_decisions(selected_action);

create index if not exists idx_geo_audit_decisions_issue_code
  on geo_audit_decisions(issue_code);
