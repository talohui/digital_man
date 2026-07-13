# 沉浸式 Live2D 导览页实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 `/guide` 变为全屏 Live2D 主视觉导览页，同时保留可随时切换的经典页面。

**Architecture:** 当前 `HomePage` 保持原文件与功能不变，作为经典页；新增 `GuideImmersivePage` 复用现有 `Live2DStage`、`ChatPanel`、`QuickAsks` 和默认会话。`App.tsx` 让 `/guide` 指向新页、`/guide/classic` 指向既有 `HomePage`。

**Tech Stack:** React 18、TypeScript、React Router、Ant Design、Pixi Live2D、现有全局 CSS。

---

### Task 1: 保存经典布局并锁定路由回退

**Files:**
- Modify: `demo/src/App.tsx`
- Test: `demo/src/pages/guideRoutes.test.ts`

- [ ] **Step 1: 编写失败测试**

```ts
import { readFileSync } from 'node:fs'
import { test, strict as assert } from 'node:test'

const app = readFileSync(new URL('../App.tsx', import.meta.url), 'utf8')

test('keeps a classic guide route while making immersive guide the default', () => {
  assert.match(app, /path="\/guide"\s+element=\{<GuideImmersivePage\/>\}/)
  assert.match(app, /path="\/guide\/classic"\s+element=\{<HomePage\/>\}/)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test src/pages/guideRoutes.test.ts`

Expected: `/guide` 仍指向 `HomePage`，测试失败。

- [ ] **Step 3: 最小实现**

保留当前 `HomePage.tsx` 原样不动。随后在 `App.tsx` 增加：

```tsx
<Route path="/guide" element={<GuideImmersivePage />} />
<Route path="/guide/classic" element={<HomePage />} />
```

- [ ] **Step 4: 验证测试转绿**

Run: `node --test src/pages/guideRoutes.test.ts`

Expected: PASS。

### Task 2: 构建沉浸式 Live2D 场景

**Files:**
- Create: `demo/src/pages/GuideImmersivePage.tsx`
- Modify: `demo/src/styles/global.css`
- Test: `demo/src/pages/GuideImmersivePage.test.ts`

- [ ] **Step 1: 编写失败测试**

```ts
import { readFileSync } from 'node:fs'
import { test, strict as assert } from 'node:test'

const page = readFileSync(new URL('./GuideImmersivePage.tsx', import.meta.url), 'utf8')

test('uses the existing Live2D and ChatPanel in the immersive guide', () => {
  assert.match(page, /<Live2DStage[^>]*variant="immersive"/)
  assert.match(page, /<ChatPanel sceneId=\{DEFAULT_SCENE_ID\}/)
  assert.match(page, /navigate\('\/guide\/classic'\)/)
})
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test src/pages/GuideImmersivePage.test.ts`

Expected: 因沉浸页文件不存在而失败。

- [ ] **Step 3: 最小实现**

新增页面结构：

```tsx
<main className="immersive-guide">
  <header className="immersive-guide__topbar">...</header>
  <div className="immersive-guide__avatar"><Live2DStage variant="immersive" eager sceneId={DEFAULT_SCENE_ID} /></div>
  <aside className="immersive-guide__reply">...</aside>
  <footer className="immersive-guide__controls">...</footer>
  <Drawer open={chatOpen}><ChatPanel sceneId={DEFAULT_SCENE_ID} /></Drawer>
</main>
```

语音主按钮触发 `setInputText` 后聚焦聊天抽屉，不伪造浏览器语音权限；QuickAsks 放在抽屉内，路线入口跳转现有 `/map`。

- [ ] **Step 4: 添加视觉 CSS**

在 `global.css` 添加 `immersive-guide` 作用域样式：天空色渐变、半透明山影光晕、占据中轴的大尺寸 Live2D、前景深色聊天气泡、圆形语音按钮与安全区域内的底部控制。添加 `max-width: 768px` 和桌面断点，确保人物、气泡和按钮不相互遮挡。

- [ ] **Step 5: 验证组件测试转绿**

Run: `node --test src/pages/GuideImmersivePage.test.ts`

Expected: PASS。

### Task 3: 扩展 Live2D 呈现模式并回归验证

**Files:**
- Modify: `demo/src/components/Live2DStage.tsx`
- Modify: `demo/src/styles/global.css`
- Test: `demo/src/components/Live2DStage.test.ts`

- [ ] **Step 1: 写失败测试**

```ts
test('declares the immersive Live2D variant', () => {
  assert.match(source, /variant\?: 'default' \| 'embedded' \| 'immersive'/)
  assert.match(source, /const isImmersive = variant === 'immersive'/)
})
```

- [ ] **Step 2: 运行确认失败**

Run: `node --test src/components/Live2DStage.test.ts`

Expected: 现有类型缺少 `immersive` 而失败。

- [ ] **Step 3: 最小实现**

为 `Live2DStage` 新增 `immersive` variant；保持模型加载和口型状态逻辑不变，仅隐藏统计卡并将模型拟合系数提高到适合全屏人物的值。CSS 仅作用于 `.live2d-stage--immersive`。

- [ ] **Step 4: 全量前端验证**

Run: `node --test src/pages/guideRoutes.test.ts src/pages/GuideImmersivePage.test.ts src/components/Live2DStage.test.ts && npx tsc --noEmit --incremental false -p tsconfig.json && git diff --check`

Expected: 所有测试 PASS、TypeScript 无错误、差异检查无输出。

- [ ] **Step 5: 浏览器验收**

打开 `/guide`，确认 Live2D 为首屏主角、聊天抽屉和路线入口可用；打开 `/guide/classic`，确认原有偏好与路线页可用。
