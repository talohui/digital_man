import {
  BarChartOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  HeartOutlined,
  NodeIndexOutlined,
  ShoppingCartOutlined,
  SoundOutlined,
  StarOutlined
} from '@ant-design/icons'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { useGuideStore } from '../store/useGuideStore'
import {
  ticketTypeOptions,
  useTicketStore
} from '../store/useTicketStore'

function MobileProfilePage() {
  const navigate = useNavigate()
  const selectedTags = useGuideStore((state) => state.selectedTags)
  const userProfile = useGuideStore((state) => state.userProfile)
  const visitedStops = useGuideStore((state) => state.visitedStops)
  const listenedStops = useGuideStore((state) => state.listenedStops)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const ticket = useTicketStore((state) => state.ticketProfile)
  const purchases = useTicketStore((state) => state.purchases)
  // 注意：selector 必须返回稳定引用。直接 state.spendByCategory() 每次返回新对象，
  // 在 zustand v5 / useSyncExternalStore 下会触发无限循环导致整页白屏。
  // 这里只订阅 purchases，再用 useMemo 派生，保证引用稳定且随消费更新。
  const totalSpend = useMemo(
    () => purchases.reduce((sum, item) => sum + item.amount, 0),
    [purchases]
  )
  // 今日行程回顾：把已走/已听站点聚合成一条当日轨迹（仅展示，不参与推荐计算）
  const visitedSpotList = useMemo(
    () => visitedStops.map((id) => getGuideSpotById(id)),
    [visitedStops]
  )
  const totalStayMinutes = useMemo(
    () => visitedSpotList.reduce((sum, spot) => sum + (spot?.stayMinutes ?? 0), 0),
    [visitedSpotList]
  )
  const hasJourney = visitedSpotList.length > 0
  const activeRoute = getGuideRouteById(activeRouteId)
  const lastVisitedStopIndex = Math.max(
    0,
    activeRoute.stops.findIndex((stop) => stop.spotId === visitedStops[visitedStops.length - 1])
  )

  const personaLabel = userProfile?.primaryPersonaLabel || '偏好逐步形成中'
  const ticketTypeLabel = ticketTypeOptions.find((item) => item.id === ticket?.ticketType)?.label ?? ticket?.ticketType

  return (
    <div className="mobile-profile-page">
      <section className="mobile-profile-card">
        <img className="mobile-illus mobile-illus--avatar" src="/icons/icon-profile.png" alt="" />
        <div>
          <span className="mobile-section-kicker">当前画像</span>
          <h2>{personaLabel}</h2>
          <p>画像依据来自你的游览期待、路线选择、景点进入与评分反馈。</p>
        </div>
      </section>

      <section className="mobile-panel mobile-journey-recap">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">今日行程回顾</span>
            <h3>你今天的灵山足迹</h3>
          </div>
          <NodeIndexOutlined />
        </div>
        {hasJourney ? (
          <>
            <div className="mobile-journey-recap__stats">
              <div>
                <EnvironmentOutlined />
                <strong>{visitedSpotList.length}</strong>
                <span>到访站点</span>
              </div>
              <div>
                <SoundOutlined />
                <strong>{listenedStops.length}</strong>
                <span>已听讲解</span>
              </div>
              <div>
                <ClockCircleOutlined />
                <strong>{totalStayMinutes}</strong>
                <span>建议停留(分)</span>
              </div>
              <div>
                <ShoppingCartOutlined />
                <strong>¥{Math.round(totalSpend)}</strong>
                <span>累计消费</span>
              </div>
            </div>
            <div className="mobile-journey-recap__trail">
              {visitedSpotList.map((spot, index) => (
                <span
                  key={spot.id}
                  className={`mobile-journey-recap__node ${listenedStops.includes(spot.id) ? 'is-listened' : ''}`}
                >
                  {index + 1}. {spot.name}
                  {listenedStops.includes(spot.id) ? <SoundOutlined /> : null}
                </span>
              ))}
            </div>
            <button
              type="button"
              className="mobile-profile-continue-route"
              onClick={() => navigate(
                `/map-3d-guide-c/route/${encodeURIComponent(activeRoute.id)}?stage=active&stop=${lastVisitedStopIndex}`
              )}
            >
              继续上一次行程
            </button>
          </>
        ) : (
          <p className="mobile-muted">还没有到访记录。进入地图选一条路线、点开景点听小灵讲解，这里会自动记录你的当日足迹。</p>
        )}
      </section>

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">当前偏好</span>
            <h3>首页标签快照</h3>
          </div>
          <BarChartOutlined />
        </div>
        {selectedTags.length > 0 ? (
          <div className="mobile-tag-list mobile-tag-list--readonly">
            {selectedTags.map((tag) => (
              <span key={tag} className="mobile-tag is-active">
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="mobile-muted">还没有选择游览期待，可以回到首页快速补充。</p>
        )}
      </section>

      <section className="mobile-panel mobile-profile-ticket">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">本次票务</span>
            <h3>{ticket ? `${ticket.visitDate} 入园` : '还未购票'}</h3>
          </div>
          <ShoppingCartOutlined />
        </div>
        {ticket ? (
          <div className="mobile-profile-ticket__facts">
            <div>
              <span>同行人数</span>
              <strong>{ticket.groupSize} 人</strong>
            </div>
            <div>
              <span>票型</span>
              <strong>{ticketTypeLabel}</strong>
            </div>
          </div>
        ) : (
          <p className="mobile-muted">购票后会在这里展示游览日期、同行人数和票型，消费明细请看「消费」页。</p>
        )}
        <div className="mobile-profile-ticket__actions">
          {ticket ? (
            <button type="button" onClick={() => navigate('/consume')}>去消费页</button>
          ) : (
            <button type="button" onClick={() => navigate('/ticket')}>购票入园</button>
          )}
        </div>
      </section>

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">评分入口</span>
            <h3>完成体验后再反馈</h3>
          </div>
          <StarOutlined />
        </div>
        <p className="mobile-muted">
          路线评分在地图抽屉里，景点评价在“小灵”景点讲解页里；这些反馈只用于推荐和大屏统计，不改变知识问答事实。
        </p>
      </section>
    </div>
  )
}

export default MobileProfilePage
