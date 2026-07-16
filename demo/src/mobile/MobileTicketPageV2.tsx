import { AudioOutlined, CalendarOutlined, TeamOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MarketTitle } from '../components/mobile/consume'
import CAppBottomNav from '../components/mobile/navigation/CAppBottomNav'
import CAppBottomSheet from '../components/mobile/overlays/CAppBottomSheet'
import EntrancePassScroll from '../components/mobile/ticket/EntrancePassScroll'
import { captureTicketPurchase } from '../lib/analytics'
import { createAsr, type BrowserAsr, voiceEnvironmentHint } from '../lib/browserAsr'
import { useTicketStore, type TicketProfile, type TicketType } from '../store/useTicketStore'
import PaymentSheet from './PaymentSheet'
import '../styles/c-app/ticketV2.css'

type CeremonyPhase = 'arrival' | 'welcome' | 'profile' | 'ticket'
type TicketCatalogId = 'adult' | 'concession' | 'free' | 'online_bundle' | 'shuttle'
type TicketQuantities = Record<TicketCatalogId, number>

type TravelPartyType = 'solo' | 'partner' | 'family_with_children' | 'family_with_elder' | 'friends'
type TravelPace = 'slow' | 'balanced' | 'in_depth'

const TRAVEL_PARTY_OPTIONS: { id: TravelPartyType; label: string }[] = [
  { id: 'solo', label: '独自前往' },
  { id: 'partner', label: '与伴侣同行' },
  { id: 'family_with_children', label: '亲子同行' },
  { id: 'family_with_elder', label: '陪长辈出行' },
  { id: 'friends', label: '与朋友同游' }
]
const TRAVEL_PACE_OPTIONS: { id: TravelPace; label: string }[] = [
  { id: 'slow', label: '舒缓慢游' },
  { id: 'balanced', label: '均衡游览' },
  { id: 'in_depth', label: '深度体验' }
]
const INTEREST_OPTIONS = [
  { id: 'buddhist_culture', label: '佛文化' },
  { id: 'nature_scenery', label: '自然风光' },
  { id: 'photography', label: '拍照打卡' },
  { id: 'leisure_walk', label: '休闲漫游' }
]
const TICKET_REQUEST_PRESETS = ['带孩子，想轻松游览', '想重点看梵宫与佛文化', '礼佛祈福，节奏慢一些']

const TICKET_CATALOG: Array<{
  id: TicketCatalogId
  label: string
  price: number
  eligibility: string
  description: string
  kind: 'entry' | 'add_on'
}> = [
  { id: 'adult', label: '成人票', price: 210, eligibility: '18 周岁以上成年人', description: '灵山胜境入园门票', kind: 'entry' },
  { id: 'concession', label: '半价票', price: 105, eligibility: '6–18 周岁、全日制本科及以下学生、60–69 周岁老人', description: '入园时需按规则核验资格', kind: 'entry' },
  { id: 'free', label: '免费票', price: 0, eligibility: '6 周岁以下或 1.4 米以下儿童、70 周岁以上、现役军人、残疾人', description: '入园时需按规则核验资格', kind: 'entry' },
  { id: 'online_bundle', label: '网购联票', price: 225, eligibility: '门票 + 观光车', description: '含景区观光车，可不限次乘坐', kind: 'entry' },
  { id: 'shuttle', label: '观光车单独购票', price: 40, eligibility: '景区内交通', description: '适合少走路、轻松游览', kind: 'add_on' }
]

const EMPTY_TICKET_QUANTITIES: TicketQuantities = { adult: 2, concession: 0, free: 0, online_bundle: 0, shuttle: 0 }
const TICKET_QUANTITY_LABELS = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']

type MobileTicketPageV2Props = {
  /** 同一套入境仪式实现：preview 用于 /ticket-v2，formal 接入正式 /ticket 与本地票务状态。 */
  mode?: 'preview' | 'formal'
}

function getToday() {
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

function dateLabel(value: string) {
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date)
}

function ticketQuantityLabel(value: number) {
  return TICKET_QUANTITY_LABELS[value] ?? String(value)
}

function getInitialTicketQuantities(ticket?: TicketProfile | null): TicketQuantities {
  if (!ticket) return EMPTY_TICKET_QUANTITIES
  const restored = { adult: 0, concession: 0, free: 0, online_bundle: 0, shuttle: 0 } satisfies TicketQuantities
  if (ticket.ticketSelections?.length) {
    ticket.ticketSelections.forEach((selection) => {
      if (selection.ticketSku in restored) {
        restored[selection.ticketSku as TicketCatalogId] = Math.max(0, Math.min(9, selection.quantity))
      }
    })
    return restored
  }
  restored.adult = Math.max(1, Math.min(9, ticket.groupSize))
  return restored
}

function resolveTicketTypeProjection({
  partyType,
  travelPace,
  interests
}: {
  partyType: TravelPartyType | null
  travelPace: TravelPace | null
  interests: string[]
}): TicketType {
  if (partyType === 'family_with_children') return 'family'
  if (interests.includes('buddhist_culture')) return 'culture'
  if (travelPace === 'slow' || interests.includes('leisure_walk')) return 'leisure'
  return 'standard'
}

function resolveTicketRecommendation({
  partyType,
  travelPace,
  interests,
  request
}: {
  partyType: TravelPartyType | null
  travelPace: TravelPace | null
  interests: string[]
  request: string
}): { suggestShuttle: boolean; reply: string } {
  const message = request.replace(/\s/g, '')
  const suggestShuttle = /长辈|老人|轻松|慢|休闲|少走|不赶/.test(message)
    || partyType === 'family_with_elder'
    || travelPace === 'slow'
    || interests.includes('leisure_walk')
  if (/孩子|亲子/.test(message) || partyType === 'family_with_children') return { suggestShuttle, reply: '同行中如有儿童，请分别选择成人票、半价票或免费票，并在入园时按规则核验资格。' }
  if (/祈福|礼佛|静心/.test(message)) return { suggestShuttle, reply: '我会把礼佛与静心路线留给后续导览；门票仍请按每位同行人的实际资格选择。' }
  if (/梵宫|佛|文化|建筑/.test(message) || interests.includes('buddhist_culture')) return { suggestShuttle, reply: '我会在入园后优先安排梵宫与佛文化讲解；当前票笺请按每位游客的资格分别选择。' }
  return { suggestShuttle, reply: '请按每位同行人的实际资格选择票笺；需要减少步行时，可将观光车加入清单。' }
}

function MobileTicketPageV2({ mode = 'preview' }: MobileTicketPageV2Props) {
  const navigate = useNavigate()
  const isFormal = mode === 'formal'
  const currentTicket = useTicketStore((state) => state.ticketProfile)
  const submitTicket = useTicketStore((state) => state.submitTicket)
  const [phase, setPhase] = useState<CeremonyPhase>('arrival')
  const [isEntranceOpening, setIsEntranceOpening] = useState(false)
  const [ticketQuantities, setTicketQuantities] = useState<TicketQuantities>(() => getInitialTicketQuantities(isFormal ? currentTicket : null))
  const [lastAdjustedTicket, setLastAdjustedTicket] = useState<TicketCatalogId | null>(null)
  const [visitDate, setVisitDate] = useState(() => isFormal && currentTicket ? currentTicket.visitDate : getToday())
  const [partyType, setPartyType] = useState<TravelPartyType | null>(() => isFormal ? currentTicket?.travelProfile?.partyType ?? null : null)
  const [travelPace, setTravelPace] = useState<TravelPace | null>(() => isFormal ? currentTicket?.travelProfile?.travelPace ?? null : null)
  const [interests, setInterests] = useState<string[]>(() => isFormal ? currentTicket?.travelProfile?.interestIds ?? [] : [])
  const [smartMode, setSmartMode] = useState(false)
  const [showXiaolingTicketPanel, setShowXiaolingTicketPanel] = useState(false)
  const [ticketRequest, setTicketRequest] = useState('')
  const [lastTicketRequest, setLastTicketRequest] = useState('')
  const [isVoiceListening, setIsVoiceListening] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const [showPayment, setShowPayment] = useState(false)
  const [isPreparingPass, setIsPreparingPass] = useState(false)
  const [isIssued, setIsIssued] = useState(() => isFormal && Boolean(currentTicket))
  const [demoBarcode] = useState(() => Array.from({ length: 34 }, () => 1 + Math.floor(Math.random() * 3)))
  const ticketVoiceRef = useRef<BrowserAsr | null>(null)

  const ticketLines = useMemo(
    () => TICKET_CATALOG.filter((ticket) => ticketQuantities[ticket.id] > 0).map((ticket) => ({ ...ticket, quantity: ticketQuantities[ticket.id] })),
    [ticketQuantities]
  )
  const entryTicketCount = ticketLines.filter((ticket) => ticket.kind === 'entry').reduce((sum, ticket) => sum + ticket.quantity, 0)
  const total = ticketLines.reduce((sum, ticket) => sum + ticket.price * ticket.quantity, 0)
  const issuedTotal = isFormal && currentTicket ? currentTicket.ticketCost : total
  const recommendation = useMemo(
    () => resolveTicketRecommendation({ partyType, travelPace, interests, request: lastTicketRequest }),
    [interests, lastTicketRequest, partyType, travelPace]
  )
  const partyLabel = TRAVEL_PARTY_OPTIONS.find((item) => item.id === partyType)?.label
  const paceLabel = TRAVEL_PACE_OPTIONS.find((item) => item.id === travelPace)?.label
  const interestLabels = INTEREST_OPTIONS.filter((item) => interests.includes(item.id)).map((item) => item.label)
  const profileComplete = Boolean(partyType && travelPace && interests.length)

  const completeTicketPayment = () => {
    if (isFormal) {
      const ticket = submitTicket({
        ageBand: '25-34',
        gender: '不便透露',
        groupSize: entryTicketCount,
        visitDate,
        ticketType: resolveTicketTypeProjection({ partyType, travelPace, interests }),
        ticketCost: total,
        ticketSelections: ticketLines.map((item) => ({
          ticketSku: item.id,
          name: item.label,
          quantity: item.quantity,
          unitPrice: item.price,
          kind: item.kind === 'entry' ? 'entry' : 'transport_add_on'
        })),
        travelProfile: {
          partyType: partyType ?? undefined,
          travelPace: travelPace ?? undefined,
          interestIds: interests
        }
      })
      captureTicketPurchase(ticket)
    }
    setShowPayment(false)
    setIsPreparingPass(true)
  }

  const toggleInterest = (item: string) => {
    setInterests((current) => current.includes(item) ? current.filter((value) => value !== item) : [...current, item])
  }

  const enterTicketSelection = () => {
    if (!profileComplete) return
    setPhase('ticket')
  }

  const beginEntranceCeremony = () => {
    if (isEntranceOpening) return
    setIsEntranceOpening(true)
    window.setTimeout(() => setPhase('welcome'), 1_420)
  }

  const chooseSmartTicket = () => {
    setSmartMode(true)
    if (recommendation.suggestShuttle) {
      setTicketQuantities((current) => ({ ...current, shuttle: Math.max(current.shuttle, entryTicketCount) }))
    }
    setShowXiaolingTicketPanel(false)
  }

  const changeTicketQuantity = (id: TicketCatalogId, delta: number) => {
    setTicketQuantities((current) => {
      const nextQuantity = Math.max(0, Math.min(9, current[id] + delta))
      const next = { ...current, [id]: nextQuantity }
      if (id !== 'shuttle') {
        const nextEntryCount = TICKET_CATALOG.filter((ticket) => ticket.kind === 'entry').reduce((sum, ticket) => sum + next[ticket.id], 0)
        next.shuttle = Math.min(next.shuttle, nextEntryCount)
      }
      if (id === 'shuttle') {
        const currentEntryCount = TICKET_CATALOG.filter((ticket) => ticket.kind === 'entry').reduce((sum, ticket) => sum + current[ticket.id], 0)
        next.shuttle = Math.min(nextQuantity, currentEntryCount)
      }
      return next
    })
    setLastAdjustedTicket(id)
    window.setTimeout(() => setLastAdjustedTicket((current) => current === id ? null : current), 460)
  }

  const submitTicketRequest = () => {
    const request = ticketRequest.trim()
    if (!request) return
    setLastTicketRequest(request)
    setTicketRequest('')
  }

  const closeXiaolingTicketPanel = () => {
    ticketVoiceRef.current?.abort()
    ticketVoiceRef.current = null
    setIsVoiceListening(false)
    setShowXiaolingTicketPanel(false)
  }

  const toggleTicketVoice = () => {
    if (isVoiceListening) {
      ticketVoiceRef.current?.stop()
      setVoiceHint('正在整理语音内容…')
      return
    }

    const prefix = ticketRequest.trim()
    setVoiceHint(voiceEnvironmentHint() ?? '正在倾听，再次点击即可结束。')
    setIsVoiceListening(true)
    ticketVoiceRef.current = createAsr({
      onInterim: (text) => setTicketRequest(prefix ? `${prefix}，${text}` : text),
      onFinal: (text) => {
        setTicketRequest(prefix ? `${prefix}，${text}` : text)
        setIsVoiceListening(false)
        setVoiceHint('已写入输入框，可确认后请小灵重拟。')
      },
      onError: (message) => {
        ticketVoiceRef.current?.abort()
        ticketVoiceRef.current = null
        setIsVoiceListening(false)
        setVoiceHint(message)
      }
    })
    ticketVoiceRef.current.start()
  }

  useEffect(() => () => ticketVoiceRef.current?.abort(), [])

  useEffect(() => {
    if (!isPreparingPass) return
    const timer = window.setTimeout(() => {
      setIsPreparingPass(false)
      setIsIssued(true)
    }, 920)
    return () => window.clearTimeout(timer)
  }, [isPreparingPass])

  if (isPreparingPass) {
    return (
      <div className="ticket-v2-preview c-app-root">
        <div className="ticket-v2-device">
          <main className="ticket-v2-page ticket-v2-page--preparing" aria-live="polite">
            <section className="ticket-v2-pass-preparing" aria-label="正在生成入园票卷">
              <span className="ticket-v2-pass-preparing__seal" aria-hidden="true">入</span>
              <i className="ticket-v2-pass-preparing__line" aria-hidden="true" />
              <small>小灵正在为你收拢票笺</small>
              <strong>入园凭笺生成中</strong>
              <p>行旅信息将写入这张灵山入境票卷。</p>
            </section>
          </main>
        </div>
      </div>
    )
  }

  if (isIssued) {
    return (
      <div className="ticket-v2-preview c-app-root">
        <div className="ticket-v2-device">
          <main className="ticket-v2-page ticket-v2-page--issued">
            <header className="ticket-v2-topbar">
              <span><strong>灵山胜境</strong><small>入园已备妥</small></span>
              <i>入境礼成</i>
            </header>

            <section className="ticket-v2-issued-ceremony" aria-labelledby="ticket-v2-issued-title">
              <span className="ticket-v2-issued-ceremony__halo" aria-hidden="true" />
              <span className="ticket-v2-issued-ceremony__xiaoling-stage" aria-hidden="true"><i /><i /></span>
              <small>小灵与您同行</small>
              <h1 id="ticket-v2-issued-title"><span>准备完成，欢迎进入</span><span>灵山胜境</span></h1>
              <p>接下来，让我陪你开始今天的游览吧。</p>
            </section>

            <EntrancePassScroll
              visitDateLabel={dateLabel(visitDate)}
              partyCount={entryTicketCount}
              totalLabel={`¥${issuedTotal}`}
              ticketSummary={ticketLines.map((ticket) => `${ticket.label} × ${ticket.quantity}`).join('、')}
              verificationCode={`LS-${visitDate.replace(/-/g, '')}-${String(entryTicketCount).padStart(2, '0')}P`}
              barcodeWidths={demoBarcode}
            />

            <div className="ticket-v2-issued-actions">
              <button className="ticket-v2-issued-actions__secondary" type="button" onClick={() => navigate('/me')}>查看票券与订单</button>
              <button className="ticket-v2-begin-journey" type="button" onClick={() => navigate('/map')}>
                开始游览 <b>›</b>
              </button>
            </div>
          </main>
          <CAppBottomNav activeKey="home" />
        </div>
      </div>
    )
  }

  return (
    <div className="ticket-v2-preview c-app-root">
      <div className={`ticket-v2-device ticket-v2-device--${phase}`}>
        <main className={`ticket-v2-page ticket-v2-page--${phase}`}>
          {phase === 'arrival' ? (
            <section className={`ticket-v2-arrival ${isEntranceOpening ? 'is-opening' : ''}`} aria-labelledby="ticket-v2-arrival-title">
              <header className="ticket-v2-arrival__header"><span>灵山胜境</span><small>LINGSHAN ENTRANCE</small></header>
              <div className="ticket-v2-arrival__scene" aria-hidden="true">
                <i className="ticket-v2-arrival__mist ticket-v2-arrival__mist--far" />
                <i className="ticket-v2-arrival__mist ticket-v2-arrival__mist--near" />
                <i className="ticket-v2-arrival__road-light" />
              </div>
              <div className="ticket-v2-arrival__copy">
                <small>入境仪式 · 第一章</small>
                <h1 id="ticket-v2-arrival-title">山门将开<br />灵山在前</h1>
                <p>轻触展开这幅灵山长卷，开启今日行旅。</p>
                <button className="ticket-v2-arrival__seal" type="button" disabled={isEntranceOpening} onClick={beginEntranceCeremony}>
                  <i aria-hidden="true">入</i>
                  <span><small>灵山入境印</small>{isEntranceOpening ? '山门已开' : '轻触开启'}</span><b>›</b>
                </button>
                <button className="ticket-v2-text-action" type="button" onClick={() => setPhase('ticket')}>直接购票</button>
              </div>
            </section>
          ) : null}

          {phase === 'welcome' ? (
            <section className="ticket-v2-welcome" aria-labelledby="ticket-v2-welcome-title">
              <button className="ticket-v2-ceremony-skip" type="button" onClick={() => setPhase('ticket')}>暂不问签，直接购票</button>
              <div className="ticket-v2-welcome__path" aria-hidden="true" />
              <span className="ticket-v2-welcome__xiaoling-stage" aria-hidden="true"><i /><i /></span>
              <MarketTitle
                variant="welcome"
                id="ticket-v2-welcome-title"
                eyebrow="小灵 · 灵山智能向导"
                title="你好，欢迎来到灵山胜境"
                description="我是小灵，陪你开启今天的灵山之旅。"
                action={<button type="button" onClick={() => setPhase('profile')}>请小灵认识我 <b>›</b></button>}
                animationDelay={480}
              />
            </section>
          ) : null}

          {phase === 'profile' ? (
            <section className="ticket-v2-profile-ritual" aria-labelledby="ticket-v2-profile-title">
              <button className="ticket-v2-ceremony-skip" type="button" onClick={() => setPhase('ticket')}>直接购票</button>
              <div className="ticket-v2-profile-ritual__intro">
                <small>小灵同行卡 · 第二章</small>
                <h1 id="ticket-v2-profile-title">让我认识这一程的你</h1>
                <p>你的选择会用于路线、讲解与服务推荐。</p>
              </div>
              <div className="ticket-v2-profile-card">
                <div className="ticket-v2-profile-question">
                  <span>01 · 今日同行构成</span>
                  <div className="ticket-v2-profile-options">
                    {TRAVEL_PARTY_OPTIONS.map((item) => <button key={item.id} type="button" className={partyType === item.id ? 'is-selected' : ''} onClick={() => setPartyType(item.id)}>{item.label}</button>)}
                  </div>
                </div>
                <div className="ticket-v2-profile-question">
                  <span>02 · 期待的游览节奏</span>
                  <div className="ticket-v2-profile-options">
                    {TRAVEL_PACE_OPTIONS.map((item) => <button key={item.id} type="button" className={travelPace === item.id ? 'is-selected' : ''} onClick={() => setTravelPace(item.id)}>{item.label}</button>)}
                  </div>
                </div>
                <div className="ticket-v2-profile-question">
                  <span>03 · 想把时间留给什么</span>
                  <div className="ticket-v2-profile-options">
                    {INTEREST_OPTIONS.map((item) => <button key={item.id} type="button" className={interests.includes(item.id) ? 'is-selected' : ''} onClick={() => toggleInterest(item.id)}>{item.label}</button>)}
                  </div>
                  <small>可选择一项或多项</small>
                </div>
                <div className="ticket-v2-profile-card__record">
                  <span>{profileComplete ? `已记下：${partyLabel} · ${paceLabel} · ${interestLabels.join('、')}` : '请完成同行构成、游览节奏与至少一项偏好'}</span>
                  <button type="button" disabled={!profileComplete} onClick={enterTicketSelection}>写入行旅笺 <b>›</b></button>
                </div>
              </div>
            </section>
          ) : null}

          {phase === 'ticket' ? (
            <section className="ticket-v2-ticket-stage" aria-labelledby="ticket-v2-entry-title">
              <header className="ticket-v2-topbar">
                <span><strong>灵山胜境</strong><small>入园票笺</small></span>
                <button type="button" onClick={() => setPhase('profile')}>小灵同行卡</button>
              </header>
              <div className="ticket-v2-scenery" aria-hidden="true" />
              <MarketTitle title="领取入园票笺" eyebrow="入境仪式 · 第三章" aside="两种方式" id="ticket-v2-entry-title" animationDelay={100} />
              <p className="ticket-v2-ticket-stage__lead">自主选择，或让小灵根据你的行旅笺先为你拟一份方案。</p>

              <section className="ticket-v2-ticket-decision" aria-label="购票方式">
                <div className="ticket-v2-section-label"><span>入园方式</span><small>可随时切换</small></div>
                <div className="ticket-v2-mode-book">
                  <button type="button" className={!smartMode ? 'is-selected' : ''} onClick={() => setSmartMode(false)}><small>自行择票</small><strong>按票种选择</strong><span>自主查看票笺与适用说明</span>{!smartMode ? <em>当前</em> : null}</button>
                  <button type="button" className={smartMode ? 'is-selected' : ''} onClick={() => setShowXiaolingTicketPanel(true)}><small>小灵拟票</small><strong>和小灵一起择票</strong><span>可继续补充你的出行要求</span>{smartMode ? <em>已拟</em> : null}</button>
                </div>
              </section>

              {smartMode ? <section className="ticket-v2-smart-note"><span>灵</span><div><small>小灵已读行旅笺</small><strong>{recommendation.suggestShuttle ? '建议按资格择票，并加购观光车' : '请按每位同行人的资格择票'}</strong><p>依据：{partyLabel || '默认同行'} · {paceLabel || '均衡游览'} · {interestLabels.length ? interestLabels.join('、') : '通览灵山'}。票笺仍可在下方逐项调整。</p></div></section> : null}

              <section className="ticket-v2-ticket-book" aria-label="票券选择">
                <div className="ticket-v2-section-label"><span>入园票笺目录</span><small>左右翻阅，按资格选票</small></div>
                <div className="ticket-v2-ticket-list ticket-v2-ticket-list--catalog">
                  {TICKET_CATALOG.filter((ticket) => ticket.kind === 'entry').map((ticket, index) => (
                    <article className={`ticket-v2-ticket-line ticket-v2-ticket-line--${ticket.kind} ${lastAdjustedTicket === ticket.id ? 'is-adjusted' : ''}`} key={ticket.id}>
                      <i aria-hidden="true">{String(index + 1).padStart(2, '0')}</i>
                      <span><strong>{ticket.label}</strong><small>{ticket.eligibility}</small><em>{ticket.description}</em></span>
                      <b><small>票价</small>{ticket.price === 0 ? '免费' : `¥${ticket.price}${ticket.id === 'shuttle' ? '/人' : ''}`}</b>
                      <div className={`ticket-v2-ticket-line__stepper ${lastAdjustedTicket === ticket.id ? 'is-adjusted' : ''}`} aria-label={`${ticket.label}数量`}>
                        <button type="button" aria-label={`减少${ticket.label}`} disabled={ticketQuantities[ticket.id] === 0} onClick={() => changeTicketQuantity(ticket.id, -1)}><span>减</span><small>一</small></button>
                        <strong><i>{ticketQuantityLabel(ticketQuantities[ticket.id])}</i><small>张</small></strong>
                        <button type="button" aria-label={`增加${ticket.label}`} onClick={() => changeTicketQuantity(ticket.id, 1)}><span>添</span><small>一</small></button>
                      </div>
                    </article>
                  ))}
                </div>
                {TICKET_CATALOG.filter((ticket) => ticket.kind === 'add_on').map((ticket) => (
                  <article className={`ticket-v2-ticket-line ticket-v2-ticket-line--add_on ticket-v2-ticket-line--shuttle ${lastAdjustedTicket === ticket.id ? 'is-adjusted' : ''}`} key={ticket.id}>
                    <i aria-hidden="true">05</i>
                    <span><strong>{ticket.label}</strong><small>{ticket.eligibility} · {ticket.description}</small><em>可与入园票笺一同确认</em></span>
                    <b><small>票价</small>¥{ticket.price}/人</b>
                    <div className={`ticket-v2-ticket-line__stepper ${lastAdjustedTicket === ticket.id ? 'is-adjusted' : ''}`} aria-label={`${ticket.label}数量`}>
                      <button type="button" aria-label={`减少${ticket.label}`} disabled={ticketQuantities[ticket.id] === 0} onClick={() => changeTicketQuantity(ticket.id, -1)}><span>减</span><small>一</small></button>
                      <strong><i>{ticketQuantityLabel(ticketQuantities[ticket.id])}</i><small>张</small></strong>
                      <button type="button" aria-label={`增加${ticket.label}`} onClick={() => changeTicketQuantity(ticket.id, 1)}><span>添</span><small>一</small></button>
                    </div>
                  </article>
                ))}
                <p className="ticket-v2-ticket-note">{entryTicketCount ? `已选择 ${entryTicketCount} 张入园票${ticketQuantities.shuttle ? `，另含 ${ticketQuantities.shuttle} 张观光车票。` : '。'}` : '请至少选择一张入园票。'}{ticketQuantities.online_bundle && ticketQuantities.shuttle ? ' 网购联票已含观光车，请留意避免重复购买。' : ''}</p>
              </section>

              <section className="ticket-v2-journey-slip" aria-label="行程信息">
                <div className="ticket-v2-section-label"><span>行程日签</span><small>确认入园日期与已选人数</small></div>
                <div className="ticket-v2-journey-grid">
                  <label><span><CalendarOutlined /> 入园日期</span><input type="date" min={getToday()} value={visitDate} onChange={(event) => setVisitDate(event.target.value)} /><strong>{dateLabel(visitDate)}</strong></label>
                  <div className="ticket-v2-party-summary"><span><TeamOutlined /> 已选入园人数</span><strong>{entryTicketCount}<small>人</small></strong><small>按票笺数量合计</small></div>
                </div>
              </section>
            </section>
          ) : null}
        </main>

        {phase === 'ticket' ? <footer className="ticket-v2-payment-dock"><span><small>本次票务</small><strong>¥{total}</strong><em>{entryTicketCount ? `${entryTicketCount} 人入园 · ${ticketLines.length} 类票笺` : '请选择入园票笺'}</em></span><button type="button" disabled={!entryTicketCount} onClick={() => setShowPayment(true)}>{entryTicketCount ? '确认入园票笺' : '请选择入园票笺'} <b>›</b></button></footer> : null}
        {phase === 'ticket' ? <CAppBottomNav activeKey="home" /> : null}
        {showXiaolingTicketPanel ? (
          <CAppBottomSheet title="和小灵一起择票" eyebrow="小灵 · 入园票笺" onClose={closeXiaolingTicketPanel} closeLabel="暂合" className="ticket-v2-xiaoling-panel">
            <div className="ticket-v2-xiaoling-panel__conversation">
              <p className="ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--assistant">我已读到你的行旅笺：{partyLabel || '尚未填写同行构成'}、{paceLabel || '尚未填写游览节奏'}，以及{interestLabels.length ? interestLabels.join('、') : '通览灵山'}。</p>
              {lastTicketRequest ? <p className="ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--visitor">{lastTicketRequest}</p> : null}
              <p className="ticket-v2-xiaoling-panel__message ticket-v2-xiaoling-panel__message--assistant">{recommendation.reply} 你还可以继续告诉我同行人、想看的内容或体力安排。</p>
            </div>
            <div className="ticket-v2-xiaoling-panel__ticket">
              <span>小灵的择票建议</span><strong>{recommendation.suggestShuttle ? '按资格择票 · 加购观光车' : '按资格分别选择票笺'}</strong><small>{recommendation.suggestShuttle ? '已预留观光车建议，票种请按资格确认。' : '票种资格以入园核验为准。'}</small><b>{recommendation.suggestShuttle ? '¥40/人' : '按资格计价'}</b>
              <button type="button" onClick={chooseSmartTicket}>{recommendation.suggestShuttle ? '将观光车加入清单' : '保留当前票笺'} <i>›</i></button>
            </div>
            <div className="ticket-v2-xiaoling-panel__presets" aria-label="快捷补充需求">
              {TICKET_REQUEST_PRESETS.map((item) => <button key={item} type="button" onClick={() => setLastTicketRequest(item)}>{item}</button>)}
            </div>
            <form className="ticket-v2-xiaoling-panel__composer" onSubmit={(event) => { event.preventDefault(); submitTicketRequest() }}>
              <button className={`ticket-v2-xiaoling-panel__voice ${isVoiceListening ? 'is-listening' : ''}`} type="button" onClick={toggleTicketVoice} aria-label={isVoiceListening ? '结束语音输入' : '开始语音输入'} title={isVoiceListening ? '再次点击结束语音输入' : '语音输入'}><AudioOutlined /></button>
              <textarea value={ticketRequest} onChange={(event) => setTicketRequest(event.target.value)} rows={2} placeholder="例如：两个大人带孩子，想轻松游览" aria-label="补充购票需求" />
              <button type="submit" disabled={!ticketRequest.trim()}>请小灵重拟</button>
              {voiceHint ? <p className="ticket-v2-xiaoling-panel__voice-hint" role="status">{voiceHint}</p> : null}
            </form>
          </CAppBottomSheet>
        ) : null}
        {showPayment ? <PaymentSheet amount={total} onClose={() => setShowPayment(false)} onPaid={completeTicketPayment} /> : null}
      </div>
    </div>
  )
}

export default MobileTicketPageV2
