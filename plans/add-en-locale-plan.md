# Plan: Add `en` as Supported Locale to kibouFlow

## Overview

Add English (`en`) as a formally supported locale alongside existing `zh` and `ja`, with minimal disruption to current behavior. The strategy is: infrastructure first, UI translations second, content last (partial is acceptable).

## Risk Analysis

| Risk | Impact | Mitigation |
|------|--------|------------|
| GEO admin DB stores locale as string — widening schema validation to accept "en" is safe | Low | DB columns are varchar, no migration needed |
| Sitemap/alternates must NOT output `en` links for articles that don't exist in `content/en/` | High | Check article existence before adding `en` to alternates.languages |
| Content harness check `pairedLocaleExists` only checks zh<->ja | Medium | Update to check all sibling locales; make en missing-pair a warning not error |
| `PROTECTED_TOGGLE_PATHS` and regex in geo-rules.ts need `/en` | Medium | Add `/en` to the set and update regex |
| FAQ page has hardcoded `FAQ_GROUPS_ZH` / `FAQ_GROUPS_JA` | Medium | Add `FAQ_GROUPS_EN` and update selection logic |
| `locale === "zh" ? "zh_CN" : "ja_JP"` ternaries in 7 page files | Medium | Replace with map object `{ zh: "zh_CN", ja: "ja_JP", en: "en_US" }` |
| trial/success and partner/success have `locale === "zh" ? ... : ...` for title | Low | Use translations instead of hardcoded ternary |
| guides/[category]/page.tsx has hardcoded empty-state text | Low | Use translations |

## Implementation Phases

### Phase 1: i18n Infrastructure

**Files:**
- `src/i18n/routing.ts` — add `"en"` to locales array
- `src/proxy.ts` — update matcher regex to include `en`: `"/(zh|ja|en)/:path*"`
- `src/lib/schemas.ts` — widen `localeSchema` from `z.enum(["zh", "ja"])` to `z.enum(["zh", "ja", "en"])`

### Phase 2: English UI Translations

**Files:**
- `src/messages/en.json` — create complete English translation file matching all keys from `zh.json`

Key sections to translate:
- `common.nav`, `common.cta`, `common.footer`, `common.lang`
- `home.*` (hero, problems, postSubmit, audience, guidesPreview, bottomCta)
- `trial.*` (form, success, error, hintCard)
- `partner.*` (types, benefits, process, cooperation, boundary, form, success, error)
- `faq.*` (10 Q&A items)
- `guides.*` (sections, categories, categoryDescriptions, contentTypes, nextSteps, template, articleCta)
- `metadata.*` (home, trial, partner, faq, guides, breadcrumbs)

### Phase 3: Content Layer (`src/lib/content.ts`)

- Add `en` entries to `CLUSTER_LABELS` record
- Change `Record<"zh" | "ja", ...>` to `Record<string, ...>`
- Update `getClusterLabel()` — use map lookup instead of ternary
- Update `getAllArticleSlugs()` — use `routing.locales` or add `"en"` to the array

### Phase 4: GEO Rules (`src/lib/geo-rules.ts`)

- Widen all `"zh" | "ja"` type annotations to `"zh" | "ja" | "en"`
- Add `/en` to `PROTECTED_TOGGLE_PATHS`
- Update `isProtectedTogglePath` regex: `/\/(zh|ja|en)\/guides\/[^/]+\/[^/]+$/`

### Phase 5: GEO Settings (`src/lib/geo-settings.ts`)

- Widen all `"zh" | "ja"` type annotations to `"zh" | "ja" | "en"` in interfaces and function signatures

### Phase 6: SEO Site URL (`src/lib/seo/site-url.ts`)

- Update `localeToInLanguage()`: add `if (locale === "en") return "en-US";`

### Phase 7: Language Switcher (`src/components/layout/LanguageSwitcher.tsx`)

- Convert from binary toggle to multi-locale selector
- Show all 3 locales as options, with current locale highlighted/selected
- Use a dropdown or segmented control pattern
- Add `"en"` key to `common.lang` in all message files

### Phase 8: Page Files — Remove Hardcoded Locale Logic

**All page files need these changes:**

1. Replace `locale as "zh" | "ja"` casts with just `locale` (since the type is now widened)
2. Replace `locale === "zh" ? "zh_CN" : "ja_JP"` with a map: `{ zh: "zh_CN", ja: "ja_JP", en: "en_US" }[locale] ?? "en_US"`
3. Add `en` to `alternates.languages` — but ONLY for pages that always exist (static pages, category pages). For article pages, conditionally add `en` only if the en article exists.

**Files:**
- `src/app/[locale]/page.tsx`
- `src/app/[locale]/layout.tsx`
- `src/app/[locale]/faq/page.tsx` — also add `FAQ_GROUPS_EN`, update group selection
- `src/app/[locale]/guides/page.tsx`
- `src/app/[locale]/guides/[category]/page.tsx` — also fix empty-state text to use translations
- `src/app/[locale]/guides/[category]/[slug]/page.tsx` — conditionally add en alternates
- `src/app/[locale]/trial/page.tsx`
- `src/app/[locale]/partner/page.tsx`
- `src/app/[locale]/trial/success/page.tsx` — use translations for title
- `src/app/[locale]/partner/success/page.tsx` — use translations for title

### Phase 9: Sitemap, LLMs Routes

**Files:**
- `src/app/sitemap.ts` — add `"en"` to `LOCALES`; for article entries, only add `en` alternate if en article exists
- `src/app/llms.txt/route.ts` — add `{ code: "en", label: "English" }` to LOCALES
- `src/app/llms-full.txt/route.ts` — add `"en"` to LOCALES

### Phase 10: Not Found Page

**File:** `src/app/not-found.tsx`
- Add English text alongside zh/ja
- Add link to `/en` and `/en/guides`

### Phase 11: English MDX Content

Create `content/en/` directory with high-value articles. Priority order:
1. Cluster entries (3): `direction-sorting-cluster-entry`, `japanese-learning-path-cluster-entry`, `job-prep-cluster-entry`
2. Key framework/concept articles
3. A few boundary/faq articles

Each article needs complete frontmatter (title, description, category, slug, publishedAt, tldr, suitableFor, notSuitableFor, relatedSlugs, contentType, cluster, ctaType) and body with next-step section and 2+ internal links.

### Phase 12: Content Harness Check (`scripts/content-harness-check.mjs`)

- Add `"en"` to `LOCALES` array
- Add English next-step patterns: `/^##\s*Next\s*Steps?/i`, `/^##\s*What.*Next/i`
- Update `pairedLocaleExists()` to check all sibling locales (not just zh<->ja)
- Make missing en paired locale a softer warning (en content is expected to be partial)

### Phase 13: Tests

**Files to update:**
- `tests/unit/sitemap.test.ts` — expect `en` in locales, update alternates assertions
- `tests/unit/seo-site-url.test.ts` — add `localeToInLanguage("en")` test
- `tests/unit/content.test.ts` — update `getAllArticleSlugs` assertion to include en
- `tests/integration/llms.route.test.ts` — expect en locale in output
- `tests/e2e/language-switcher.spec.ts` — update for new switcher UI
- `tests/e2e/seo-metadata.spec.ts` — update hreflang assertions

### Phase 14: Documentation

**Files:**
- `README.md` — update supported locales mention
- `docs/project-overview.md` — update locale references
- `docs/manual-exploratory-checklist.md` — add en locale checks

### Phase 15: Verification

Run in order:
1. `npm run verify:content`
2. `npm run verify:seo-geo`
3. `npm run build`

## Key Design Decisions

1. **`x-default` stays pointing to `/zh`** — per user instruction, unless there's a clear reason to change
2. **En alternates are conditional** — only output `en` in `alternates.languages` / sitemap if the en page/article actually exists
3. **Locale type widening** — change `"zh" | "ja"` to `"zh" | "ja" | "en"` everywhere, not just string
4. **Ternary cleanup** — replace `locale === "zh" ? ... : ...` with map objects for extensibility
5. **Content harness** — en missing-pair is a warning (P3), not a blocking error
6. **Language switcher** — dropdown-style selector showing all 3 locales
