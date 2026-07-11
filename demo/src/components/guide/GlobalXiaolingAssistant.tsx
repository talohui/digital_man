import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  executeGuideAction,
  type GuideAction,
  useGuideSessionStore
} from '../../guide'
import { resolveGuideAssistantContent } from '../../guide/guideAssistantContent'
import { guideAssistantEvents, type GuideAssistantOpenRequest } from './guideAssistantEvents'
import { XiaolingFloatingCompanion } from './XiaolingFloatingCompanion'
import { XiaolingGuideDrawer } from './XiaolingGuideDrawer'
import '../../styles/guide/guideAssistant.css'
import '../../styles/guide/guideDrawer.css'
import '../../styles/guide/digitalHumanStage.css'
import '../../styles/guide/guideCards.css'

/** Persistent map-only assistant. Pages only publish UI intents. */
export function GlobalXiaolingAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [visualViewport, setVisualViewport] = useState({ height: 0, offsetTop: 0 })
  const [routeAvatarAnchor, setRouteAvatarAnchor] = useState<{ top: number; right: number } | null>(null)
  const context = useGuideSessionStore((state) => state.context)
  const messages = useGuideSessionStore((state) => state.messages)
  const status = useGuideSessionStore((state) => state.status)
  const open = useGuideSessionStore((state) => state.isDrawerOpen)
  const setDrawerOpen = useGuideSessionStore((state) => state.setDrawerOpen)
  const sendGuideMessage = useGuideSessionStore((state) => state.sendGuideMessage)
  const addMessage = useGuideSessionStore((state) => state.addMessage)
  const isMapPage = location.pathname.startsWith('/map-3d-guide-c')
  const visualMode = location.pathname.includes('/route/')
    ? 'route'
    : location.pathname.includes('/poi/')
      ? 'poi'
      : 'browse'
  const assistantContent = resolveGuideAssistantContent(context)

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
    if (!mounted || visualMode !== 'route') {
      setRouteAvatarAnchor(null)
      return undefined
    }

    let frameId = 0
    let observedAnchor: HTMLElement | null = null
    const resizeObserver = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(scheduleUpdate)

    function scheduleUpdate() {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(updateAnchor)
    }

    function updateAnchor() {
      const anchor = document.querySelector<HTMLElement>('[data-guide-assistant-anchor="route"]')
      if (anchor !== observedAnchor) {
        resizeObserver?.disconnect()
        observedAnchor = anchor
        if (anchor) resizeObserver?.observe(anchor)
      }

      if (!anchor) {
        setRouteAvatarAnchor(null)
        return
      }

      const rect = anchor.getBoundingClientRect()
      const viewportOffsetTop = window.visualViewport?.offsetTop ?? 0
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight
      if (rect.height <= 0 || rect.width <= 0 || rect.bottom < 0 || rect.top > viewportHeight) {
        setRouteAvatarAnchor(null)
        return
      }

      const top = Math.round(rect.bottom - viewportOffsetTop + 12)
      const right = Math.max(14, Math.round(window.innerWidth - rect.right))
      setRouteAvatarAnchor((current) => current?.top === top && current.right === right ? current : { top, right })
    }

    const mutationObserver = new MutationObserver(scheduleUpdate)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('resize', scheduleUpdate)
    window.visualViewport?.addEventListener('scroll', scheduleUpdate)
    scheduleUpdate()

    return () => {
      window.cancelAnimationFrame(frameId)
      mutationObserver.disconnect()
      resizeObserver?.disconnect()
      window.removeEventListener('resize', scheduleUpdate)
      window.visualViewport?.removeEventListener('resize', scheduleUpdate)
      window.visualViewport?.removeEventListener('scroll', scheduleUpdate)
    }
  }, [mounted, visualMode])

  useEffect(() => {
    if (!isMapPage) setDrawerOpen(false)
  }, [isMapPage, setDrawerOpen])

  useEffect(() => {
    const handleOpen = (event: Event) => {
      if (!location.pathname.startsWith('/map-3d-guide-c')) return
      const request = (event as CustomEvent<GuideAssistantOpenRequest>).detail
      const state = useGuideSessionStore.getState()
      if (!state.messages.length) {
        state.addMessage({
          role: 'assistant',
          text: resolveGuideAssistantContent(state.context).greeting,
          status: 'complete'
        })
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

  const askSuggestedQuestion = (question: string) => {
    void sendGuideMessage(question)
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
  const routeAvatarStyle = routeAvatarAnchor
    ? ({
        '--guide-route-avatar-top': `${routeAvatarAnchor.top}px`,
        '--guide-route-avatar-right': `${routeAvatarAnchor.right}px`
      } as CSSProperties)
    : undefined
  const digitalStatus = status === 'error' ? 'offline' : status

  return createPortal(
    <div className="guide-assistant-root" style={rootStyle} data-guide-mode={visualMode}>
      {!open ? (
        <XiaolingFloatingCompanion
          mode={visualMode}
          onOpen={() => window.dispatchEvent(new CustomEvent(guideAssistantEvents.open, { detail: { mode: visualMode } }))}
          onRoute={() => runAction({ type: 'open_route_preview', routeId: 'historical_culture' })}
          floatingStyle={visualMode === 'route' ? routeAvatarStyle : undefined}
          routeAnchorReady={visualMode !== 'route' || Boolean(routeAvatarAnchor)}
        />
      ) : null}
      <XiaolingGuideDrawer
        open={open}
        mode={context.page}
        title={assistantContent.title}
        summary={assistantContent.subtitle}
        suggestedQuestions={assistantContent.suggestedQuestions}
        messages={messages}
        input={input}
        status={digitalStatus}
        onClose={() => setDrawerOpen(false)}
        onInputChange={setInput}
        onSend={submit}
        onSuggestedQuestion={askSuggestedQuestion}
        onAction={runAction}
      />
    </div>,
    document.body
  )
}
