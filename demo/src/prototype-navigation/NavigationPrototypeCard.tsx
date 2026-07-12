import { Link } from 'react-router-dom'

import { guideSpots } from '../data/guideData'
import { getPoiArrivalSummary } from '../data/poiGuideMetadata'
import { useNavigationPrototypeStore } from './useNavigationPrototypeStore'
import type { NavigationPrototypeEndpoint } from './types'

const SOUTH_GATE = toEndpoint('south_gate')
const LINGSHAN_WALL = toEndpoint('lingshan_wall')

function toEndpoint(poiId: string): NavigationPrototypeEndpoint {
  const spot = guideSpots.find((item) => item.id === poiId)

  if (!spot) {
    throw new Error(`缺少原型导航 POI：${poiId}`)
  }

  return {
    poiId: spot.id,
    name: spot.name,
    lat: spot.lat,
    lng: spot.lng
  }
}

function formatDistance(distanceMeters: number) {
  return distanceMeters >= 1000 ? `${(distanceMeters / 1000).toFixed(1)} km` : `${distanceMeters} m`
}

function formatDuration(durationMinutes: number) {
  return durationMinutes >= 60 ? `${Math.floor(durationMinutes / 60)}小时${durationMinutes % 60}分钟` : `${durationMinutes}分钟`
}

export function NavigationPrototypeCard() {
  const status = useNavigationPrototypeStore((state) => state.status)
  const route = useNavigationPrototypeStore((state) => state.route)
  const location = useNavigationPrototypeStore((state) => state.location)
  const progress = useNavigationPrototypeStore((state) => state.progress)
  const arrivalLocationHits = useNavigationPrototypeStore((state) => state.arrivalLocationHits)
  const error = useNavigationPrototypeStore((state) => state.error)
  const start = useNavigationPrototypeStore((state) => state.start)
  const simulateArrival = useNavigationPrototypeStore((state) => state.simulateArrival)
  const reset = useNavigationPrototypeStore((state) => state.reset)
  const instruction = progress?.currentInstruction ?? route?.steps[0]?.instruction
  const distanceMeters = progress?.distanceRemainingMeters ?? route?.distanceMeters ?? 0
  const durationMinutes = progress?.durationRemainingMinutes ?? route?.durationMinutes ?? 0
  const arrivalSummary = route ? getPoiArrivalSummary(route.destination.poiId) : undefined

  return (
    <section className={`navigation-prototype-card is-${status}`} aria-label="腾讯步行导航原型">
      <div className="navigation-prototype-card__head">
        <span>Prototype Navigation</span>
        <small>南门入园 → 灵山大照壁</small>
      </div>

      {status === 'idle' ? (
        <button type="button" className="navigation-prototype-card__primary" onClick={() => void start(SOUTH_GATE, LINGSHAN_WALL)}>
          开始导航
        </button>
      ) : null}

      {status === 'locating' ? <p className="navigation-prototype-card__status">正在获取当前位置并调用腾讯步行路线…</p> : null}

      {route && (status === 'locating' || status === 'navigating' || status === 'arrived' || status === 'error') ? (
        <div className="navigation-prototype-card__details">
          <p>正在前往：<strong>{route.destination.name}</strong></p>
          <dl>
            <div>
              <dt>距离</dt>
              <dd>{formatDistance(distanceMeters)}</dd>
            </div>
            <div>
              <dt>预计</dt>
              <dd>{formatDuration(durationMinutes)}</dd>
            </div>
            <div>
              <dt>路线点</dt>
              <dd>{route.polyline.length}</dd>
            </div>
            <div>
              <dt>指令</dt>
              <dd>{route.steps.length} 步</dd>
            </div>
          </dl>
          {instruction ? <p className="navigation-prototype-card__instruction">下一步：{instruction}</p> : null}
          {location ? <p className="navigation-prototype-card__location">定位精度：约{Math.round(location.accuracy)}m</p> : null}
          {status === 'navigating' ? <p className="navigation-prototype-card__location">到达确认：{arrivalLocationHits}/3</p> : null}
          {status !== 'arrived' ? (
            <button type="button" className="navigation-prototype-card__primary" onClick={simulateArrival}>
              模拟到达
            </button>
          ) : (
            <div className="navigation-prototype-card__arrival">
              <p className="navigation-prototype-card__arrived">已到达{route.destination.name}</p>
              {arrivalSummary ? <p>{arrivalSummary}</p> : null}
              <Link to={`/map-3d-guide-c/poi/${route.destination.poiId}?from=browse`}>
                查看景点介绍
              </Link>
            </div>
          )}
        </div>
      ) : null}

      {status === 'error' ? (
        <div className="navigation-prototype-card__error">
          <p>{error}</p>
          <button type="button" onClick={reset}>重新开始</button>
        </div>
      ) : null}
    </section>
  )
}
