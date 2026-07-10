import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  executeGuideAction,
  type GuideAction,
  type GuideContext,
  useGuideSessionStore
} from '../../guide'
import { guideAssistantEvents, type GuideAssistantOpenRequest } from './guideAssistantEvents'
import { XiaolingFloatingCompanion } from './XiaolingFloatingCompanion'
import { XiaolingGuideDrawer } from './XiaolingGuideDrawer'
import '../../styles/guide/guideAssistant.css'
import '../../styles/guide/guideDrawer.css'
import '../../styles/guide/digitalHumanStage.css'
import '../../styles/guide/guideCards.css'

function getContextSummary(context: GuideContext) {
  if (context.page === 'poi') return `正在了解 · ${context.selectedPoiName ?? '当前景点'}`
  if (context.page === 'route') {
    const stopText = context.currentStopIndex === undefined ? '' : ` · 第 ${context.currentStopIndex + 1} 站`
    return context.stage === 'arrived'
      ? `已到达${stopText}${context.currentStopName ? ` · ${context.currentStopName}` : ''}`
      : `${context.routeName ?? '路线游览'}${stopText}`
  }
  return '灵山胜境自由导览'
}

function getGreeting(context: GuideContext) {
  if (context.page === 'poi') {
    return `我是小灵。关于${context.selectedPoiName ?? '当前景点'}的故事、看点和拍照建议，都可以问我。`
  }
  if (context.page === 'route') {
    return `我会陪你走${context.routeName ?? '当前路线'}，可以问下一站、路线节奏或游览建议。`
  }
  return '我是小灵。想找路线、听景点故事、问服务点，都可以问我。'
}

/** Persistent map-only assistant. Pages only publish UI intents. */
export function GlobalXiaolingAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [visualViewport, setVisualViewport] = useState({ height: 0, offsetTop: 0 })
  const context = useGuideSessionStore((state) => state.context)
  const messages = useGuideSessionStore((state) => state.messages)
  const status = useGuideSessionStore((state) => state.status)
  const open = useGuideSessionStore((state) => state.isDrawerOpen)
  const setDrawerOpen = useGuideSessionStore((state) => state.setDrawerOpen)
  const sendGuideMessage = useGuideSessionStore((state) => state.sendGuideMessage)
  const addMessage = useGuideSessionStore((state) => state.addMessage)
  const isMapPage = location.pathname.startsWith('/map-3d-guide-c')

  useEffect(() => setMounted(true), [])

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
    if (!isMapPage) setDrawerOpen(false)
  }, [isMapPage, setDrawerOpen])

  useEffect(() => {
    const handleOpen = (event: Event) => {
      if (!location.pathname.startsWith('/map-3d-guide-c')) return
      const request = (event as CustomEvent<GuideAssistantOpenRequest>).detail
      const state = useGuideSessionStore.getState()
      if (!state.messages.length) {
        state.addMessage({ role: 'assistant', text: getGreeting(state.context), status: 'complete' })
      }
      state.setDrawerOpen(true)
      if (request?.autoPrompt) void state.sendGuideMessage(request.autoPrompt)
    }
    const handleClose = () => useGuideSessionStore.getState().setDrawerOpen(false)
    window.addEventListener(guideAssistantEvents.open, handleOpen)
    window.addEventListener(guideAssistantEvents.close, handleClose)
    return () => {
      window.removeEventListener(guideAssistantEvents.open, handleOpen)
      window.removeEventListener(guideAssistantEvents.close, handleClose)
    }
  }, [location.pathname])

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendGuideMessage(text)
  }

  const runAction = (action: GuideAction) => {
    const result = executeGuideAction(action, {
      navigate,
      presentation: context.presentation,
      context,
      onNavigationRequested: (_targetType, targetId) => {
        addMessage({ role: 'assistant', text: `已记录前往“${targetId}”的导航请求，真实导航能力后续接入。`, status: 'complete' })
      },
      onShowRouteOverview: () => {
        addMessage({ role: 'assistant', text: '已为你保留路线总览入口。', status: 'complete' })
      }
    })
    if (result.ok) setDrawerOpen(false)
    else addMessage({ role: 'assistant', text: '这个操作暂时不可用，请稍后再试。', status: 'complete' })
  }

  if (!mounted || !isMapPage || typeof document === 'undefined') return null

  const rootStyle = {
    '--guide-vvh': visualViewport.height ? `${visualViewport.height}px` : '100dvh',
    '--guide-vvo-top': `${visualViewport.offsetTop}px`
  } as CSSProperties
  const digitalStatus = status === 'error' ? 'offline' : status

  return createPortal(
    <div className="guide-assistant-root" style={rootStyle} data-guide-mode={context.page}>
      {!open ? (
        <XiaolingFloatingCompanion
          mode={context.page}
          onOpen={() => window.dispatchEvent(new CustomEvent(guideAssistantEvents.open, { detail: { mode: context.page } }))}
          onRoute={() => runAction({ type: 'open_route_preview', routeId: 'historical_culture' })}
        />
      ) : null}
      <XiaolingGuideDrawer
        open={open}
        mode={context.page}
        summary={getContextSummary(context)}
        messages={messages}
        input={input}
        status={digitalStatus}
        onClose={() => setDrawerOpen(false)}
        onInputChange={setInput}
        onSend={submit}
        onAction={runAction}
      />
    </div>,
    document.body
  )
}
