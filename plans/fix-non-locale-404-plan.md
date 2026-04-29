# Fix Non-Locale URL 404s in Google Search Console

## Root Cause Analysis

### 1. Sitemap is NOT the source of the 404 URLs

[`src/app/sitemap.ts`](src/app/sitemap.ts) already correctly generates locale-prefixed URLs using the `LOCALES × STATIC_PAGES` pattern:

```typescript
for (const locale of LOCALES) {
  for (const page of STATIC_PAGES) {
    entries.push({ url: `${BASE_URL}/${locale}${page}`, ... });
  }
}
```

This produces URLs like `/zh/guides`, `/ja/guides`, `/zh/partner`, etc. **No bare `/guides` or `/partner` URLs are emitted.**

### 2. The real root cause: no middleware and no redirects

**Problem A — Middleware is not active:**
[`src/proxy.ts`](src/proxy.ts) contains a next-intl middleware configuration, but it is **never used**. Next.js requires the middleware file to be named `middleware.ts` at the project root or `src/middleware.ts`. The file `proxy.ts` is never imported anywhere — it is effectively dead code.

Without middleware:
- Visiting `/` returns 404 (no `src/app/page.tsx` exists)
- Visiting `/guides` returns 404 (no `src/app/guides/` directory — all guides are under `src/app/[locale]/guides/`)

**Problem B — No redirect rules in next.config.ts:**
[`next.config.ts`](next.config.ts) has no `redirects()` configuration. Non-locale URLs like `/guides`, `/partner`, `/trial`, `/faq` have no redirect to their locale-prefixed equivalents.

**Problem C — How did Google discover these URLs?**
Possible sources:
- Old deployment before locale structure was added
- External links pointing to non-locale URLs
- Google's own crawling heuristics (trying common paths)
- Historical sitemap from a previous version

### 3. Other files are correct

| File | Status |
|------|--------|
| [`src/lib/seo/site-url.ts`](src/lib/seo/site-url.ts) | ✅ Defaults to `https://kibouflow.com`, strips trailing slash |
| [`src/app/robots.ts`](src/app/robots.ts) | ✅ Correctly references `${SITE_URL}/sitemap.xml` |
| [`src/app/llms.txt/route.ts`](src/app/llms.txt/route.ts) | ✅ All URLs use `${SITE_URL}/${locale}/...` pattern |
| [`src/app/llms-full.txt/route.ts`](src/app/llms-full.txt/route.ts) | ✅ All URLs use locale-prefixed pattern |
| [`src/i18n/routing.ts`](src/i18n/routing.ts) | ✅ `defaultLocale: "zh"`, locales: `["zh", "ja"]` |
| Component `Link` imports | ✅ All use `@/i18n/navigation` which auto-prefixes locale |
| [`.env.example`](.env.example) | ✅ `NEXT_PUBLIC_SITE_URL=https://kibouflow.com` |

---

## Fix Plan

### Step 1: Add redirects in `next.config.ts`

Add a `redirects()` function to [`next.config.ts`](next.config.ts) that permanently redirects non-locale URLs to their `zh` equivalents.

**Redirect rules:**

| Source | Destination | Type |
|--------|-------------|------|
| `/guides` | `/zh/guides` | 308 |
| `/guides/:path+` | `/zh/guides/:path+` | 308 |
| `/partner` | `/zh/partner` | 308 |
| `/partner/:path+` | `/zh/partner/:path+` | 308 |
| `/trial` | `/zh/trial` | 308 |
| `/trial/:path+` | `/zh/trial/:path+` | 308 |
| `/faq` | `/zh/faq` | 308 |
| `/faq/:path+` | `/zh/faq/:path+` | 308 |

**Why 308 instead of 301?**
308 preserves the HTTP method (POST stays POST), which is the modern replacement for 301. Next.js `redirects()` uses 308 by default when `permanent: true`.

**Exclusions (no redirect needed):**
- `/api/*` — API routes, already under `src/app/api/`
- `/sitemap.xml` — served by `src/app/sitemap.ts`
- `/robots.txt` — served by `src/app/robots.ts`
- `/llms.txt` — served by `src/app/llms.txt/route.ts`
- `/llms-full.txt` — served by `src/app/llms-full.txt/route.ts`
- `/zh/*` and `/ja/*` — already locale-prefixed, no redirect needed

The redirect rules use specific paths (`/guides`, `/partner`, `/trial`, `/faq`) so they won't accidentally match `/api/*`, `/sitemap.xml`, etc.

### Step 2: Activate next-intl middleware

Rename [`src/proxy.ts`](src/proxy.ts) to `src/middleware.ts` so that Next.js picks it up as the middleware file.

This will:
- Redirect `/` → `/zh` (default locale)
- Handle locale detection for `/(zh|ja)/:path*` routes

**Note:** The middleware matcher `["/", "/(zh|ja)/:path*"]` does NOT match `/guides`, `/partner`, etc. Those are handled by the redirects in Step 1. The middleware only handles the root `/` and locale-prefixed routes.

### Step 3: Update sitemap test to assert no non-locale URLs

Add a test case to [`tests/unit/sitemap.test.ts`](tests/unit/sitemap.test.ts) that explicitly verifies no bare (non-locale) user-facing URLs exist in the sitemap.

### Step 4: www / http handling — infrastructure recommendation

The project uses Nginx + certbot (see [`deploy.sh`](deploy.sh)). Certbot's `--redirect` flag already handles `http → https`. However, `www` subdomain is not handled.

**Recommendation: Add Nginx server blocks for www redirect.**

In [`deploy.sh`](deploy.sh), after the main server block, add:

```nginx
server {
  listen 80;
  listen [::]:80;
  server_name www.${server_name};
  return 301 https://${server_name}$request_uri;
}

server {
  listen 443 ssl;
  listen [::]:443 ssl;
  server_name www.${server_name};
  # SSL cert paths from certbot
  ssl_certificate /etc/letsencrypt/live/www.${server_name}/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/www.${server_name}/privkey.pem;
  return 301 https://${server_name}$request_uri;
}
```

**This is NOT implemented in code** because:
1. The Nginx config is generated by `deploy.sh` and managed at the infrastructure level
2. www DNS must point to the same server first
3. SSL cert for `www.` subdomain needs to be obtained separately
4. Cloudflare or other CDN/proxy services can handle this more cleanly

**If using Cloudflare:**
- Add a Page Rule: `*www.kibouflow.com/*` → Forwarding URL (301) → `https://kibouflow.com/$1`
- Or use Cloudflare Redirect Rules for more granular control

---

## Files to Modify

| File | Change |
|------|--------|
| [`next.config.ts`](next.config.ts) | Add `redirects()` with non-locale → locale redirect rules |
| [`src/proxy.ts`](src/proxy.ts) | Rename to `src/middleware.ts` |
| [`tests/unit/sitemap.test.ts`](tests/unit/sitemap.test.ts) | Add test asserting no non-locale URLs in sitemap |

## Files NOT Modified

- `src/app/sitemap.ts` — already correct
- `src/app/robots.ts` — already correct
- `src/app/llms.txt/route.ts` — already correct
- `src/app/llms-full.txt/route.ts` — already correct
- `src/lib/content.ts` — no content model changes
- `src/i18n/routing.ts` — no routing changes
- MDX files — no slug changes
- `deploy.sh` — www handling is infrastructure-level (recommendation only)

---

## Verification Plan

1. Run `npm run verify:seo-geo` — validates sitemap, site-url, llms, robots tests + build
2. Run `npm run verify:local` — full local regression
3. Manual check: `next build` should succeed with new redirects
4. After deployment, verify:
   - `curl -s https://kibouflow.com/sitemap.xml | grep -E "kibouflow.com/(guides|partner|trial|faq)"` — should return nothing (no bare URLs)
   - `curl -I https://kibouflow.com/guides` — should return 308 redirect to `/zh/guides`
   - `curl -I https://kibouflow.com/partner` — should return 308 redirect to `/zh/partner`
   - `curl -I https://kibouflow.com/` — should return 308 redirect to `/zh` (via middleware)

---

## Architecture Diagram

```mermaid
flowchart TD
    A[Google crawls URL] --> B{URL has locale prefix?}
    B -->|Yes: /zh/guides| C[Normal route handling]
    B -->|No: /guides| D{Matched by redirects?}
    D -->|Yes| E[308 redirect to /zh/guides]
    D -->|No| F[404 not-found.tsx]
    
    G[User visits /] --> H{Middleware active?}
    H -->|Yes| I[Redirect to /zh]
    H -->|No| J[404 not-found.tsx]
    
    K[Sitemap] --> L[Only locale-prefixed URLs]
    L --> M[/zh/guides, /ja/guides, /zh/partner, /ja/partner, ...]
```
