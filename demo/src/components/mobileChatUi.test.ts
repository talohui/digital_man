import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const floatingGuideSource = readFileSync(
  new URL('./FloatingGuide.tsx', import.meta.url),
  'utf8'
)
const chatPanelSource = readFileSync(new URL('./ChatPanel.tsx', import.meta.url), 'utf8')
const globalStyles = readFileSync(new URL('../styles/global.css', import.meta.url), 'utf8')
const voiceAsrSource = readFileSync(new URL('../lib/voiceAsr.ts', import.meta.url), 'utf8')
const cloudAsrSource = readFileSync(new URL('../lib/cloudAsr.ts', import.meta.url), 'utf8')
const browserAsrSource = readFileSync(new URL('../lib/browserAsr.ts', import.meta.url), 'utf8')
const voiceEntrySources = [
  './ChatPanel.tsx',
  './guide/GuideVoiceButton.tsx',
  './guide/GuideInputComposer.tsx',
  './map/MapVoiceAssistant.tsx',
  './mobile/ticket/TicketPlannerAssistantSheet.tsx',
  './mobile/route/RoutePlannerAssistantSheet.tsx',
  './mobile/consume/ConsumeXiaolingAssistantSheet.tsx',
  './admin/OperationsCopilotChat.tsx'
].map((path) => ({ path, source: readFileSync(new URL(path, import.meta.url), 'utf8') }))

function rulesFor(selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return Array.from(globalStyles.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, 'g')))
    .map((match) => match[1])
    .join('\n')
}

test('floating guide opens the complete guide route instead of a second chat overlay', () => {
  assert.match(floatingGuideSource, /navigate\(`\/guide\?returnTo=\$\{encodeURIComponent\(returnTo\)\}`\)/)
  assert.match(floatingGuideSource, /saveCAppReturnContext/)
  assert.doesNotMatch(floatingGuideSource, /floating-guide__overlay/)
})

test('floating guide uses the shared Xiaoling avatar instead of a fixed robot illustration', () => {
  assert.match(floatingGuideSource, /<XiaolingAvatar size="floating" \/>/)
  assert.match(floatingGuideSource, /data-xiaoling-live2d-anchor="badge"/)
  assert.doesNotMatch(floatingGuideSource, /\/icons\/lingshan-guide-avatar\.png/)
})

test('floating guide delegates clipping and live portrait rendering to the shared avatar layer', () => {
  assert.match(floatingGuideSource, /className="floating-guide__fab-avatar"/)
  assert.match(floatingGuideSource, /<XiaolingAvatar size="floating" \/>/)
  assert.doesNotMatch(floatingGuideSource, /<img/)
})

test('mobile send button hides only its text label and keeps the icon visible', () => {
  assert.match(chatPanelSource, /className="chat-card__send-label"/)
  assert.match(globalStyles, /\.mobile-shell \.chat-card__send-label[\s\S]*?display:\s*none/)
  assert.doesNotMatch(globalStyles, /\.mobile-shell \.chat-card__send span[\s\S]*?display:\s*none/)
})

test('mobile guide pins the composer above the tab bar', () => {
  const composerRules = rulesFor('.mobile-guide-page .chat-card__composer')
  assert.match(composerRules, /position:\s*fixed/)
  assert.match(composerRules, /bottom:\s*calc\(/)
})

test('mobile messages reserve composer space and allow scroll chaining', () => {
  const messageRules = rulesFor('.mobile-guide-page .chat-card__messages')
  assert.match(messageRules, /padding-bottom:/)
  assert.doesNotMatch(messageRules, /overscroll-behavior:\s*contain/)
})

test('audio unlock never blocks sending a typed message', () => {
  assert.match(chatPanelSource, /void unlockAudio\(\)[\s\S]*?await sendMessage\(/)
  assert.doesNotMatch(chatPanelSource, /await unlockAudio\(\)/)
})

test('mobile voice uses press-to-talk and sends the final transcript once', () => {
  assert.match(chatPanelSource, /onPointerDown=\{handleMicPointerDown\}/)
  assert.match(chatPanelSource, /window\.addEventListener\('pointerup', onRelease, true\)/)
  assert.match(chatPanelSource, /onFinal:[\s\S]*?sendMessage\(trimmed, resolvedSceneId\)/)
})

test('recording status never becomes sendable input', () => {
  assert.match(
    chatPanelSource,
    /onInterim:\s*\(text\)\s*=>\s*\{\s*setVoiceDraft\(text\)\s*\}/
  )
  assert.doesNotMatch(
    chatPanelSource,
    /onInterim:[\s\S]*?setVoiceDraft\(text\)[\s\S]*?setInputText\(text, resolvedSceneId\)/
  )
  assert.match(chatPanelSource, /if \(isRecording \|\| voiceDraft\) return/)
  assert.match(chatPanelSource, /readOnly=\{isRecording\}/)
})

test('visitor-facing voice copy hides the internal Fay implementation name', () => {
  assert.match(voiceAsrSource, /按住说话，松手自动发送/)
  assert.doesNotMatch(voiceAsrSource, /按住说话[^'\n]*Fay/)
  assert.doesNotMatch(cloudAsrSource, /Fay 返回非 JSON|无法连接 Fay|请确认 Fay/)
  assert.doesNotMatch(browserAsrSource, /Fay 云端识别|上传至 Fay/)
})

test('all active chat entry points share one cloud ASR path without duplicate permission probes', () => {
  assert.match(voiceAsrSource, /\?\? 'cloud'/)
  for (const entry of voiceEntrySources) {
    assert.match(entry.source, /createVoiceAsr|GuideVoiceButton/, `${entry.path} 未接入统一语音入口`)
    assert.doesNotMatch(entry.source, /ensureMicPermission/, `${entry.path} 仍在重复申请麦克风权限`)
  }
  assert.match(cloudAsrSource, /startPending/)
  assert.match(cloudAsrSource, /new AbortController\(\)/)
  assert.doesNotMatch(voiceEntrySources.find((entry) => entry.path.includes('GuideInputComposer'))?.source ?? '', /语音输入暂未接入/)
})
