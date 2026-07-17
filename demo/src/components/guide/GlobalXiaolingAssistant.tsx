import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'

import {
  executeGuideAction,
  type GuideAction,
  type GuideMessage,
  useGuideSessionStore
} from '../../guide'
import { resolveGuideAssistantContent } from '../../guide/guideAssistantContent'
import { guideAssistantEvents, type GuideAssistantOpenRequest } from './guideAssistantEvents'
import { XiaolingFloatingCompanion } from './XiaolingFloatingCompanion'
import { XiaolingConversationSurface } from './XiaolingConversationSurface'
import { resolveXiaolingDrawerBackground } from './resolveXiaolingDrawerBackground'
import { captureXiaolingPortrait, useXiaolingPortrait, type XiaolingPresentationMode } from './xiaolingPortrait'
import Live2DStage from '../Live2DStage'
import { useXiaolingRuntime } from '../../guide/runtime/useXiaolingRuntime'
import '../../styles/guide/guideAssistant.css'
import '../../styles/guide/guideDrawer.css'
import '../../styles/guide/digitalHumanStage.css'
import '../../styles/guide/guideCards.css'
import {
  consumeCAppReturnContext,
  readCAppReturnContext,
  resolveCAppReturnTarget,
  saveCAppReturnContext
} from '../../lib/cAppReturnContext'
import { useChatStore } from '../../store/useChatStore'
import { GUIDE_RUNTIME_SCENE_ID } from '../../guide/runtime/guideRuntimeScene'

/** Persistent C-app assistant. Pages only publish UI intents. */
export function GlobalXiaolingAssistant() {
  const location = useLocation()
  const navigate = useNavigate()
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [visualViewport, setVisualViewport] = useState({ height: 0, offsetTop: 0, keyboardOpen: false })
  const [routeAvatarAnchor, setRouteAvatarAnchor] = useState<{ top: number; right: number } | null>(null)
  const [live2dAnchor, setLive2dAnchor] = useState<DOMRectReadOnly | null>(null)
  const [live2dInstanceId, setLive2dInstanceId] = useState('')
  const [companionSuppressed, setCompanionSuppressed] = useState(false)
  const runtime = useXiaolingRuntime()
  const portrait = useXiaolingPortrait()
  const context = useGuideSessionStore((state) => state.context)
  const activeConversationKey = useGuideSessionStore((state) => state.activeConversationKey)
  const open = useGuideSessionStore((state) => state.isDrawerOpen)
  const setDrawerOpen = useGuideSessionStore((state) => state.setDrawerOpen)
  const faySession = useChatStore((state) => state.sessions[GUIDE_RUNTIME_SCENE_ID])
  const setActiveFayScene = useChatStore((state) => state.setActiveScene)
  const sendFayMessage = useChatStore((state) => state.sendMessage)
  const interruptFayReply = useChatStore((state) => state.interruptReply)
  const appendFayMessage = useChatStore((state) => state.appendMessage)
  const messages = useMemo<GuideMessage[]>(() => (faySession?.messages ?? []).map((message) => ({
    id: message.id,
    conversationKey: activeConversationKey,
    role: message.role,
    text: message.content,
    createdAt: Date.parse(message.createdAt) || Date.now(),
    status: message.role === 'system' ? 'error' : 'complete'
  })), [activeConversationKey, faySession?.messages])
  const isMapPage = location.pathname.startsWith('/map-3d-guide-c')
  const isFullscreenPage = location.pathname === '/guide'
  const visualMode = location.pathname.includes('/route/')
    ? 'route'
    : location.pathname.includes('/poi/')
      ? 'poi'
      : 'browse'
  const assistantContent = resolveGuideAssistantContent(context)
  const locationLabel = context.selectedPoiName
    ?? context.currentStopName
    ?? context.nextStopName
    ?? '灵山胜境景区'
  const drawerBackground = useMemo(
    () => resolveXiaolingDrawerBackground(context),
    [
      context.page,
      context.routeId,
      context.stage,
      context.currentStopPoiId,
      context.nextStopPoiId,
      context.selectedPoiId
    ]
  )
  const presentationMode: XiaolingPresentationMode = isFullscreenPage
    ? 'fullscreen'
    : isMapPage && open
      ? 'drawer'
      : 'badge'
  const usesAvatarOnlyBadge = presentationMode === 'badge'
    && isMapPage
    && !companionSuppressed
    && visualMode !== 'browse'

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    const spotId = context.selectedPoiId ?? context.currentStopPoiId
    const spotName = context.selectedPoiName ?? context.currentStopName
    const locationSource = context.selectedPoiId
      ? 'map-selection'
      : context.currentStopPoiId
        ? 'route-progress'
        : 'route-default'
    setActiveFayScene(GUIDE_RUNTIME_SCENE_ID, {
      routeId: context.routeId,
      routeName: context.routeName,
      spotId,
      spotName,
      locationSource,
      locationConfidence: context.location.available ? 1 : locationSource === 'route-default' ? 0.35 : 0.9,
      latitude: context.location.latitude,
      longitude: context.location.longitude,
      currentRouteStopIndex: context.currentStopIndex
    })
  }, [
    context.currentStopIndex,
    context.currentStopName,
    context.currentStopPoiId,
    context.location.available,
    context.location.latitude,
    context.location.longitude,
    context.routeId,
    context.routeName,
    context.selectedPoiId,
    context.selectedPoiName,
    setActiveFayScene
  ])

  useEffect(() => {
    const updateViewport = () => {
      const height = Math.round(window.visualViewport?.height ?? window.innerHeight)
      setVisualViewport({
        height,
        offsetTop: Math.round(window.visualViewport?.offsetTop ?? 0),
        keyboardOpen: height < window.innerHeight - 120
      })
    }
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
    if (!mounted) return undefined
    if (usesAvatarOnlyBadge) {
      setLive2dAnchor(null)
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
      const anchor = document.querySelector<HTMLElement>(`[data-xiaoling-live2d-anchor="${presentationMode}"]`)
      if (anchor !== observedAnchor) {
        resizeObserver?.disconnect()
        observedAnchor = anchor
        if (anchor) resizeObserver?.observe(anchor)
      }
      if (!anchor) {
        setLive2dAnchor(null)
        return
      }
      const rect = anchor.getBoundingClientRect()
      setLive2dAnchor((current) => current
        && Math.round(current.top) === Math.round(rect.top)
        && Math.round(current.left) === Math.round(rect.left)
        && Math.round(current.width) === Math.round(rect.width)
        && Math.round(current.height) === Math.round(rect.height)
        ? current
        : rect)
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
  }, [mounted, presentationMode, usesAvatarOnlyBadge])

  useEffect(() => {
    if (!import.meta.env.DEV || !mounted) return undefined
    const frame = window.requestAnimationFrame(() => {
      const live2dCanvasCount = document.querySelectorAll('canvas.live2d-canvas').length
      const detail = {
        live2dCanvasCount,
        mode: presentationMode,
        portraitReady: portrait.ready
      }
      console.debug('[XiaolingLive2D]', detail)
      if (live2dCanvasCount > 1) console.warn('[XiaolingLive2D] Multiple Live2D canvases detected.', detail)
    })
    return () => window.cancelAnimationFrame(frame)
  }, [mounted, portrait.ready, presentationMode])

  useEffect(() => {
    if (!isMapPage && !isFullscreenPage) setDrawerOpen(false)
  }, [isFullscreenPage, isMapPage, setDrawerOpen])

  useEffect(() => {
    if (!isMapPage) return
    const saved = readCAppReturnContext()
    const currentUrl = `${location.pathname}${location.search}${location.hash}`
    if (!saved?.source.startsWith('map-') || saved.returnTo !== currentUrl) return
    if (saved.reopenDrawer) setDrawerOpen(true)
    consumeCAppReturnContext()
  }, [isMapPage, location.hash, location.pathname, location.search, setDrawerOpen])

  useEffect(() => {
    const handleOpen = (event: Event) => {
      if (!location.pathname.startsWith('/map-3d-guide-c')) return
      const request = (event as CustomEvent<GuideAssistantOpenRequest>).detail
      useGuideSessionStore.getState().setDrawerOpen(true)
      if (request?.autoPrompt) void sendFayMessage(request.autoPrompt, GUIDE_RUNTIME_SCENE_ID)
    }
    const handleClose = () => useGuideSessionStore.getState().setDrawerOpen(false)
    window.addEventListener(guideAssistantEvents.open, handleOpen)
    window.addEventListener(guideAssistantEvents.close, handleClose)
    return () => {
      window.removeEventListener(guideAssistantEvents.open, handleOpen)
      window.removeEventListener(guideAssistantEvents.close, handleClose)
    }
  }, [location.pathname, sendFayMessage])

  useEffect(() => {
    const handleCompanionSuppression = (event: Event) => {
      const detail = (event as CustomEvent<{ suppressed?: boolean }>).detail
      setCompanionSuppressed(Boolean(detail?.suppressed))
    }
    window.addEventListener(guideAssistantEvents.companionSuppression, handleCompanionSuppression)
    return () => window.removeEventListener(guideAssistantEvents.companionSuppression, handleCompanionSuppression)
  }, [])

  const submit = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendFayMessage(text, GUIDE_RUNTIME_SCENE_ID)
  }

  const askSuggestedQuestion = (question: string) => {
    void sendFayMessage(question, GUIDE_RUNTIME_SCENE_ID)
  }

  const runAction = (action: GuideAction) => {
    const result = executeGuideAction(action, {
      navigate,
      presentation: context.presentation,
      context,
      onNavigationRequested: (_targetType, targetId) => {
        appendFayMessage('assistant', `已记录前往“${targetId}”的导航请求，真实导航能力后续接入。`, GUIDE_RUNTIME_SCENE_ID)
      },
      onShowRouteOverview: () => {
        appendFayMessage('assistant', '已为你保留路线总览入口。', GUIDE_RUNTIME_SCENE_ID)
      }
    })
    if (result.ok) setDrawerOpen(false)
    else appendFayMessage('assistant', '这个操作暂时不可用，请稍后再试。', GUIDE_RUNTIME_SCENE_ID)
  }

  const handlePresentationReady = useCallback((detail: {
    canvas: HTMLCanvasElement
    instanceId: string
    mode: XiaolingPresentationMode
  }) => {
    setLive2dInstanceId(detail.instanceId)
    if (detail.mode === 'badge') captureXiaolingPortrait(detail.canvas)
  }, [])

  if (!mounted || typeof document === 'undefined') return null

  const rootStyle = {
    '--guide-vvh': visualViewport.height ? `${visualViewport.height}px` : '100dvh',
    '--guide-vvo-top': `${visualViewport.offsetTop}px`,
    '--guide-drawer-height': visualViewport.height ? `${Math.round(visualViewport.height * 0.85)}px` : '85dvh'
  } as CSSProperties
  const routeAvatarStyle = routeAvatarAnchor
    ? ({
        '--guide-route-avatar-top': `${routeAvatarAnchor.top}px`,
        '--guide-route-avatar-right': `${routeAvatarAnchor.right}px`
      } as CSSProperties)
    : undefined
  const avatarOnlyBadgeStyle = usesAvatarOnlyBadge
    ? visualMode === 'route'
      ? routeAvatarAnchor
        ? ({
            top: `${routeAvatarAnchor.top}px`,
            right: `${routeAvatarAnchor.right}px`,
            bottom: 'auto',
            left: 'auto',
            width: 'clamp(50px, 13vw, 60px)',
            height: 'clamp(50px, 13vw, 60px)'
          } as CSSProperties)
        : undefined
      : ({
          top: 'auto',
          right: 'max(14px, env(safe-area-inset-right, 0px))',
          bottom: 'max(94px, calc(env(safe-area-inset-bottom, 0px) + 86px))',
          left: 'auto',
          width: 'clamp(50px, 13vw, 60px)',
          height: 'clamp(50px, 13vw, 60px)'
        } as CSSProperties)
    : undefined
  const hasLive2dAnchor = Boolean(avatarOnlyBadgeStyle || live2dAnchor)
  const live2dHostStyle = avatarOnlyBadgeStyle
    ? avatarOnlyBadgeStyle
    : live2dAnchor
    ? ({
        top: `${Math.round(live2dAnchor.top - visualViewport.offsetTop)}px`,
        left: `${Math.round(live2dAnchor.left)}px`,
        width: `${Math.round(live2dAnchor.width)}px`,
        height: `${Math.round(live2dAnchor.height)}px`
      } as CSSProperties)
    : undefined
  return createPortal(
    <div
      className="guide-assistant-root"
      style={rootStyle}
      data-guide-mode={visualMode}
      data-guide-keyboard-open={visualViewport.keyboardOpen ? 'true' : 'false'}
      data-xiaoling-live2d-mode={presentationMode}
      data-xiaoling-live2d-instance={live2dInstanceId}
      data-xiaoling-portrait-ready={portrait.ready ? 'true' : 'false'}
    >
      <div
        className={`xiaoling-live2d-host is-${presentationMode}${hasLive2dAnchor ? '' : ' is-unanchored'}`}
        style={live2dHostStyle}
        aria-hidden="true"
      >
        <Live2DStage
          variant="immersive"
          eager
          sceneId={runtime.sceneId}
          robotStateOverride={runtime.robotState}
          mouthOpenOverride={runtime.mouthOpen}
          mouthFormOverride={runtime.mouthForm}
          presentationMode={hasLive2dAnchor ? presentationMode : 'hidden'}
          presentationFraming={presentationMode === 'badge' ? 'full-body' : 'upper-body'}
          onPresentationReady={handlePresentationReady}
        />
      </div>
      {isMapPage && !open && !companionSuppressed ? (
        <XiaolingFloatingCompanion
          mode={visualMode}
          onOpen={() => window.dispatchEvent(new CustomEvent(guideAssistantEvents.open, { detail: { mode: visualMode } }))}
          onRoute={() => runAction({ type: 'open_route_preview', routeId: 'historical_culture' })}
          floatingStyle={visualMode === 'route' ? routeAvatarStyle : undefined}
          routeAnchorReady={visualMode !== 'route' || Boolean(routeAvatarAnchor)}
        />
      ) : null}
      {open || isFullscreenPage ? <XiaolingConversationSurface
        mode={isFullscreenPage ? 'fullscreen' : 'drawer'}
        backgroundMedia={drawerBackground}
        title={assistantContent.title}
        subtitle={assistantContent.subtitle}
        suggestedQuestions={assistantContent.suggestedQuestions}
        messages={messages}
        input={input}
        onClose={() => {
          void interruptFayReply(GUIDE_RUNTIME_SCENE_ID, { notifyBackend: true })
          if (isFullscreenPage) {
            const saved = readCAppReturnContext()
            const target = resolveCAppReturnTarget({
              context: saved,
              queryReturnTo: new URLSearchParams(location.search).get('returnTo'),
              fallback: context.pathname.startsWith('/map-3d-guide-c') ? context.pathname : '/'
            })
            navigate(target)
          } else {
            setDrawerOpen(false)
          }
        }}
        onFullscreen={isMapPage ? () => {
          const returnTo = `${location.pathname}${location.search}${location.hash}`
          saveCAppReturnContext({
            source: context.page === 'route' ? 'map-route' : context.page === 'poi' ? 'map-poi' : 'map-browse',
            returnTo,
            conversationKey: activeConversationKey,
            contextType: context.page,
            routeId: context.routeId,
            poiId: context.selectedPoiId,
            reopenDrawer: true
          })
          navigate(`/guide?returnTo=${encodeURIComponent(returnTo)}`)
        } : undefined}
        onOpenMap={isFullscreenPage ? () => {
          const saved = readCAppReturnContext()
          navigate(saved?.returnTo.startsWith('/map-3d-guide-c') ? saved.returnTo : '/map-3d-guide-c')
        } : undefined}
        locationLabel={locationLabel}
        onInputChange={setInput}
        onSend={submit}
        onSuggestedQuestion={askSuggestedQuestion}
        onInterrupt={() => interruptFayReply(GUIDE_RUNTIME_SCENE_ID, { notifyBackend: true })}
        onAction={runAction}
      /> : null}
    </div>,
    document.body
  )
}
