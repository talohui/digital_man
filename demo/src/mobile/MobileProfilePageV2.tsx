import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  RightOutlined,
  ShoppingOutlined,
  SoundOutlined
} from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MarketCategoryTabs } from '../components/mobile/consume'
import CAppBottomNav from '../components/mobile/navigation/CAppBottomNav'
import { ProfileCompanionNote, ProfilePreferenceCard } from '../components/mobile/profile'
import { GUIDE_PREFERENCE_GROUPS, getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { getMapResumeUrl } from '../lib/mapResumeState'
import { useGuideStore } from '../store/useGuideStore'
import { purchaseCategoryLabels, ticketTypeOptions, useTicketStore } from '../store/useTicketStore'
import '../styles/c-app/marketCategoryTabs.css'
import '../styles/c-app/mobileProfileV2.css'

type ProfileSection = 'ticket' | 'journey' | 'orders' | 'preference'

const PROFILE_SECTIONS: Array<{ id: ProfileSection; label: string; icon: string }> = [
  { id: 'ticket', label: '票务', icon: '/icons/icon-ticket.png' },
  { id: 'journey', label: '游历', icon: '/icons/cat-spot.png' },
  { id: 'orders', label: '订单', icon: '/icons/icon-cart.png' },
  { id: 'preference', label: '偏好', icon: '/icons/icon-profile.png' }
]

function formatDate(value?: string) {
  if (!value) return '待启程'
  const date = new Date(value.includes('T') ? value : `${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' }).format(date)
}

function formatOrderTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

function MobileProfilePageV2() {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState<ProfileSection>('ticket')
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const guidePreferences = useGuideStore((state) => state.guidePreferences)
  const userProfile = useGuideStore((state) => state.userProfile)
  const refreshUserProfile = useGuideStore((state) => state.refreshUserProfile)
  const ensureCurrentJourney = useGuideStore((state) => state.ensureCurrentJourney)
  const visitedStops = useGuideStore((state) => state.visitedStops)
  const listenedStops = useGuideStore((state) => state.listenedStops)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const ticket = useTicketStore((state) => state.ticketProfile)
  const orders = useTicketStore((state) => state.orders)
  const purchases = useTicketStore((state) => state.purchases)

  useEffect(() => {
    ensureCurrentJourney()
    void refreshUserProfile()
  }, [ensureCurrentJourney, refreshUserProfile])

  const activeRoute = getGuideRouteById(activeRouteId)
  const visitedSpots = useMemo(() => visitedStops.map((spotId) => getGuideSpotById(spotId)), [visitedStops])
  const totalStayMinutes = useMemo(() => visitedSpots.reduce((sum, spot) => sum + spot.stayMinutes, 0), [visitedSpots])
  const totalSpend = useMemo(() => purchases.reduce((sum, purchase) => sum + purchase.amount, 0), [purchases])
  const preferenceEntries = useMemo(() => GUIDE_PREFERENCE_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    value: group.options.find((option) => option.value === guidePreferences[group.key])?.label ?? guidePreferences[group.key]
  })), [guidePreferences])

  const ticketTypeLabel = ticketTypeOptions.find((item) => item.id === ticket?.ticketType)?.label
  const ticketSelectionLabel = ticket?.ticketSelections?.map((item) => `${item.name} × ${item.quantity}`).join('、')
  const latestSpot = visitedSpots[visitedSpots.length - 1]
  const lastVisitedStopNumber = Math.max(1, activeRoute.stops.findIndex((stop) => stop.spotId === visitedStops[visitedStops.length - 1]) + 1)
  const resumeUrl = getMapResumeUrl(`/map-3d-guide-c/route/${encodeURIComponent(activeRoute.id)}?stage=active&stop=${lastVisitedStopNumber}`)

  return (
    <div className="profile-v2-preview c-app-root">
      <div className="profile-v2-device">
        <main className="profile-v2-page">
          <header className="profile-v2-topbar">
            <span><strong>灵山胜境</strong><small>LINGSHAN JOURNEY</small></span>
          </header>

          <section className="profile-v2-hero" aria-labelledby="profile-v2-title">
            <div className="profile-v2-hero__copy">
              <h1 id="profile-v2-title">我的灵山行旅</h1>
              <p>{ticket ? `${formatDate(ticket.visitDate)} · ${ticket.groupSize} 人同行` : '每一次选择，都在写下你的灵山行旅。'}</p>
            </div>
            <div className="profile-v2-hero__seal" aria-hidden="true"><span>灵山</span><b>行旅中</b></div>
            <div className="profile-v2-hero__tags">
              {(selectedTags.length > 0 ? selectedTags : ['偏好感知中']).slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}
            </div>
          </section>

          <MarketCategoryTabs
            className="profile-v2-categories"
            items={PROFILE_SECTIONS}
            value={activeSection}
            ariaLabel="我的行旅分类"
            onChange={(section) => setActiveSection(section as ProfileSection)}
          />

          <div className="profile-v2-section-stage" key={activeSection}>
          {activeSection === 'ticket' ? <section className="profile-v2-section" id="profile-ticket">
            <div className="profile-v2-section__head"><div><span>入园票帖</span><h2>已购票务</h2></div><small>{ticket ? '凭证有效' : '尚未购票'}</small></div>
            {ticket ? (
              <article className="profile-v2-ticket">
                <div className="profile-v2-ticket__mark"><span>灵山</span><b>入园</b></div>
                <div className="profile-v2-ticket__main"><span>本次游览凭证</span><h3>{ticketSelectionLabel || ticketTypeLabel}</h3><p>{formatDate(ticket.visitDate)} · {ticket.groupSize} 人</p></div>
                <strong>¥{ticket.ticketCost}</strong>
                <small>票号 {ticket.ticketId.slice(-8).toUpperCase()}</small>
              </article>
            ) : (
              <button className="profile-v2-empty-card" type="button" onClick={() => navigate('/ticket')}><span>这一程还没有入园票帖</span><b>去购票 <RightOutlined /></b></button>
            )}
          </section> : null}

          {activeSection === 'journey' ? <section className="profile-v2-section" id="profile-journey">
            <div className="profile-v2-section__head"><div><span>游览档案</span><h2>今日行迹</h2></div><small>{activeRoute.name}</small></div>
            <div className="profile-v2-journey">
              <div className="profile-v2-stats">
                <span><EnvironmentOutlined /><strong>{visitedSpots.length}</strong><small>到访</small></span>
                <span><SoundOutlined /><strong>{listenedStops.length}</strong><small>讲解</small></span>
                <span><ClockCircleOutlined /><strong>{totalStayMinutes}</strong><small>分钟</small></span>
                <span><ShoppingOutlined /><strong>{Math.round(totalSpend)}</strong><small>元消费</small></span>
              </div>
              {visitedSpots.length > 0 ? (
                <div className="profile-v2-trail">
                  {visitedSpots.slice(-4).map((spot, index) => (
                    <span key={spot.id} className={listenedStops.includes(spot.id) ? 'is-listened' : ''}>
                      <i>{String(Math.max(1, visitedSpots.length - 3 + index)).padStart(2, '0')}</i><b>{spot.name}</b>{listenedStops.includes(spot.id) ? <SoundOutlined /> : null}
                    </span>
                  ))}
                </div>
              ) : <p className="profile-v2-muted">入园后的到访与讲解会在这里自动写成行迹。</p>}
              <button className="profile-v2-action" type="button" onClick={() => navigate(resumeUrl)}><span>{latestSpot ? `从${latestSpot.name}继续` : '开始记录今日行迹'}</span><RightOutlined /></button>
            </div>
          </section> : null}

          {activeSection === 'orders' ? <section className="profile-v2-section" id="profile-orders">
            <div className="profile-v2-section__head"><div><span>雅集消费</span><h2>消费订单</h2></div><small>{orders.length} 笔 · 共 ¥{totalSpend.toFixed(0)}</small></div>
            {orders.length > 0 ? (
              <div className="profile-v2-orders">
                {orders.slice(0, 3).map((order) => (
                  <details key={order.id}>
                    <summary><span><small>{formatOrderTime(order.createdAt)}</small><strong>{order.items.map((item) => item.name).join('、')}</strong></span><b>¥{order.total.toFixed(2)}</b></summary>
                    <div>{order.items.map((item) => <p key={`${order.id}-${item.productId}`}><span>{purchaseCategoryLabels[item.category]} · {item.name} × {item.qty}</span><b>¥{(item.price * item.qty).toFixed(2)}</b></p>)}</div>
                  </details>
                ))}
              </div>
            ) : (
              <button className="profile-v2-empty-card" type="button" onClick={() => navigate('/consume')}><span>斋食、文创与游园服务订单会归入此行</span><b>去逛雅集 <RightOutlined /></b></button>
            )}
          </section> : null}

          {activeSection === 'preference' ? <section className="profile-v2-section" id="profile-preference">
            <ProfilePreferenceCard
              tags={selectedTags}
              entries={preferenceEntries}
              profileVersion={userProfile?.profileVersion}
            />
          </section> : null}
          </div>

          <ProfileCompanionNote
            latestSpotName={latestSpot?.name}
            onOpen={() => navigate('/guide?returnTo=%2Fme')}
          />
        </main>
        <CAppBottomNav activeKey="profile" />
      </div>
    </div>
  )
}

export default MobileProfilePageV2
