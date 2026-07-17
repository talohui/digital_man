# SMTP Credential Ownership Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the B-end service configuration page manage only the QQ SMTP sender email and authorization code, while the operations report page owns recipients and daily/weekly schedules.

**Architecture:** Add a dedicated admin SMTP update endpoint that changes only the sender credentials. Keep the existing combined settings endpoint for the operations report page's recipients and schedules. Remove recipient/schedule state and controls from `AdminServiceConfigPage` and leave the report page as the single schedule editor.

**Tech Stack:** React + TypeScript + Ant Design, Node built-in tests, Spring Boot 3.3, Java records, Spring Data JPA, Maven.

---

### Task 1: Add the SMTP-only frontend API contract

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/api/emailReports.ts`
- Test: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/api/emailReports.test.ts`

- [ ] **Step 1: Write the failing request test**

Add a test that calls `updateEmailReportSmtpSettings('token', { smtpUsername: 'sender@qq.com', smtpAuthCode: 'temporary-code' })`, stubs `fetch`, and asserts the request URL ends in `/api/admin/email-reports/smtp` and the JSON body contains only `smtpUsername` and `smtpAuthCode`.

- [ ] **Step 2: Run the focused test and verify it fails for the missing function**

Run from `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo`:

```bash
node --test src/api/emailReports.test.ts
```

Expected: FAIL because `updateEmailReportSmtpSettings` is not exported.

- [ ] **Step 3: Implement the SMTP-only request function**

Add:

```ts
export function updateEmailReportSmtpSettings(
  token: string,
  settings: EmailReportSmtpUpdate,
): Promise<EmailReportSettings> {
  return request('/admin/email-reports/smtp', buildEmailReportRequest('PUT', token, settings))
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run the same command. Expected: all email API tests pass, including the assertion that schedule and recipient fields are not sent.

### Task 2: Add a backend SMTP-only update endpoint

**Files:**
- Create: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/analytics-server/src/main/java/com/lingshan/analytics/dto/UpdateEmailReportSmtpSettingsRequest.java`
- Modify: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/analytics-server/src/main/java/com/lingshan/analytics/service/EmailReportSettingsService.java`
- Modify: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/analytics-server/src/main/java/com/lingshan/analytics/controller/AdminEmailReportController.java`
- Test: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/analytics-server/src/test/java/com/lingshan/analytics/service/EmailReportSettingsServiceTest.java`
- Test: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/analytics-server/src/test/java/com/lingshan/analytics/controller/AdminEmailReportControllerTest.java`

- [ ] **Step 1: Write the failing service test**

Create a test that first persists a settings entity with one recipient, daily and weekly schedules, then calls `updateSmtp(new UpdateEmailReportSmtpSettingsRequest("sender@qq.com", "temporary-code"))`. Assert that `current()` still returns the original recipient and schedule values, while `currentSmtp()` returns the new sender and decrypted authorization code.

- [ ] **Step 2: Run the service test and verify it fails for the missing request type/method**

Run from `/private/tmp/quizzical-analytics-check-20260715` after copying the current `analytics-server` source:

```bash
mvn -q -Dtest=EmailReportSettingsServiceTest test
```

Expected: FAIL because the SMTP-only request type and service method do not exist.

- [ ] **Step 3: Implement the isolated update path**

Add the two-field record. In `EmailReportSettingsService.updateSmtp`, load or create the default settings entity, validate and lower-case the sender email, encrypt and store only a nonblank authorization code, update `updatedAt`, save the entity, and return `current()`/the existing DTO. Do not call recipient normalization, schedule validation, or modify any schedule fields.

Add `@PutMapping("/smtp")` in `AdminEmailReportController`, reuse the existing admin-session check, call `settingsService.updateSmtp(request)`, and return the existing response shape. Do not call `scheduler.reschedule()` for credential-only updates.

- [ ] **Step 4: Add the controller boundary assertion**

Extend the controller test to invoke the SMTP endpoint with a valid admin session and assert a successful response while verifying the scheduler is not rescheduled and the returned settings retain the existing recipient/schedule data.

- [ ] **Step 5: Run the focused backend tests and verify they pass**

Run:

```bash
mvn -q -Dtest=EmailReportSettingsServiceTest,AdminEmailReportControllerTest,JavaMailEmailReportSenderTest test
```

Expected: PASS with no SMTP credential printed in output.

### Task 3: Reduce the service configuration page to SMTP credentials

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/pages/AdminServiceConfigPage.tsx`
- Test: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/pages/AdminServiceConfigPage.test.ts`

- [ ] **Step 1: Write the failing page assertions**

Update the page test to require `updateEmailReportSmtpSettings` and the credential save label, and assert that the source does not contain the service-page-only labels `收件人`, `每日自动发送`, `每周自动发送`, or `保存发送计划`.

- [ ] **Step 2: Run the page test and verify it fails because duplicate controls remain**

Run:

```bash
node --test src/pages/AdminServiceConfigPage.test.ts
```

Expected: FAIL on the negative assertions because the duplicate controls are still present.

- [ ] **Step 3: Remove duplicate state, imports, handlers, and JSX**

Remove the service page's recipient draft state, recipient add handler, weekday constant, recipient validation constant, and schedule-related Ant Design imports. Replace `onSaveMailSettings` with an SMTP-only save that calls `updateEmailReportSmtpSettings` with the sender email and optional authorization code, then refreshes the SMTP status and clears only the password field. Keep the status tag, sender email input, authorization-code password input, the save button labeled `保存 QQ SMTP 配置`, and the `前往运营报告` link.

- [ ] **Step 4: Run the page/API tests and verify they pass**

Run:

```bash
node --test src/pages/AdminServiceConfigPage.test.ts src/api/emailReports.test.ts
```

Expected: PASS, with no service-page recipient or schedule labels.

### Task 4: Clarify the operations report page as the single schedule editor

**Files:**
- Modify: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/pages/AdminEmailReportPage.tsx`
- Test: `/Users/MR/Desktop/软件杯/.claude/worktrees/quizzical-napier-4daa46/demo/src/pages/AdminEmailReportPage.navigation.test.ts`

- [ ] **Step 1: Update the report-page copy test**

Require copy that directs users to configure the QQ sender credentials in the service configuration page, and require the existing recipient/schedule labels to remain.

- [ ] **Step 2: Update only the copy and visible ownership cues**

Change the warning text from deployment-environment-only wording to “请先在服务配置页配置 QQ 发件邮箱和授权码，再点击‘发送测试邮件’验证。” Keep the report page's existing recipient/schedule controls, combined schedule save call, test-email button, and dispatch history unchanged.

- [ ] **Step 3: Run the report-page tests**

Run:

```bash
node --test src/pages/AdminEmailReportPage.navigation.test.ts
```

Expected: PASS.

### Task 5: Full verification and handoff

**Files:**
- No new production files; inspect the modified files above.

- [ ] **Step 1: Run frontend type checking and production build without writing into the source worktree**

From the demo worktree run:

```bash
./node_modules/.bin/tsc --noEmit --pretty false --project tsconfig.json
node --input-type=module -e "import { build } from 'vite'; import react from '@vitejs/plugin-react'; await build({ configFile: false, root: process.cwd(), plugins: [react()], build: { outDir: '/private/tmp/quizzical-demo-dist-20260715-smtp-split', chunkSizeWarningLimit: 800 } });"
```

Expected: type checking exits 0 and Vite reports `built`.

- [ ] **Step 2: Run the focused backend tests in a temporary copy**

Copy `analytics-server` to `/private/tmp/quizzical-analytics-check-20260715-smtp-split` and run the focused Maven test command from Task 2. Expected: exit 0.

- [ ] **Step 3: Inspect the final diff for scope**

Run:

```bash
git diff -- demo/src/api/emailReports.ts demo/src/pages/AdminServiceConfigPage.tsx demo/src/pages/AdminEmailReportPage.tsx analytics-server/src/main/java/com/lingshan/analytics/dto/UpdateEmailReportSmtpSettingsRequest.java analytics-server/src/main/java/com/lingshan/analytics/service/EmailReportSettingsService.java analytics-server/src/main/java/com/lingshan/analytics/controller/AdminEmailReportController.java
```

Confirm no recipient/schedule data is sent by the service page and no authorization code is hardcoded or printed.
