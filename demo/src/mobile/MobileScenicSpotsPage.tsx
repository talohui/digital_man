import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { lingshanPoiDetails, type LingshanPoiDetail } from '../data/lingshanPoiDetails'
import { guideSpots } from '../data/guideData'
import { getPoiMedia } from '../data/scenicMediaCatalog'
import { getRecommendedStayLabel } from '../data/poiGuideMetadata'
import {
  consumeCAppReturnContext,
  readCAppReturnContext,
  saveCAppReturnContext
} from '../lib/cAppReturnContext'
import '../styles/c-app/mobileScenicSpots.css'

type SpotCategory = 'all' | LingshanPoiDetail['category']

const CATEGORY_FILTERS: Array<{ id: SpotCategory; label: string }> = [
  { id: 'all', label: '全部景点' },
  { id: '核心景点', label: '核心景点' },
  { id: '文化节点', label: '文化节点' },
  { id: '空间节点', label: '空间节点' }
]

const EXTRA_SPOT_PRESENTATION: Record<string, {
  subtitle: string
  category: LingshanPoiDetail['category']
}> = {
  south_gate: { subtitle: '入园迎宾序章', category: '空间节点' },
  fozu_tan: { subtitle: '礼佛开场圣迹', category: '文化节点' },
  xingtan_square: { subtitle: '朝礼轴线过渡', category: '空间节点' },
  fan_gong_square: { subtitle: '梵宫外部前庭', category: '空间节点' },
  lingshan_jingshe: { subtitle: '禅意清修之所', category: '文化节点' },
  exit: { subtitle: '行程收束节点', category: '空间节点' }
}

const detailByPoiId = new Map(lingshanPoiDetails.map((detail) => [detail.id, detail]))
const SCENIC_SPOTS = guideSpots.map((spot) => {
  const detail = detailByPoiId.get(spot.id)
  const fallback = EXTRA_SPOT_PRESENTATION[spot.id]
  return {
    id: spot.id,
    name: detail?.name ?? spot.name,
    subtitle: detail?.subtitle ?? fallback?.subtitle ?? '灵山景区导览节点',
    category: detail?.category ?? fallback?.category ?? '文化节点'
  }
})

function MobileScenicSpotsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [category, setCategory] = useState<SpotCategory>('all')
  const spots = useMemo(
    () => category === 'all'
      ? SCENIC_SPOTS
      : SCENIC_SPOTS.filter((spot) => spot.category === category),
    [category]
  )

  useEffect(() => {
    const context = readCAppReturnContext()
    const currentUrl = `${location.pathname}${location.search}${location.hash}`
    if (context?.source !== 'spots-list' || context.returnTo !== currentUrl) return undefined

    let secondFrame = 0
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => {
        const scrollContainer = document.querySelector<HTMLElement>('.mobile-shell__content')
        if (scrollContainer && Number.isFinite(context.returnScrollY)) {
          scrollContainer.scrollTo({ top: context.returnScrollY, behavior: 'auto' })
        }
        consumeCAppReturnContext()
      })
    })

    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [location.hash, location.pathname, location.search])

  const openSpot = (spotId: string) => {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    const scrollContainer = document.querySelector<HTMLElement>('.mobile-shell__content')
    saveCAppReturnContext({
      source: 'spots-list',
      returnTo,
      returnScrollY: scrollContainer?.scrollTop ?? 0,
      contextType: 'poi',
      poiId: spotId
    })
    navigate(`/map-3d-guide-c/poi/${encodeURIComponent(spotId)}?from=browse`)
  }

  return (
    <div className="scenic-spots-page c-app-root">
      <header className="scenic-spots-hero">
        <button type="button" className="scenic-spots-back" onClick={() => navigate('/')} aria-label="返回首页">
          <LeftOutlined />
        </button>
        <div className="scenic-spots-hero__copy">
          <h1>灵山胜景</h1>
          <p>循着山水与礼佛轴线，认识每一处值得停留的景点。</p>
        </div>
        <div className="scenic-spots-hero__seal" aria-hidden="true">
          <span>灵山</span>
          <b>十九景</b>
        </div>
      </header>

      <nav className="scenic-spots-filters" aria-label="景点分类">
        {CATEGORY_FILTERS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'is-active' : ''}
            aria-pressed={category === item.id}
            onClick={() => setCategory(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>

      <section className="scenic-spots-section" aria-live="polite">
        <div className="scenic-spots-section__head">
          <div><span>灵山胜景导览</span><h2>{category === 'all' ? '景点一览' : category}</h2></div>
          <small>{spots.length} 处可查看</small>
        </div>

        <div className="scenic-spots-grid" key={category}>
          {spots.map((spot, index) => {
            const media = getPoiMedia(spot.id)
            return (
              <button
                key={spot.id}
                type="button"
                className="scenic-spot-card"
                style={{ '--spot-index': index } as CSSProperties}
                onClick={() => openSpot(spot.id)}
                aria-label={`查看${spot.name}详情`}
              >
                <span className="scenic-spot-card__image">
                  <img src={media.thumbnail ?? media.cover} alt="" loading={index < 4 ? 'eager' : 'lazy'} />
                  <em>{String(index + 1).padStart(2, '0')}</em>
                  <i>{spot.category}</i>
                </span>
                <span className="scenic-spot-card__body">
                  <strong>{spot.name}</strong>
                  <small>{spot.subtitle}</small>
                  <span>{getRecommendedStayLabel(spot.id)}<RightOutlined /></span>
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export default MobileScenicSpotsPage
