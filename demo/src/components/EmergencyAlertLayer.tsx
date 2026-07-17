import { AlertOutlined, CloseOutlined, SoundOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { eventVersion, presentationFor, shouldAnnounce } from '../lib/emergencyPresentation'
import { useActiveEmergencies } from '../hooks/useActiveEmergencies'
import { sendExactSpeechToFay } from '../api/fay'
import { getFayUsername } from '../lib/fayIdentity'
import { useChatStore } from '../store/useChatStore'

const ANNOUNCED_KEY = 'lingshan-emergency-announced'

function readVersions() {
  try { return new Set<string>(JSON.parse(localStorage.getItem(ANNOUNCED_KEY) ?? '[]')) }
  catch { return new Set<string>() }
}

function persistVersions(versions: Set<string>) {
  try { localStorage.setItem(ANNOUNCED_KEY, JSON.stringify([...versions].slice(-50))) }
  catch { /* storage may be unavailable */ }
}

function speakWithBrowserFallback(text: string) {
  if (!('speechSynthesis' in window) || !text.trim()) return
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'zh-CN'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

async function speakExact(text: string) {
  if (!text.trim()) return
  const sceneId = useChatStore.getState().activeSceneId
  try {
    await sendExactSpeechToFay(text, getFayUsername(sceneId))
  } catch {
    speakWithBrowserFallback(text)
  }
}

export default function EmergencyAlertLayer() {
  const { events, stale } = useActiveEmergencies()
  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set())
  const ordered = useMemo(() => [...events].sort((a, b) => {
    const rank = { CRITICAL: 0, WARNING: 1, INFO: 2 }
    return rank[a.severity] - rank[b.severity]
  }), [events])
  const current = ordered.find(event => !dismissed.has(eventVersion(event)))

  useEffect(() => {
    const announced = readVersions()
    let changed = false
    for (const event of ordered) {
      if (!shouldAnnounce(event, announced)) continue
      announced.add(eventVersion(event))
      void speakExact(event.message)
      changed = true
    }
    if (changed) persistVersions(announced)
  }, [ordered])

  if (!current) return null
  const version = eventVersion(current)
  const presentation = presentationFor(current)
  const dismiss = () => setDismissed(previous => new Set(previous).add(version))

  if (presentation.mode === 'modal') {
    return (
      <div className="emergency-alert-modal" role="alertdialog" aria-modal="true" aria-labelledby="emergency-alert-title">
        <div className="emergency-alert-modal__card">
          <span className="emergency-alert-modal__icon"><AlertOutlined /></span>
          <span className="emergency-alert-modal__eyebrow">景区紧急通知</span>
          <h2 id="emergency-alert-title">{current.title}</h2>
          <p>{current.message}</p>
          <div className="emergency-alert-modal__meta"><SoundOutlined /> 已交由 Fay 数字人按管理员确认原文播报{stale ? ' · 离线缓存，信息可能延迟' : ''}</div>
          <button type="button" onClick={dismiss}>我已知晓</button>
        </div>
      </div>
    )
  }

  return (
    <aside className="emergency-alert-banner" role="status">
      <AlertOutlined />
      <div><strong>{current.title}</strong><span>{current.message}</span>{stale ? <small>离线缓存，信息可能延迟</small> : null}</div>
      <button type="button" onClick={dismiss} aria-label="关闭提醒"><CloseOutlined /></button>
    </aside>
  )
}
