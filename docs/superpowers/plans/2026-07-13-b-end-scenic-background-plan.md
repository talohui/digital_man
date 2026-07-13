# B-End Scenic Background Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the B-end right workspace's plain warm background with the approved Lingshan watercolor image at medium visual strength without affecting the sidebar, visitor app, or real admin behavior.

**Architecture:** Copy the user-provided image into the frontend's public admin image directory, then reference it only from the scoped `.admin-ops-workspace` styles. Add a source-level regression test before implementation so future global CSS changes cannot leak this asset into the visitor app.

**Tech Stack:** React 18, Vite, scoped CSS, Node test runner.

---

## File map

- Create `demo/public/images/admin/lingshan-ops-landscape.png`: stable project-owned background asset.
- Modify `demo/src/styles/admin-ops.css`: desktop and mobile background treatments.
- Modify `demo/src/pages/adminOpsShell.test.ts`: asset existence and CSS scoping contracts.

### Task 1: Add a failing scenic-background contract

**Files:**
- Modify: `demo/src/pages/adminOpsShell.test.ts`

- [ ] **Step 1: Add the asset and scope assertions**

Append this test:

```ts
test('admin workspace uses the project-owned Lingshan scenic background only', () => {
  const asset = new URL('../../public/images/admin/lingshan-ops-landscape.png', import.meta.url)
  assert.equal(existsSync(asset), true, 'missing project-owned scenic background')
  assert.match(styles, /\.admin-ops-workspace\s*\{[^}]*lingshan-ops-landscape\.png/s)
  assert.match(styles, /linear-gradient\([^}]*lingshan-ops-landscape\.png/s)
  assert.doesNotMatch(styles, /(^|\n)\s*(html|body|:root)[^{]*\{[^}]*lingshan-ops-landscape/s)
})
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
cd demo
node --test src/pages/adminOpsShell.test.ts
```

Expected: FAIL with `missing project-owned scenic background` because the asset and style are not implemented yet.

### Task 2: Add the stable asset and scoped background treatment

**Files:**
- Create: `demo/public/images/admin/lingshan-ops-landscape.png`
- Modify: `demo/src/styles/admin-ops.css`

- [ ] **Step 1: Copy the approved image into the public admin asset directory**

Copy:

```bash
mkdir -p demo/public/images/admin
cp '/var/folders/g3/w1js6xxx49jfnn6q0z242jp80000gn/T/codex-clipboard-5c771e9d-5158-438c-a23a-2a6cfe82cc48.png' \
  demo/public/images/admin/lingshan-ops-landscape.png
```

Do not reference the temporary chat path from CSS.

- [ ] **Step 2: Apply the desktop medium-strength background**

Change `.admin-ops-workspace` to:

```css
.admin-ops-workspace {
  width: calc(100% - 236px);
  min-width: 0;
  min-height: 100vh;
  margin-left: 236px;
  background:
    linear-gradient(180deg, rgba(247, 243, 233, 0.7) 0%, rgba(247, 243, 233, 0.8) 52%, rgba(247, 243, 233, 0.9) 100%),
    url('/images/admin/lingshan-ops-landscape.png') 68% top / cover fixed no-repeat;
  transition: width 220ms ease, margin-left 220ms ease;
}
```

Keep `.admin-ops-sidebar` unchanged.

- [ ] **Step 3: Strengthen surface readability without glassmorphism**

Update the shared surfaces:

```css
.admin-ops-topbar {
  background: rgba(255, 253, 248, 0.95);
}

.admin-ops-shell .ant-card {
  background-color: rgba(255, 253, 248, 0.95);
}
```

Retain existing semantic alert, highlight, table, and chart colors.

- [ ] **Step 4: Add the mobile treatment**

Inside `@media (max-width: 860px)` add:

```css
.admin-ops-workspace,
.admin-ops-shell.is-collapsed .admin-ops-workspace {
  background:
    linear-gradient(180deg, rgba(247, 243, 233, 0.8), rgba(247, 243, 233, 0.92)),
    url('/images/admin/lingshan-ops-landscape.png') 60% top / auto 100vh scroll no-repeat;
}
```

This disables fixed background attachment on narrow browsers and increases the readability veil.

- [ ] **Step 5: Run the focused test and confirm GREEN**

Run:

```bash
cd demo
node --test src/pages/adminOpsShell.test.ts
```

Expected: all scenic-background and existing shell tests pass.

### Task 3: Verify behavior, build, and visual rendering

**Files:**
- Verify only; no planned production-file changes.

- [ ] **Step 1: Run the full frontend test suite**

Run:

```bash
cd demo
node --test src/**/*.test.ts
```

Expected: all tests pass with zero failures.

- [ ] **Step 2: Run the production build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite complete successfully; existing chunk-size warnings are acceptable.

- [ ] **Step 3: Verify desktop rendering**

Open `http://127.0.0.1:5176/admin` at the default desktop viewport and confirm:

- the image appears only to the right of the sidebar;
- the statue and central scenic axis remain recognizable;
- metrics, cards, charts, and topbar remain legible;
- `document.documentElement.scrollWidth === document.documentElement.clientWidth`.

- [ ] **Step 4: Verify 390px rendering**

At 390x844 on `/admin/decision`, confirm:

- there is no horizontal overflow;
- the mobile menu still opens;
- the stronger veil prevents the image from reducing text contrast;
- scrolling remains stable because the background is not fixed.

- [ ] **Step 5: Check the scoped diff**

Run:

```bash
git diff --check -- demo/src/styles/admin-ops.css demo/src/pages/adminOpsShell.test.ts
git status --short -- demo/public/images/admin/lingshan-ops-landscape.png demo/src/styles/admin-ops.css demo/src/pages/adminOpsShell.test.ts
```

Expected: no whitespace errors and only the three intended paths are reported for this feature.
