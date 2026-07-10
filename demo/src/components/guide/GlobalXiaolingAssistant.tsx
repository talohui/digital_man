import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { getLingshanPoiDetailById } from '../../data/lingshanPoiDetails'
import { getScenicRouteConfig, resolveScenicRouteId } from '../../data/lingshanScenicRoutes'
import { goToRoutePreview } from '../../lib/mapGuideNavigation'
import { parseStopParam } from '../../types/mapGuide'
import type { DigitalHumanStatus } from './DigitalHumanStage'
import { guideAssistantEvents, type GuideAssistantMode } from './guideAssistantEvents'
import type { GuideUiMessage } from './GuideMessageTimeline'
import { XiaolingFloatingCompanion } from './XiaolingFloatingCompanion'
import { XiaolingGuideDrawer } from './XiaolingGuideDrawer'
import '../../styles/guide/guideAssistant.css'
import '../../styles/guide/guideDrawer.css'
import '../../styles/guide/digitalHumanStage.css'
import '../../styles/guide/guideCards.css'

type AssistantContext = {
  mode: GuideAssistantMode
  summary: string
  routeId?: string
  routeName?: string
  poiName?: string
  stopIndex?: number
}

function getContext(pathname: string, searchParams: URLSearchParams): AssistantContext | null {
  if (!pathname.startsWith('/map-3d-guide-c')) return null

  const poiMatch = pathname.match(/\/poi\/([^/]+)/)
  if (poiMatch) {
    const detail = getLingshanPoiDetailById(poiMatch[1])
    return {
      mode: 'poi',
      poiName: detail?.name ?? '当前景点',
      summary: `正在了解 · ${detail?.name ?? '当前景点'}`
    }
  }

  const routeMatch = pathname.match(/\/route\/([^/]+)/)
  if (routeMatch) {
    const route = getScenicRouteConfig(resolveScenicRouteId(routeMatch[1]))
    const stopIndex = parseStopParam(searchParams.get('stop'))
    const stage = searchParams.get('stage')
    const stopName = stopIndex === undefined ? '' : ` · 第 ${stopIndex + 1} 站`
    return {
      mode: 'route',
      routeId: route.id,
      routeName: route.name,
      stopIndex,
      summary: stage === 'arrived' ? `已到达${stopName}` : `${route.name}${stopName}`
    }
  }

  return { mode: 'browse', summary: '灵山胜境自由导览' }
}

function createGreeting(context: AssistantContext): GuideUiMessage {
  if (context.mode === 'poi') {
    return { id: 'welcome-poi', role: 'assistant', text: `我是小灵。关于${context.poiName}的故事、看点和拍照建议，都可以问我。` }
  }
  if (context.mode === 'route') {
    return { id: 'welcome-route', role: 'assistant', text: `我会陪你走${context.routeName}，可以问下一站、路线节奏或游览建议。` }
  }
  return { id: 'welcome-browse', role: 'assistant', text: '我是小灵。想找路线、听景点故事、问服务点，都可以问我。' }
}

function createMockResponse(context: AssistantContext, input: string): GuideUiMessage {
  const wantsEasyPhotoRoute = /两小时|2小时|轻松|拍照/.test(input)
  if (wantsEasyPhotoRoute) {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: '如果时间只有两个小时，建议优先走精华打卡路线，节奏更轻松，也能覆盖主要拍照点。',
      card: {
        type: 'route_cards',
        card: {
          routeId: 'highlights_checkin',
          name: '精华打卡路线',
          duration: '约 2 小时',
          stopCount: getScenicRouteConfig('highlights_checkin').stops.length,
          reason: '主要地标集中，适合轻松拍照与快速体验。',
          tags: ['轻松游览', '拍照打卡']
        }
      }
    }
  }

  if (context.mode === 'poi') {
    return { id: `assistant-${Date.now()}`, role: 'assistant', text: `${context.poiName}适合先看整体空间，再结合图文介绍和现场细节慢慢了解。` }
  }
  if (context.mode === 'route') {
    return {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      text: '我会继续按当前路线为你提示下一站和游览节奏。',
      card: { type: 'route_progress', title: '路线进度', detail: `${context.routeName ?? '当前路线'}${context.stopIndex === undefined ? '正在预览' : ` · 第 ${context.stopIndex + 1} 站`}` }
    }
  }
  return { id: `assistant-${Date.now()}`, role: 'assistant', text: '我可以继续帮你推荐路线、介绍景点，或说明服务入口的使用方式。' }
}

/**
 * Persistent map-only assistant host. Page components only emit open/close
 * requests; this host remains mounted while navigating between map pages.
 */
export function GlobalXiaolingAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [status, setStatus] = useState<DigitalHumanStatus>('idle')
  const context = useMemo(() => getContext(location.pathname, searchParams), [location.pathname, searchParams])
  const [messages, setMessages] = useState<GuideUiMessage[]>([])
  const [visualViewport, setVisualViewport] = useState({ height: 0, offsetTop: 0 })
  const responseTimerRef = useRef<number | null>(null)
  const idleTimerRef = useRef<number | null>(null)

  useEffect(() => setMounted(true), [])

  useEffect(() => () => {
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current)
    if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
  }, [])

  useEffect(() => {
    const updateViewport = () => setVisualViewport({
      height: Math.round(window.visualViewport?.height ?? window.innerHeight),
      offsetTop: Math.round(window.visualViewport?.offsetTop ?? 0)
    })
    updateViewport()
    window.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('resize', updateViewport)
    window.visualViewport?.addEventListener('scroll', updateViewport)
    return () => {
      window.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('resize', updateViewport)
      window.visualViewport?.removeEventListener('scroll', updateViewport)
    }
  }, [])

  useEffect(() => {
    if (!context) {
      setOpen(false)
      return
    }
    if (!messages.length) setMessages([createGreeting(context)])
  }, [context, messages.length])

  useEffect(() => {
    const handleOpen = (event: Event) => {
      const request = (event as CustomEvent<{ mode?: GuideAssistantMode; autoPrompt?: string; autoResponse?: string }>).detail
      if (!context) return
      const autoPrompt = request?.autoPrompt
      setOpen(true)
      setStatus(autoPrompt ? 'speaking' : 'idle')
      if (autoPrompt) {
        setMessages((current) => [
          ...current,
          { id: `user-${Date.now()}`, role: 'user', text: autoPrompt },
          { id: `assistant-${Date.now() + 1}`, role: 'assistant', text: request.autoResponse ?? '我来为你补充这一站的导览重点。' }
        ])
      }
    }
    const handleClose = () => setOpen(false)
    window.addEventListener(guideAssistantEvents.open, handleOpen)
    window.addEventListener(guideAssistantEvents.close, handleClose)
    return () => {
      window.removeEventListener(guideAssistantEvents.open, handleOpen)
      window.removeEventListener(guideAssistantEvents.close, handleClose)
    }
  }, [context])

  const submit = () => {
    const text = input.trim()
    if (!text || !context) return
    setStatus('thinking')
    setMessages((current) => [...current, { id: `user-${Date.now()}`, role: 'user', text }])
    setInput('')
    if (responseTimerRef.current !== null) window.clearTimeout(responseTimerRef.current)
    responseTimerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, createMockResponse(context, text)])
      setStatus('speaking')
      if (idleTimerRef.current !== null) window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(() => setStatus('idle'), 700)
    }, 240)
  }

  const handleOpenRoute = (routeId: string) => {
    setOpen(false)
    goToRoutePreview(navigate, routeId)
  }

  if (!mounted || !context || typeof document === 'undefined') return null

  const rootStyle = {
    '--guide-vvh': visualViewport.height ? `${visualViewport.height}px` : '100dvh',
    '--guide-vvo-top': `${visualViewport.offsetTop}px`
  } as CSSProperties

  return createPortal(
    <div className="guide-assistant-root" style={rootStyle} data-guide-mode={context.mode}>
      {!open ? (
        <XiaolingFloatingCompanion
          mode={context.mode}
          onOpen={() => window.dispatchEvent(new CustomEvent(guideAssistantEvents.open, { detail: { mode: context.mode } }))}
          onRoute={() => goToRoutePreview(navigate, 'historical_culture')}
        />
      ) : null}
      <XiaolingGuideDrawer
        open={open}
        mode={context.mode}
        summary={context.summary}
        messages={messages}
        input={input}
        status={status}
        onClose={() => setOpen(false)}
        onInputChange={setInput}
        onSend={submit}
        onOpenRoute={handleOpenRoute}
      />
    </div>,
    document.body
  )
}
