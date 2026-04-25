<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# kibouFlow Agent Workstation

This file is the agent entry map for this repository. Keep it short enough to navigate, but specific enough to prevent repeated mistakes.

## 1. Project Overview

- `kibouFlow` is a bilingual (`zh` / `ja`) content and conversion site for people exploring development paths in Japan.
- The stack is `Next.js 16 App Router + React 19 + TypeScript + next-intl + MDX + PostgreSQL + Vitest + Playwright`.
- The core product goal is: organize user intent, guide them to the right path, and convert them through `trial` / `partner` flows while improving SEO/GEO legibility for search and LLM retrieval.

## 2. Success Criteria

When making changes, optimize for all of the following:

1. User-visible pages still render correctly in both `zh` and `ja`.
2. Content remains structurally legible for SEO/GEO extraction.
3. `trial`, `partner`, tracking, and admin GEO audit flows keep working.
4. Changes stay aligned with the existing information architecture rather than inventing a new one.

## 3. Repository Map

High-value directories:

- `src/app/[locale]/...`: end-user routes and admin routes
- `src/app/api/...`: API route handlers
- `src/components/...`: UI and SEO components
- `src/lib/...`: content loading, GEO/SEO helpers, DB access, schemas, tracking, admin auth
- `content/zh`, `content/ja`: MDX article source of truth
- `tests/unit`, `tests/integration`, `tests/e2e`: verification layers
- `scripts/`: GEO audit and supporting Python/Selenium utilities
- `docs/`: operating docs, SOPs, test checklists, project overview

Important docs:

- `README.md`: project summary and common commands
- `docs/project-overview.md`: route map and directory map
- `docs/new-post-sop.md`: article publishing SOP
- `docs/manual-exploratory-checklist.md`: pre-release manual checks
- `docs/geo-backend-operation-guide.md`: GEO audit admin usage

## 4. Domain Model

### Locales

- Supported locales are `zh` and `ja`.
- Main user-facing routes live under `/{locale}`.
- Do not introduce locale-specific behavior that silently breaks the sibling locale.

### Content Model

The canonical content types live in `src/lib/content.ts`.

- `category`: `problems | paths | boundaries | cases`
- `contentType`: `problem | path | boundary | case | faq | framework | concept | cluster`
- `cluster`: `job-prep | japanese-path | direction-sorting | partner-needs`
- `ctaType`: `trial | partner | both`

Common article fields that matter operationally:

- `title`
- `description`
- `slug`
- `publishedAt`
- `updatedAt`
- `relatedSlugs`
- `suitableFor`
- `notSuitableFor`
- `tldr`

### Article Quality Expectations

When creating or editing MDX, prefer to preserve these invariants:

- complete frontmatter (title, description, category, slug, publishedAt, tldr, suitableFor, notSuitableFor, relatedSlugs)
- explicit conclusion / clear takeaway
- `TL;DR` where appropriate
- `suitableFor / notSuitableFor`
- next-step guidance section at end of article body
  - zh: `## 下一步建议` or `## 下一步行动`
  - ja: `## 次のステップ` or `## 次の一歩` (both are recognized by `content-harness-check`)
- at least 2 internal links in the article body
- valid `relatedSlugs`
- structure compatible with extractors for `faq`, `framework`, and `cluster`

See `docs/new-post-sop.md` for the publishing checklist.

### Content Editing Chapter

Use this playbook when the task touches `content/zh/**` or `content/ja/**`.

Before editing content:

1. Read the current article and its paired locale version if one exists.
2. Check frontmatter for `title`, `description`, `category`, `slug`, `publishedAt`.
3. Check whether `contentType`, `cluster`, `ctaType`, and `relatedSlugs` are already explicit or only being inferred.
4. Inspect neighboring articles in the same cluster before changing internal links or article positioning.

While editing content:

- Prefer updating the source MDX rather than hard-coding display fixes in UI components.
- Keep article URLs stable unless the task explicitly calls for a URL migration.
- When changing article structure, preserve extractor-friendly headings and list structure for `faq`, `framework`, and `cluster` content.

After editing content:

1. Run `npm run verify:content`.
2. If the edit affects retrieval or metadata quality, also run `npm run verify:seo-geo`.
3. If the change is publish-facing, use `npm run verify:publish`.
4. If the content change affects high-value GEO pages, run `npm run audit:geo:repo`.

Typical signals that content work is not done yet:

- missing paired locale article
- missing `relatedSlugs`
- fewer than 2 internal body links
- missing `TL;DR`
- missing next-step section
- article structure no longer matches extractor expectations

## 5. Protected Areas and Forbidden Moves

Do not make these changes unless the task explicitly requires them:

- Do not edit `.env*` files or commit secrets.
- Do not edit `node_modules/`, `.next/`, `test-results/`, or generated output files unless the task is specifically about generated artifacts.
- Do not rename or remove locale route structure without checking the full bilingual impact.
- Do not mass-upgrade dependencies just because a newer version exists.
- Do not modify `package-lock.json` unless dependencies were intentionally changed.
- Do not change database migrations casually. Add or edit migrations only for real schema work and keep them consistent with the existing sequence in `supabase/migrations/`.
- Do not delete or radically reshape content taxonomy (`category`, `contentType`, `cluster`) without updating loaders, tests, and related docs.
- Do not replace deterministic checks with LLM-only checks.

Treat these areas as high-risk:

- `src/lib/content.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`
- `src/app/llms.txt/route.ts`
- `src/app/[locale]/guides/[category]/[slug]/page.tsx`
- `src/app/api/admin/geo-audit/*`
- `src/lib/admin-session.ts`
- `src/lib/geo-*`

## 6. Coding and Editing Rules

- Prefer minimal, local changes over broad refactors.
- Preserve the current architecture and naming unless the task is explicitly architectural.
- Keep code readable for future agents: clear names, small helpers, and comments only where they materially reduce ambiguity.
- Avoid introducing new abstractions unless the current duplication is clearly harmful.
- If a change affects SEO/GEO behavior, update both code and the corresponding docs/tests where appropriate.
- If a change affects content conventions, update the SOP or checklist rather than letting the rule live only in chat history.

## 7. Task Playbooks

### A. UI / Route Changes

Before editing:

1. Inspect the target route and nearby components.
2. Inspect route-specific metadata / JSON-LD if applicable.
3. Check whether both locales are affected.

After editing:

1. Run targeted tests first.
2. Run `npm run build` if route behavior or metadata changed.
3. If user-visible structure changed, consider Playwright or manual exploratory checks.

### B. Content / MDX Changes

Before editing:

1. Verify the target article’s frontmatter and neighboring related articles.
2. Check whether a paired locale version exists or should exist.
3. Preserve or improve internal linking and `relatedSlugs`.

After editing:

1. Run content-related unit tests when relevant.
2. Preview the route if the article structure changed materially.
3. Re-run GEO audit steps if the content affects high-value pages or structural quality.

### C. SEO / GEO Changes

This includes metadata, JSON-LD, sitemap, robots, llms routes, article structure, and GEO audit behavior.

Before editing:

1. Identify whether the change is deterministic site behavior, content semantics, or admin audit logic.
2. Check existing tests first.

After editing:

1. Run the SEO/GEO-related unit/integration tests.
2. Run `npm run build`.
3. If relevant, run Playwright checks on affected routes.
4. If the task is about article quality or retrieval quality, use the GEO audit scripts/admin flow as secondary verification.

### D. Admin GEO Audit Changes

Before editing:

1. Read the admin route/API flow.
2. Check `docs/geo-backend-operation-guide.md`.
3. Check DB dependencies and migration expectations.

After editing:

1. Run admin session and GEO audit integration tests.
2. If UI flow changed, run the relevant E2E/manual admin checks.

### E. Admin GEO Chapter

Use this playbook when the task touches:

- `src/app/[locale]/admin/**`
- `src/app/api/admin/geo-audit/**`
- `src/lib/admin-session.ts`
- `src/lib/geo-audit-*`
- `scripts/geo_principles_audit.py`
- `supabase/migrations/00*_geo_audit*.sql`

Admin GEO guardrails:

- Preserve the login -> session -> run -> history flow unless the task explicitly changes it.
- Keep degraded behavior explicit: if `DATABASE_URL` is missing, the system may still run audits but should communicate that persistence/history is unavailable.
- Do not change migration ordering or rewrite old migrations casually.
- If API payload shape changes, update tests and any consuming page expectations in the same task.

Preferred verification for admin GEO work:

1. `npm run verify:admin-geo`
2. `npm run build` if route/UI/server behavior changed
3. `npm run audit:geo:repo` if Python-side audit logic changed
4. `npm run audit:admin:selenium` when validating the admin browser flow in a suitable environment

## 8. Verification Matrix

Use the smallest sufficient check set first, then expand if the change is broader.

### Default local regression

Run this for most code changes:

```bash
npm run verify:local
```

### If you touched content loading, frontmatter handling, or article structure

Prefer at least:

```bash
npm run verify:content
```

### If you touched sitemap / robots / llms / site URL logic

Prefer at least:

```bash
npm run verify:seo-geo
```

### If you touched admin auth or GEO audit APIs

Prefer at least:

```bash
npm run verify:admin-geo
```

### If you touched user-visible core flows

Prefer:

```bash
npm run verify:flows
```

Note: if E2E assertions are stale relative to current UI copy, fix the test or the UI deliberately. Do not ignore the mismatch silently.

## 9. GEO Audit and Manual Validation

Use these when the task concerns retrieval quality, article structure, or publishing quality rather than only code correctness.

Available harness components:

- `npm run verify:content`
- `npm run verify:seo-geo`
- `npm run verify:admin-geo`
- `npm run verify:publish`
- `npm run audit:geo:repo`
- `npm run audit:geo:repo:json`
- `npm run audit:seo-geo:local`
- `npm run audit:admin:selenium`
- `scripts/geo_principles_audit.py`
- `scripts/seo-geo-audit.py`
- admin GEO audit at `/{locale}/admin/geo-audit`
- manual checklist in `docs/manual-exploratory-checklist.md`

Publishing and post-publish quality loop:

1. pre-publish content checklist
2. publish-day smoke checks
3. save baseline audit result
4. 1-3 day light fixes
5. weekly governance review

See `docs/new-post-sop.md`.

## 10. Environment Expectations

- Node.js must be `>=20.9.0`.
- Site URL settings live in `.env.example` / `.env.local`.
- Admin GEO audit requires `ADMIN_GEO_PASSWORD` and `ADMIN_SESSION_SECRET`.
- DB-backed behavior depends on `DATABASE_URL`.

If environment assumptions block progress, report them explicitly instead of making silent guesses.

## 11. What Good Output Looks Like

A good agent change in this repository is:

- small enough to review
- aligned with the existing content and route model
- verified with the right checks
- documented when it changes a reusable rule
- safe for both locales
- safe for SEO/GEO structure, not just visually correct

When the same class of mistake happens more than once, improve the harness:

- strengthen this file
- add or update tests
- add or update docs/checklists/SOPs
- add a deterministic validation step where possible
