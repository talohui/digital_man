import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import '../styles/c-app/guideV2.css'

type Recommendation =
  | { type: 'route'; id: 'highlights_checkin'; title: string; meta: string; detail: string; image: string }
  | { type: 'poi'; id: 'fan_gong'; title: string; meta: string; detail: string; image: string }

type PrototypeMessage = {
  id: number
  role: 'assistant' | 'user'
  text: string
  recommendation?: Recommendation
}

const QUICK_ASKS = ['第一次来怎么逛？', '想看建筑和拍照', '推荐一条轻松路线']

const INITIAL_MESSAGES: PrototypeMessage[] = [
  {
    id: 1,
    role: 'assistant',
    text: '你好呀，我是小灵。告诉我今天想看什么、能逛多久，我会陪你把路线和景点安排得刚刚好。'
  }
]

const TABS = [
  { label: '导览', icon: '/icons/tab-home.png', path: '/' },
  { label: '地图', icon: '/icons/tab-map.png', path: '/map-3d-guide-c' },
  { label: '小灵', icon: '/icons/lingshan-guide-avatar.png', path: '/guide-v2', active: true },
  { label: '消费', icon: '/icons/tab-shop.png', path: '/consume' },
  { label: '我的', icon: '/icons/tab-me.png', path: '/me' }
] as const

function buildReply(text: string): Omit<PrototypeMessage, 'id'> {
  if (/建筑|拍照|梵宫/.test(text)) {
    return {
      role: 'assistant',
      text: '那我建议把梵宫留作重点。先在广场看建筑轮廓，再进馆抬头看穹顶，光线和工艺细节都很适合慢慢拍。',
      recommendation: {
        type: 'poi',
        id: 'fan_gong',
        title: '灵山梵宫',
        meta: '建筑艺术 · 建议停留 30 分钟',
        detail: '从莲花圣塔到星空穹顶，一站看见传统工艺与现代空间。',
        image: '/intro/splash/splash-01.webp'
      }
    }
  }

  return {
    role: 'assistant',
    text: /轻松/.test(text)
      ? '想走得轻松一点，我会减少折返，把代表性景点串在一条顺路动线上；途中累了也可以随时问我下一站怎么调整。'
      : '第一次来可以先走精华打卡路线，代表性景点比较集中，也方便边走边认识灵山。下面这条路线可以直接接到地图继续看。',
    recommendation: {
      type: 'route',
      id: 'highlights_checkin',
      title: '精华打卡路线',
      meta: '约 2.5 小时 · 7 个景点',
      detail: '九龙灌浴、灵山大佛、梵宫等代表性景点一次串联。',
      image: '/intro/splash/splash-02.webp'
    }
  }
}

function MobileGuidePageV2() {
  const navigate = useNavigate()
  const [messages, setMessages] = useState<PrototypeMessage[]>(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [thinking, setThinking] = useState(false)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const nextIdRef = useRef(2)

  useEffect(() => {
    messageListRef.current?.scrollTo({ top: messageListRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, thinking])

  const send = (rawText: string) => {
    const text = rawText.trim()
    if (!text || thinking) return
    const conversationTurn = nextIdRef.current
    nextIdRef.current += 2
    setMessages((current) => [...current, { id: conversationTurn, role: 'user', text }])
    setInput('')
    setThinking(true)
    window.setTimeout(() => {
      setMessages((current) => [...current, { id: conversationTurn + 1, ...buildReply(text) }])
      setThinking(false)
    }, 420)
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    send(input)
  }

  const openRecommendation = (recommendation: Recommendation) => {
    navigate(
      recommendation.type === 'route'
        ? `/map-3d-guide-c/route/${recommendation.id}`
        : `/map-3d-guide-c/poi/${recommendation.id}?from=browse`
    )
  }

  return (
    <div className="guide-v2-preview c-app-root">
      <div className="guide-v2-device">
        <header className="guide-v2-header">
          <button type="button" className="guide-v2-header__back" onClick={() => navigate('/')} aria-label="返回导览首页">‹</button>
          <div>
            <strong>小灵</strong>
            <span><i /> 灵山智能导游</span>
          </div>
          <button type="button" className="guide-v2-header__map" onClick={() => navigate('/map-3d-guide-c')}>地图</button>
        </header>

        <main className="guide-v2-main">
          <section className="guide-v2-companion" aria-label="小灵陪伴导览">
            <div className="guide-v2-companion__halo" aria-hidden="true" />
            <img src="/icons/lingshan-guide-avatar.png" alt="小灵" />
            <div className="guide-v2-companion__copy">
              <span>一路有我</span>
              <h1>今天想怎么逛？</h1>
              <p>问路线、聊景点，或者让我按你的时间来安排。</p>
            </div>
          </section>

          <section className="guide-v2-conversation" aria-label="与小灵对话">
            <div className="guide-v2-quick-asks" aria-label="推荐提问">
              {QUICK_ASKS.map((question) => (
                <button key={question} type="button" onClick={() => send(question)} disabled={thinking}>{question}</button>
              ))}
            </div>

            <div className="guide-v2-messages" ref={messageListRef} aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className={`guide-v2-message is-${message.role}`}>
                  {message.role === 'assistant' ? (
                    <img className="guide-v2-message__avatar" src="/icons/lingshan-guide-avatar.png" alt="" />
                  ) : null}
                  <div className="guide-v2-message__content">
                    <p>{message.text}</p>
                    {message.recommendation ? (
                      <button
                        type="button"
                        className="guide-v2-recommendation"
                        onClick={() => openRecommendation(message.recommendation!)}
                      >
                        <img src={message.recommendation.image} alt="" />
                        <span className="guide-v2-recommendation__body">
                          <small>{message.recommendation.type === 'route' ? '小灵为你规划' : '景点建议'}</small>
                          <strong>{message.recommendation.title}</strong>
                          <em>{message.recommendation.meta}</em>
                          <span>{message.recommendation.detail}</span>
                          <b>去看看 <i>›</i></b>
                        </span>
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
              {thinking ? (
                <article className="guide-v2-message is-assistant">
                  <img className="guide-v2-message__avatar" src="/icons/lingshan-guide-avatar.png" alt="" />
                  <div className="guide-v2-thinking" aria-label="小灵正在思考"><i /><i /><i /></div>
                </article>
              ) : null}
            </div>
          </section>
        </main>

        <div className="guide-v2-composer-wrap">
          <form className="guide-v2-composer" onSubmit={submit}>
            <button type="button" className="guide-v2-composer__voice" disabled aria-label="语音输入暂未接入">◎</button>
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="问小灵路线、景点或服务"
              aria-label="输入问题"
            />
            <button type="submit" className="guide-v2-composer__send" disabled={!input.trim() || thinking} aria-label="发送">↑</button>
          </form>
          <small>原型会话仅保留在当前页面</small>
        </div>

        <nav className="guide-v2-tabbar" aria-label="C 端主导航">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              type="button"
              className={tab.path === '/guide-v2' ? 'is-active is-xiaoling' : ''}
              onClick={() => navigate(tab.path)}
            >
              <span><img src={tab.icon} alt="" /></span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default MobileGuidePageV2
