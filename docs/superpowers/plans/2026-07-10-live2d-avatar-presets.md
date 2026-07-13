# Live2D Avatar Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three local Live2D character presets while preserving the current default 小灵 model and enabling administrators to preview and select a preset.

**Architecture:** A small frontend preset registry owns the allowed model URLs, display names and costume capability. The B-end form renders those registry entries as cards and persists the existing `live2dModelUrl` / `live2dPresetName` fields. The existing C-end `Live2DStage` already consumes the public model URL, so it needs no new route or service.

**Tech Stack:** React, TypeScript, Ant Design, PIXI, pixi-live2d-display, Vite, Node test runner.

---

## File structure

- Create `demo/src/lib/live2dPresets.ts`: fixed allowlist and pure preset lookup helpers.
- Create `demo/src/lib/live2dPresets.test.ts`: registry and costume-capability tests.
- Modify `demo/src/components/admin/AdminLive2DPreview.tsx`: accept a selected model URL and re-create the preview model when it changes.
- Modify `demo/src/pages/AdminAvatarPage.tsx`: render four preset cards, preserve default selection, and disable costume selection for alternate models.
- Add `demo/public/live2d/haru_final/**`, `haru_second/**`, `haru_third/**`: Cubism model files, texture, physics, pose, expressions and motion assets copied from `digital_man.zip`.

### Task 1: Define the preset registry

**Files:**
- Create: `demo/src/lib/live2dPresets.ts`
- Test: `demo/src/lib/live2dPresets.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_LIVE2D_PRESET,
  findLive2DPreset,
  listLive2DPresets
} from './live2dPresets'

test('keeps the existing 小灵 model as the default preset', () => {
  assert.equal(DEFAULT_LIVE2D_PRESET.id, 'default')
  assert.equal(DEFAULT_LIVE2D_PRESET.supportsCostumes, true)
})

test('lists the default model plus all three supplied local models', () => {
  assert.deepEqual(
    listLive2DPresets().map((preset) => preset.id),
    ['default', 'haru-final', 'haru-second', 'haru-third']
  )
})

test('recognises supplied local model URLs and prevents incompatible costume use', () => {
  const preset = findLive2DPreset('/live2d/haru_second/haru_second.model3.json')
  assert.equal(preset?.id, 'haru-second')
  assert.equal(preset?.supportsCostumes, false)
})
```

- [ ] **Step 2: Run the tests and verify the expected failure**

Run: `node --test src/lib/live2dPresets.test.ts`

Expected: `ERR_MODULE_NOT_FOUND` because `live2dPresets.ts` does not yet exist.

- [ ] **Step 3: Implement the minimal preset registry**

```ts
export type Live2DPreset = {
  id: 'default' | 'haru-final' | 'haru-second' | 'haru-third'
  name: string
  modelUrl: string
  supportsCostumes: boolean
}

export const DEFAULT_LIVE2D_PRESET: Live2DPreset = {
  id: 'default',
  name: '默认·小灵',
  modelUrl: '/live2d/haru/haru_greeter_t03.model3.json',
  supportsCostumes: true
}

const PRESETS: readonly Live2DPreset[] = [
  DEFAULT_LIVE2D_PRESET,
  { id: 'haru-final', name: '小灵·雅致', modelUrl: '/live2d/haru_final/haru_final.model3.json', supportsCostumes: false },
  { id: 'haru-second', name: '小灵·清新', modelUrl: '/live2d/haru_second/haru_second.model3.json', supportsCostumes: false },
  { id: 'haru-third', name: '小灵·灵动', modelUrl: '/live2d/haru_third/haru_third.model3.json', supportsCostumes: false }
]

export function listLive2DPresets() { return [...PRESETS] }

export function findLive2DPreset(modelUrl: string | null | undefined) {
  return PRESETS.find((preset) => preset.modelUrl === modelUrl) ?? null
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `node --test src/lib/live2dPresets.test.ts`

Expected: three passing tests.

- [ ] **Step 5: Commit the registry and its tests**

```bash
git add demo/src/lib/live2dPresets.ts demo/src/lib/live2dPresets.test.ts
git commit -m "feat: add live2d avatar preset registry"
```

### Task 2: Import the supplied Live2D resources

**Files:**
- Create: `demo/public/live2d/haru_final/**`
- Create: `demo/public/live2d/haru_second/**`
- Create: `demo/public/live2d/haru_third/**`

- [ ] **Step 1: Extract only the three approved model directories**

Run:

```bash
unzip -q /Users/MR/Downloads/digital_man.zip \
  'digital_man/demo/public/live2d/haru_final/*' \
  'digital_man/demo/public/live2d/haru_second/*' \
  'digital_man/demo/public/live2d/haru_third/*' \
  -d /tmp/lingshan-live2d-import
```

Expected: each extracted directory contains a `.model3.json`, `.moc3`, `texture_00.png`, physics, pose, expressions and motions.

- [ ] **Step 2: Copy the three extracted directories into the current demo public directory**

Run:

```bash
rsync -a /tmp/lingshan-live2d-import/digital_man/demo/public/live2d/haru_final/ demo/public/live2d/haru_final/
rsync -a /tmp/lingshan-live2d-import/digital_man/demo/public/live2d/haru_second/ demo/public/live2d/haru_second/
rsync -a /tmp/lingshan-live2d-import/digital_man/demo/public/live2d/haru_third/ demo/public/live2d/haru_third/
```

- [ ] **Step 3: Validate each resource manifest resolves its local texture and action references**

Run:

```bash
for model in demo/public/live2d/haru_{final,second,third}/*.model3.json; do
  test -f "$model"
done
```

Expected: exit code zero.

- [ ] **Step 4: Commit only the imported model assets**

```bash
git add demo/public/live2d/haru_final demo/public/live2d/haru_second demo/public/live2d/haru_third
git commit -m "feat: add local live2d avatar assets"
```

### Task 3: Make B-end preview switch models

**Files:**
- Modify: `demo/src/components/admin/AdminLive2DPreview.tsx`

- [ ] **Step 1: Add a failing component-facing contract test through the preset helper**

Add to `demo/src/lib/live2dPresets.test.ts`:

```ts
test('returns the default preset for an empty configured model URL', () => {
  assert.equal(findLive2DPreset('')?.id ?? DEFAULT_LIVE2D_PRESET.id, 'default')
})
```

- [ ] **Step 2: Run the test and verify the fallback contract**

Run: `node --test src/lib/live2dPresets.test.ts`

Expected: the helper returns `null` for an empty URL and the caller explicitly uses `DEFAULT_LIVE2D_PRESET` as its fallback.

- [ ] **Step 3: Replace the hard-coded preview URL with a prop**

Implement this interface and loading behavior:

```ts
type Props = {
  modelUrl: string
  costumeId?: CostumeId | string | null
  supportsCostumes?: boolean
  className?: string
}

const model = await Live2DModel.from(modelUrl, { autoInteract: true })
if (supportsCostumes) {
  await applyCostumeTexture(model as Parameters<typeof applyCostumeTexture>[0], id)
}
```

Make the model-loading effect depend on `modelUrl` and `supportsCostumes`. Keep its existing cleanup so each preview switch destroys the prior PIXI application and canvas children.

- [ ] **Step 4: Run TypeScript verification**

Run: `node node_modules/typescript/bin/tsc --noEmit`

Expected: exit code zero.

- [ ] **Step 5: Commit the preview change**

```bash
git add demo/src/components/admin/AdminLive2DPreview.tsx demo/src/lib/live2dPresets.test.ts
git commit -m "feat: allow admin preview to switch live2d models"
```

### Task 4: Add B-end preset cards and save behavior

**Files:**
- Modify: `demo/src/pages/AdminAvatarPage.tsx`

- [ ] **Step 1: Write a failing registry-derived test for default preservation**

Add to `demo/src/lib/live2dPresets.test.ts`:

```ts
test('does not infer a supplied preset when the stored model is the existing default', () => {
  assert.equal(findLive2DPreset(DEFAULT_LIVE2D_PRESET.modelUrl)?.name, '默认·小灵')
})
```

- [ ] **Step 2: Run the tests and verify the test is meaningful**

Run: `node --test src/lib/live2dPresets.test.ts`

Expected: the test verifies the model URL preserved by the B-end form maps to the existing default card.

- [ ] **Step 3: Implement card selection and form save**

Use the registry in `AdminAvatarPage.tsx`:

```ts
const [previewPreset, setPreviewPreset] = useState(DEFAULT_LIVE2D_PRESET)
const supportsCostumes = previewPreset.supportsCostumes

adminPut('/admin/avatar-config', {
  live2dModelUrl: previewPreset.modelUrl,
  live2dPresetName: previewPreset.name,
  costumeId: supportsCostumes ? parseCostumeId(values.costumeId) : 'default',
  voiceId: values.voiceId,
  voiceName: selectedVoiceName,
  displayName: values.displayName
})
```

Render each preset as an Ant Design card/radio control with a selected border and accessible button label. Derive the initial card from the loaded configuration. Pass `previewPreset.modelUrl` and `previewPreset.supportsCostumes` to `AdminLive2DPreview`. Disable the costume select with the exact help text `该形象使用原始服装，暂不支持默认小灵的换装贴图。` when `supportsCostumes` is false.

- [ ] **Step 4: Verify the frontend checks**

Run:

```bash
node --test src/lib/live2dPresets.test.ts
node node_modules/typescript/bin/tsc --noEmit
npm run build
```

Expected: tests pass, TypeScript exits zero and Vite emits a production bundle.

- [ ] **Step 5: Commit the B-end selection workflow**

```bash
git add demo/src/pages/AdminAvatarPage.tsx demo/src/components/admin/AdminLive2DPreview.tsx demo/src/lib/live2dPresets.ts demo/src/lib/live2dPresets.test.ts
git commit -m "feat: add selectable live2d avatar presets"
```

### Task 5: Browser verification

**Files:**
- Verify: `demo/src/pages/AdminAvatarPage.tsx`
- Verify: `demo/src/components/Live2DStage.tsx`

- [ ] **Step 1: Start the frontend and analytics services using the existing project commands**

Run: `npm run dev -- --host 0.0.0.0 --port 5176`

Expected: Vite serves the app at `http://localhost:5176`.

- [ ] **Step 2: Verify the B-end workflow**

Open: `http://localhost:5176/admin/avatar`

Expected: default 小灵 is selected when the config has not been changed; the three new cards load previews; selecting an alternate disables costumes but does not disable voice controls; saving shows success.

- [ ] **Step 3: Verify C-end loading and emotion cues**

Open: `http://localhost:5176/`, enter the 小灵 conversation, then send `谢谢你，讲得真好` and `我有点担心会迷路`.

Expected: the saved model loads, mouth opens while speech audio plays, and the existing happy / comfort state labels still appear.

- [ ] **Step 4: Switch back to default and verify regression protection**

Open: `http://localhost:5176/admin/avatar`, choose 默认·小灵 and a non-default costume, save, then refresh C-end.

Expected: the original model and costume load correctly.

- [ ] **Step 5: Confirm the feature leaves no uncommitted production files**

Run:

```bash
git status --short
```

Expected: no uncommitted production files from this feature remain.
