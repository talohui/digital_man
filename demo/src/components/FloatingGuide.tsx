import { lazy, Suspense, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { CloseOutlined } from '@ant-design/icons'
import { useChatStore } from '../store/useChatStore'
import { getSession } from '../store/chatSessions'
import RouteSkeleton from './RouteSkeleton'
import QuickAsks from './QuickAsks'

const ChatPanel = lazy(() => import('./ChatPanel'))

// 全局悬浮小灵使用一个独立的对话场景:不依赖某个景点/路线,
// 在任意页面呼出都是同一段连续的通用问答,与导览 tab 的景点会话互不串台。
const ASSISTANT_SCENE = 'assistant'

// 这些页面已内置完整的小灵对话(导览 tab、单景点讲解),无需再叠加悬浮入口
function shouldHideOnRoute(pathname: string) {
  return pathname === '/guide' || pathname.startsWith('/spot/')
}

// 全屏地图没有底部 tabbar,悬浮球可贴近底部;其余页面要抬到 tabbar 之上
function isFullbleedRoute(pathname: string) {
  return pathname === '/map' || pathname === '/map-3d-guide'
}

function FloatingGuide() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const setActiveScene = useChatStore((state) => state.setActiveScene)
  const messageCount = useChatStore(
    (state) => getSession(state.sessions, ASSISTANT_SCENE).messages.length
  )

  const hidden = shouldHideOnRoute(location.pathname)
  const fullbleed = isFullbleedRoute(location.pathname)

  // 路由切到内置对话页时自动收起悬浮面板
  useEffect(() => {
    if (hidden) setOpen(false)
  }, [hidden])

  // 打开面板时:切到悬浮场景(让 Fay 用对应 username 路由回包)、锁背景滚动、支持 ESC 关闭
  useEffect(() => {
    if (!open) return
    setActiveScene(ASSISTANT_SCENE)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [open, setActiveScene])

  if (hidden) return null

  return (
    <>
      {open ? null : (
        <button
          type="button"
          className={`floating-guide__fab ${fullbleed ? 'is-fullbleed' : ''}`}
          onClick={() => setOpen(true)}
          aria-label="呼出灵山小灵"
        >
          <span className="floating-guide__fab-pulse" aria-hidden />
          <img src="/icons/lingshan-guide-avatar.png" alt="" className="floating-guide__fab-avatar" />
          <span className="floating-guide__fab-tip">问小灵</span>
        </button>
      )}

      {open ? (
        <div
          className="floating-guide__overlay"
          role="dialog"
          aria-modal="true"
          aria-label="灵山小灵对话"
        >
          <div className="floating-guide__backdrop" onClick={() => setOpen(false)} />
          <div className="floating-guide__sheet">
            <header className="floating-guide__header">
              <div className="floating-guide__id">
                <img
                  src="/icons/lingshan-guide-avatar.png"
                  alt=""
                  className="floating-guide__id-avatar"
                />
                <div className="floating-guide__id-text">
                  <span className="floating-guide__name">灵山小灵</span>
                  <span className="floating-guide__role">AI 数字人导览 · 随时为您解答</span>
                </div>
              </div>
              <button
                type="button"
                className="floating-guide__close"
                onClick={() => setOpen(false)}
                aria-label="收起对话"
              >
                <CloseOutlined />
              </button>
            </header>

            <div className="floating-guide__body">
              {messageCount <= 1 ? (
                <QuickAsks
                  sceneId={ASSISTANT_SCENE}
                  subtitle="猜你想问"
                  title="先从这些问题开始"
                />
              ) : null}
              <Suspense fallback={<RouteSkeleton variant="inline" />}>
                <ChatPanel sceneId={ASSISTANT_SCENE} />
              </Suspense>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

export default FloatingGuide
