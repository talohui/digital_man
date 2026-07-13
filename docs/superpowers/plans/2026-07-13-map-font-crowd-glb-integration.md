# Map, Typography, Crowd Entry, and GLB Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current project's map, C-app typography, home crowd navigation, and GLB runtime with the verified implementations from `origin/feature/lingshan-map-3d` while preserving every unrelated local feature and uncommitted change.

**Architecture:** Independent map and GLB files are restored from the source branch as a bounded subsystem. Shared entry files are merged manually, never overwritten. GLB assets remain Git LFS managed; only runtime-referenced assets are materialized, while existing `optimized-min` assets remain available for mobile compatibility.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, React Router, Tencent Maps WebGL, Git LFS, GLB/glTF.

---

### Task 1: Capture Baseline and Establish Rollback Inventory

**Files:**
- Read: all current files under `demo/`
- Create outside repository: `/tmp/quizzical-map-integration-before/`

- [ ] **Step 1: Record the dirty worktree without changing it**

Run:

```bash
git status --porcelain=v1 > /tmp/quizzical-map-integration-before-status.txt
git diff --binary > /tmp/quizzical-map-integration-before-tracked.patch
git ls-files --others --exclude-standard > /tmp/quizzical-map-integration-before-untracked.txt
```

Expected: three inventory files exist and no tracked file changes.

- [ ] **Step 2: Back up only shared files that will be manually merged**

Copy these files to `/tmp/quizzical-map-integration-before/` while preserving paths:

```text
demo/src/App.tsx
demo/src/main.tsx
demo/src/mobile/MobileHomePage.tsx
demo/src/styles/global.css
demo/package.json
demo/package-lock.json
```

Expected: each current file has an external rollback copy.

- [ ] **Step 3: Run the pre-change frontend baseline**

Run:

```bash
cd demo
npm test -- --run
npm run build
```

Expected: record exact pre-existing failures. Do not attribute them to this integration.

### Task 2: Add Migration Contract Tests First

**Files:**
- Restore test: `demo/src/pages/guideRoutes.test.ts`
- Restore test: `demo/src/lib/cAppReturnContext.test.ts`
- Restore test: `demo/src/lib/mapResumeState.test.ts`
- Restore tests: `demo/src/prototype-navigation/*.test.ts`
- Create test: `demo/src/mobile/MobileHomeMapEntry.test.tsx`

- [ ] **Step 1: Restore source-branch map contract tests only**

Restore the listed tests from `origin/feature/lingshan-map-3d` without restoring production modules.

- [ ] **Step 2: Add a focused homepage navigation test**

The test must assert these destination strings remain present in the homepage component contract:

```ts
expect(source).toContain("navigate('/map-3d-guide-c')")
expect(source).toContain('/map-3d-guide-c/poi/${encodeURIComponent(spot.id)}?from=browse')
expect(source).toContain("saveHomeReturn('home-crowd'")
```

- [ ] **Step 3: Run the restored tests and verify RED**

Run:

```bash
npx vitest run src/pages/guideRoutes.test.ts src/lib/cAppReturnContext.test.ts src/lib/mapResumeState.test.ts src/mobile/MobileHomeMapEntry.test.tsx
```

Expected: failures caused by missing map routes, missing return-context behavior, or missing modules.

### Task 3: Restore the Independent Map Subsystem

**Files:**
- Restore: `demo/src/components/map/**`
- Restore: `demo/src/components/map3d/**`
- Restore: `demo/src/data/lingshanInkMapBounds.ts`
- Restore: `demo/src/data/lingshanLandmarkLod.ts`
- Restore: `demo/src/data/lingshanMap3DGardenAssets.ts`
- Restore: `demo/src/data/lingshanMap3DManualTreeAssets.ts`
- Restore: `demo/src/data/lingshanMapData.ts`
- Restore: `demo/src/data/lingshanMapModelOverlays.ts`
- Restore: `demo/src/data/lingshanScenicRoutes.ts`
- Restore: `demo/src/data/lingshanTreeScaleNormalization.ts`
- Restore: `demo/src/data/legacyPoiRoutes.ts`
- Restore: `demo/src/data/poiDetailContent.ts`
- Restore: `demo/src/data/poiGuideMetadata.ts`
- Restore: `demo/src/data/scenicMediaCatalog.ts`
- Restore: `demo/src/data/scenicPoiCatalog.ts`
- Restore: `demo/src/hooks/useLandmarkModelInspector.ts`
- Restore: `demo/src/hooks/useMapResumeMemory.ts`
- Restore: `demo/src/lib/cAppReturnContext.ts`
- Restore: `demo/src/lib/loadTMap.ts`
- Restore: `demo/src/lib/map/**`
- Restore: `demo/src/lib/map3dCamera.ts`
- Restore: `demo/src/lib/map3dPerf.ts`
- Restore: `demo/src/lib/map3dPreload.ts`
- Restore: `demo/src/lib/mapGuideNavigation.ts`
- Restore: `demo/src/lib/mapResumeState.ts`
- Restore: `demo/src/pages/Map3DGuidePage.tsx`
- Restore: `demo/src/pages/Map3DGuidePrototypeCPage.tsx`
- Restore: `demo/src/pages/Map3DPoiDetailPage.tsx`
- Restore: `demo/src/pages/Map3DRouteGuidePage.tsx`
- Restore: `demo/src/prototype-navigation/**`
- Restore: `demo/src/store/useMapGuideUiStore.ts`
- Restore: `demo/src/styles/map/**`
- Restore: `demo/src/types/mapGuide.ts`
- Preserve: all admin, emergency, privacy, Fay, RAG, and analytics files

- [ ] **Step 1: Generate an exact source manifest**

Use `git ls-tree -r --name-only origin/feature/lingshan-map-3d` for the paths above and save the list outside the repository. Exclude `.orig`, `.rej`, debug output, documentation, and unrelated pages.

- [ ] **Step 2: Restore manifest files from the source branch**

Use Git's source restore for the exact manifest. Existing files within this map-only boundary are intentionally replaced; files outside the manifest are untouched.

- [ ] **Step 3: Remove source-branch-only imports that are not part of the production route**

Only remove an import if TypeScript proves the dependency absent and the imported surface is debug-only. Do not remove runtime navigation, LOD, route, POI, or GLB imports.

- [ ] **Step 4: Run map unit tests**

Run:

```bash
npx vitest run src/lib/mapResumeState.test.ts src/pages/guideRoutes.test.ts src/prototype-navigation
```

Expected: the restored pure map tests pass; App route tests may remain red until Task 5.

### Task 4: Restore GLB Runtime and Materialize Required LFS Assets

**Files:**
- Restore: `demo/src/lib/map/GLBMemoryManager.ts`
- Restore: `demo/src/lib/map/GLBRuntimeOrchestrator.ts`
- Restore: `demo/src/lib/map/GLBSpatialController.ts`
- Restore: `demo/src/data/lingshanLandmarkLod.ts`
- Restore: `demo/src/data/lingshanMapModelOverlays.ts`
- Preserve: `demo/public/models/lingshan/optimized-min/**`
- Materialize: runtime-referenced files under `demo/public/models/lingshan/optimized/**`
- Materialize: `demo/public/assets/map-3d-guide/glb-garden/**`

- [ ] **Step 1: Enumerate runtime URLs from TypeScript configuration**

Extract `.glb` URLs from `lingshanMapModelOverlays.ts`, `lingshanLandmarkLod.ts`, `lingshanMap3DGardenAssets.ts`, and `lingshanMap3DManualTreeAssets.ts`. Resolve each URL to `demo/public/...` and verify it exists in the source branch or current local assets.

- [ ] **Step 2: Fetch only required Git LFS objects**

Run a scoped `git lfs fetch origin feature/lingshan-map-3d --include='<comma-separated runtime asset paths>'` followed by scoped `git lfs checkout` for the manifest.

Expected: materialized files begin with GLB binary magic, not `version https://git-lfs.github.com/spec/v1`.

- [ ] **Step 3: Verify mobile loading policy in tests**

Add or restore tests covering:

```ts
expect(resolveLandmarkLodRuntimeChoice(overlay, farDistance)?.tier).toBe('far')
expect(resolveLandmarkLodRuntimeChoice(overlay, nearDistance)?.tier).toBe('near')
```

Verify source constants remain 36MB / concurrency 1 on mobile and 150MB / concurrency 2 on desktop.

- [ ] **Step 4: Run GLB and LOD tests**

Run:

```bash
npx vitest run src/lib src/data src/hooks --run
```

Expected: all selected GLB, map runtime, and LOD tests pass.

### Task 5: Merge Shared Routing and Entry Files

**Files:**
- Modify: `demo/src/App.tsx`
- Modify: `demo/src/main.tsx`
- Modify only if required: `demo/package.json`
- Modify only if required: `demo/package-lock.json`

- [ ] **Step 1: Add lazy imports without replacing the current App shell**

Add these imports to the current `App.tsx`:

```tsx
const Map3DGuidePrototypeCPage = lazy(() => import('./pages/Map3DGuidePrototypeCPage'))
const Map3DPoiDetailPage = lazy(() => import('./pages/Map3DPoiDetailPage'))
const Map3DRouteGuidePage = lazy(() => import('./pages/Map3DRouteGuidePage'))
```

- [ ] **Step 2: Add production map routes in both mobile and desktop route sets**

Add:

```tsx
<Route path="/map-3d-guide-c/poi/:poiId" element={<Map3DPoiDetailPage />} />
<Route path="/map-3d-guide-c/route/:routeId" element={<Map3DRouteGuidePage />} />
<Route path="/map-3d-guide-c" element={<Map3DGuidePrototypeCPage />} />
```

Preserve all existing `/admin/*`, `/guide`, emergency, privacy, and service configuration routes.

- [ ] **Step 3: Merge map preloading guard**

Call `scheduleMap3DGuidePreload` only outside admin routes and avoid landmark preloads on POI detail routes.

- [ ] **Step 4: Add the C-app typography import**

Add to `main.tsx` without reordering unrelated imports:

```ts
import './styles/c-app/cAppTypography.css'
```

- [ ] **Step 5: Install only missing source dependencies**

Compare `package.json` with the source branch. Add a dependency only when a restored module imports it and it is absent locally. Regenerate the lockfile using npm; never copy the entire source lockfile over local changes.

- [ ] **Step 6: Run route tests and TypeScript build**

Run:

```bash
npx vitest run src/pages/guideRoutes.test.ts
npm run build
```

Expected: route test and production build pass.

### Task 6: Restore C-App Local Typography

**Files:**
- Restore: `demo/src/styles/c-app/cAppTypography.css`
- Restore/materialize: `demo/public/fonts/lingshan/noto-serif-sc-700.woff2`
- Restore/materialize: `demo/public/fonts/lingshan/noto-serif-sc-800.woff2`
- Restore/materialize: `demo/public/fonts/lingshan/noto-sans-sc-500.woff2`
- Restore/materialize: `demo/public/fonts/lingshan/noto-sans-sc-700.woff2`
- Preserve: B-end admin styles

- [ ] **Step 1: Restore the font stylesheet and font assets**

Restore exact source files. Verify each WOFF2 file is non-empty and has the same blob hash as the source branch.

- [ ] **Step 2: Verify selector scoping**

Assert the stylesheet scopes font application to C-app surfaces and contains no `.admin-*`, `.ant-layout`, or global `body { font-family: ... }` override.

- [ ] **Step 3: Build**

Run `npm run build` and verify all four font assets are emitted or copied into the production public output.

### Task 7: Merge Homepage Crowd Navigation

**Files:**
- Modify: `demo/src/mobile/MobileHomePage.tsx`
- Restore or modify: `demo/src/lib/cAppReturnContext.ts`
- Preserve: current emergency, personalization, privacy, and guide state behavior

- [ ] **Step 1: Add return-context support without replacing the entire homepage**

Merge `useLocation`, `getPoiMedia`, `readCAppReturnContext`, `saveCAppReturnContext`, and `consumeCAppReturnContext` into the current homepage.

- [ ] **Step 2: Replace only the crowd section behavior**

The map button must navigate to `/map-3d-guide-c`. A crowd row must save `home-crowd` return context and navigate to `/map-3d-guide-c/poi/:poiId?from=browse`.

- [ ] **Step 3: Preserve current homepage features**

Compare the resulting file with the pre-change backup. Any non-crowd block present before migration must remain unless a required import signature changed.

- [ ] **Step 4: Verify GREEN**

Run:

```bash
npx vitest run src/mobile/MobileHomeMapEntry.test.tsx src/lib/cAppReturnContext.test.ts
```

Expected: both tests pass.

### Task 8: Regression, Browser, and Scope Verification

**Files:**
- Read: all changed files

- [ ] **Step 1: Verify the change scope**

Run `git diff --name-status` and compare with the source manifest. Confirm no analytics-server, Fay, RAG, memory, database, key, admin decision, emergency, or privacy file changed because of this integration.

- [ ] **Step 2: Run complete frontend tests**

Run:

```bash
npm test -- --run
```

Expected: zero new failures compared with Task 1 baseline.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: exit code 0.

- [ ] **Step 4: Start or reuse one frontend dev server**

Do not start a duplicate process. Verify `/`, `/map-3d-guide-c`, a POI detail URL, a route URL, and `/admin` in the browser at mobile and desktop widths.

- [ ] **Step 5: Verify GLB network behavior**

Confirm runtime GLB responses are binary, far LOD loads before near models where appropriate, and failed GLB requests do not make the base map unusable.

- [ ] **Step 6: Review final diff against the design**

Check every requirement in `docs/superpowers/specs/2026-07-13-map-font-crowd-glb-integration-design.md`. Report any unmet item explicitly; do not claim completion unless all required verification commands have fresh successful output.
