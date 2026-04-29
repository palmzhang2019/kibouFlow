# Trial Form: Email-only Contact + Submission Rate Limit

## Execution Plan (Updated with User Constraints)

### Pre-execution Confirmation Checklist
- [ ] Confirm `trial_submissions` table has `created_at` column (from 001_init.sql line 21: `created_at timestamptz default now()`)
- [ ] Confirm postgres.js query pattern from existing `pg-data.ts` (uses tagged template literals)
- [ ] Email normalization: trim + toLowerCase before all comparisons and storage

### Step 1: Update Zod Schema (`src/lib/schemas.ts`)
- Change `contact: z.string().min(1)` to `contact: z.string().min(1).trim().toLowerCase().email()`
- This ensures normalized lowercase email enters the system

### Step 2: Add Email Rate Limit Query (`src/lib/pg-data.ts`)
- Add `hasRecentTrialSubmissionByEmail(email: string, hours = 24): Promise<boolean>`
- Email must be normalized (trim + toLowerCase) before query
- Uses postgres.js tagged template: `sql\`SELECT 1 FROM trial_submissions WHERE contact = ${email} AND created_at > now() - ${hours} * interval '1 hour' LIMIT 1\``
- Returns `false` when DATABASE_URL missing (don't block)
- Returns `false` on query error (fail-open)

### Step 3: Update API Route (`src/app/api/trial/route.ts`)
Processing order:
1. Parse body
2. IP rate limit check
3. Zod validation (includes email format + normalization via transform)
4. Email recent submission check via `hasRecentTrialSubmissionByEmail`
5. `insertTrialSubmission`

Duplicate email response:
```json
{ "error": "duplicate_email", "message": "这个邮箱今天已经提交过整理申请，请稍后再试。" }
```
Status: 429

### Step 4: Update TrialForm.tsx (`src/components/forms/TrialForm.tsx`)
- Contact input: `type="email"`
- Label: `t("form.contact")` → "邮箱地址" / "メールアドレス"
- Placeholder: `t("form.contactPlaceholder")` → "name@example.com"
- Frontend validation before submit:
  - Empty → show `t("error.contactRequired")`
  - Invalid format → show `t("error.invalidEmail")`
- API error handling:
  - 429 + `duplicate_email` → show `t("error.duplicateEmail")`
  - 429 + other → show `t("error.tooManyRequests")`
  - Other errors → show `t("error.submitFailed")`
- Button disabled during submit (already exists)
- Success → redirect to `/{locale}/trial/success` (already exists)

### Step 5: Update i18n Messages

**zh.json** trial.form:
- `contact`: "邮箱地址"
- `contactPlaceholder`: "name@example.com"

**zh.json** trial.error:
- `invalidEmail`: "请输入正确的邮箱地址"
- `duplicateEmail`: "这个邮箱今天已经提交过整理申请，请稍后再试。"

**ja.json** trial.form:
- `contact`: "メールアドレス"
- `contactPlaceholder`: "name@example.com"

**ja.json** trial.error:
- `invalidEmail`: "正しいメールアドレスを入力してください"
- `duplicateEmail`: "このメールアドレスでは本日すでに送信されています。時間をおいて再度お試しください。"

### Step 6: Update Tests

**tests/unit/schemas.test.ts:**
- Valid email passes
- Non-email contact rejected
- Empty contact rejected

**tests/integration/trial.route.test.ts:**
- Non-email contact returns 400
- Same email within 24h returns 429 + duplicate_email
- Normal email submission succeeds
- DATABASE_URL missing still works (degradation)

**tests/e2e/form-submission.spec.ts:**
- Update if any assertion references old "联系方式" text

### Files to Modify (10)
1. `src/lib/schemas.ts`
2. `src/lib/pg-data.ts`
3. `src/app/api/trial/route.ts`
4. `src/components/forms/TrialForm.tsx`
5. `src/messages/zh.json`
6. `src/messages/ja.json`
7. `tests/unit/schemas.test.ts`
8. `tests/integration/trial.route.test.ts`
9. `tests/e2e/form-submission.spec.ts` (if needed)
10. `tests/e2e/core-flows.spec.ts` (no change expected)

### Files NOT to Modify
- Partner form/API
- SEO/GEO files
- Content MDX
- Admin backend
- Existing migrations
- `.env*` files

### No New Migration Needed
`trial_submissions.contact` is `text` type — suitable for email storage.

### Verification
1. `npm run test`
2. `npm run verify:local`
