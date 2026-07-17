# Floating Guide Real Avatar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the floating Xiaoling robot illustration with a real portrait derived from the active Live2D character.

**Architecture:** Keep the existing `FloatingGuide` component and interaction contract. Add one optimized square portrait asset and point the existing image element at it, with CSS-only crop control.

**Tech Stack:** React, TypeScript, CSS, Node test runner, Vite.

---

### Task 1: Lock the avatar contract

**Files:**
- Modify: `demo/src/components/mobileChatUi.test.ts`

- [ ] Add a test asserting that `FloatingGuide.tsx` references `/icons/lingshan-guide-avatar-real.png` and no longer references `/icons/lingshan-guide-avatar.png`.
- [ ] Run `node --test src/components/mobileChatUi.test.ts` and verify the new assertion fails because the old robot path is still present.

### Task 2: Generate and wire the portrait

**Files:**
- Create: `demo/public/icons/lingshan-guide-avatar-real.png`
- Modify: `demo/src/components/FloatingGuide.tsx`
- Modify: `demo/src/styles/global.css`

- [ ] Generate one square head-and-shoulders portrait using the current Live2D character as the identity and style reference.
- [ ] Replace only the floating image source and tune `object-position` for the circular crop.
- [ ] Run the focused test and verify it passes.
- [ ] Run the full frontend test suite and `npm run build`.
- [ ] Verify `/` and `/map-3d-guide-c` in a mobile viewport.
