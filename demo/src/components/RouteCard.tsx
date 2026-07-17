import { ArrowRightOutlined, ClockCircleOutlined, EnvironmentOutlined } from '@ant-design/icons'
import { getRouteItineraryMeta, type GuideRecommendationCard } from '../data/guideData'

type Props = {
  route: GuideRecommendationCard
  isActive?: boolean
  isMain?: boolean
  onSelect: () => void
  onSwitchLight?: () => void
}

const PERSONA_LABEL_MAP: Record<string, string> = {
  '文化朝圣型': '文化朝圣',
  '疗愈祈福型': '疗愈祈福',
  '亲子轻游型': '亲子轻游',
  culture_pilgrim: '文化朝圣',
  serenity_seeker: '疗愈祈福',
  family_explorer: '亲子轻游'
}

function MatchRing({ score, compact }: { score: number; compact?: boolean }) {
  const pct = Math.max(0, Math.min(1, score)) * 100
  const size = compact ? 36 : 64
  const stroke = compact ? 3 : 4
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (pct / 100) * c
  return (
    <div className={`route-card__ring ${compact ? 'route-card__ring--sm' : ''}`}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(160, 116, 64, 0.16)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#routeCardRing)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <defs>
          <linearGradient id="routeCardRing" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c89656" />
            <stop offset="100%" stopColor="#86532b" />
          </linearGradient>
        </defs>
      </svg>
      <span>{Math.round(pct)}<small>%</small></span>
    </div>
  )
}

function PersonaChip({ persona }: { persona: string }) {
  const short = PERSONA_LABEL_MAP[persona] ?? persona
  return (
    <span className="route-card__persona-chip">
      <span className="route-card__persona-chip-dot" />
      {short}
    </span>
  )
}

function RouteCard({ route, isActive, isMain, onSelect, onSwitchLight }: Props) {
  const matchScore = typeof route.matchScore === 'number' ? route.matchScore : 0
  const persona = route.routePersona ?? ''
  const why = route.whyRecommended ?? route.reason
  const meta = getRouteItineraryMeta(route.id)
  const stopCount = route.stopIds?.length ?? meta.stopCount
  const adjustmentReasons = route.adjustmentReasons ?? []

  if (!isMain) {
    return (
      <article
        className={`route-card route-card--secondary ${isActive ? 'route-card--active' : ''}`}
        onClick={onSelect}
      >
        <div className="route-card__secondary-row">
          <div className="route-card__secondary-head">
            {persona ? <PersonaChip persona={persona} /> : null}
            {matchScore > 0 ? (
              <span className="route-card__match-inline">匹配 {Math.round(matchScore * 100)}%</span>
            ) : null}
          </div>
          <h3 className="route-card__title route-card__title--sm">{route.name}</h3>
          <p className="route-card__sub">{route.durationLabel}</p>
        </div>
        <p className="route-card__why route-card__why--ellipsis">{why}</p>
        {adjustmentReasons.length ? <p className="route-card__adjustment">路线已按现场情况调整</p> : null}
        <span className="route-card__cta-link">进入导览 <ArrowRightOutlined /></span>
      </article>
    )
  }

  return (
    <article className={`route-card route-card--main ${isActive ? 'route-card--active' : ''}`}>
      <header className="route-card__top">
        <div className="route-card__top-left">
          {persona ? <PersonaChip persona={persona} /> : <span className="route-card__persona-chip route-card__persona-chip--ghost">推荐</span>}
          <span className="route-card__top-meta">{route.durationLabel}</span>
        </div>
        {matchScore > 0 ? <MatchRing score={matchScore} /> : null}
      </header>

      <h2 className="route-card__title">{route.name}</h2>

      <div className="route-card__facts">
        <span className="route-card__fact"><ClockCircleOutlined /> {meta.durationLabel}</span>
        <span className="route-card__fact"><EnvironmentOutlined /> {stopCount} 个站点</span>
        <span className="route-card__fact route-card__fact--walk">{meta.walkIntensity}</span>
      </div>

      <div className="route-card__tags">
        {route.tags.map((tag) => (
          <span key={tag} className="route-card__tag">{tag}</span>
        ))}
      </div>

      <blockquote className="route-card__why">
        {why}
      </blockquote>

      {adjustmentReasons.length ? (
        <aside className="route-card__adjustments" aria-label="路线实时调整说明">
          <strong>路线已实时调整</strong>
          {adjustmentReasons.slice(0, 2).map(reason => <span key={reason}>{reason}</span>)}
        </aside>
      ) : null}

      <p className="route-card__desc">{route.description}</p>

      {meta.highlights.length ? (
        <ul className="route-card__highlights">
          {meta.highlights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}

      <footer className="route-card__footer">
        <button className="btn-primary route-card__cta" onClick={onSelect}>
          进入地图导览
          <ArrowRightOutlined />
        </button>
        {route.lightAlternativeId && onSwitchLight ? (
          <button className="route-card__ghost" onClick={onSwitchLight}>
            试试轻量版
          </button>
        ) : null}
      </footer>
    </article>
  )
}

export default RouteCard
