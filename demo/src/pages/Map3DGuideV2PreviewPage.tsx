import { ArrowLeftOutlined, EnvironmentOutlined, RightOutlined } from '@ant-design/icons'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { XiaolingAvatar } from '../components/guide/XiaolingAvatar'
import { MapLayerPanel } from '../components/map/MapLayerPanel'
import { MapMobileToolRail } from '../components/map/MapMobileToolRail'
import MarketCategoryTabs from '../components/mobile/consume/MarketCategoryTabs'
import CAppBottomSheet from '../components/mobile/overlays/CAppBottomSheet'
import { getPoiMedia } from '../data/scenicMediaCatalog'
import { guideSpots, scenicCenter } from '../data/guideData'
import { scenicRouteConfigs, type ScenicRouteConfig } from '../data/lingshanScenicRoutes'
import { type MapGuideState } from '../types/mapGuide'
import {
  Map3DGuideExperience,
  type Map3DGuideMapRuntime,
  type ScenicMapPresentation
} from './Map3DGuidePage'
import '../styles/map/mapBrowseMobile.css'
import '../styles/map/mapV2Preview.css'

const previewGuideState = {
  viewMode: 'browse',
  xiaolingMode: 'browse'
} satisfies MapGuideState

const MAP_SERVICE_CATEGORIES = [
  { id: 'restroom', label: '洗手间', icon: '/icons/svc-accessible.png' },
  { id: 'rest', label: '休息区', icon: '/icons/svc-center.png' },
  { id: 'dining', label: '餐饮点', icon: '/icons/cat-food.png' },
  { id: 'exit', label: '出口', icon: '/icons/cat-transport.png' }
] as const

const MAP_SERVICE_CONTENT: Record<(typeof MAP_SERVICE_CATEGORIES)[number]['id'], { title: string; description: string; meta: string }> = {
  restroom: { title: '附近洗手间', description: '根据当前位置展示最近服务点与步行方向。', meta: '最近点位约 180m · 步行约 3 分钟' },
  rest: { title: '沿途休息区', description: '结合当前路线与游览节奏，推荐顺路停留的位置。', meta: '前方 2 处 · 均在路线附近' },
  dining: { title: '餐饮与补给', description: '查看附近餐饮、茶饮和简单补给的开放状态。', meta: '附近 3 处 · 营业状态待接入' },
  exit: { title: '最近出口', description: '根据当前位置提示最近出口和建议返程方向。', meta: '南门出口 · 约 12 分钟' }
}

function focusMap(runtime: Map3DGuideMapRuntime | null, location?: { lat: number; lng: number }) {
  if (!runtime || !location) return false
  try {
    const center = new runtime.TMap.LatLng(location.lat, location.lng)
    if (runtime.map.easeTo) runtime.map.easeTo({ center, zoom: 18.2, duration: 650 })
    else {
      runtime.map.setCenter?.(center)
      runtime.map.setZoom?.(18.2)
    }
    return true
  } catch {
    return false
  }
}

function Map3DGuideV2PreviewPage() {
  const navigate = useNavigate()
  const [presentation, setPresentation] = useState<ScenicMapPresentation>('ink2d')
  const [runtime, setRuntime] = useState<Map3DGuideMapRuntime | null>(null)
  const [selectedRouteId, setSelectedRouteId] = useState('highlights_checkin')
  const [routePickerOpen, setRoutePickerOpen] = useState(false)
  const [layerPanelOpen, setLayerPanelOpen] = useState(false)
  const [serviceOpen, setServiceOpen] = useState(false)
  const [serviceCategory, setServiceCategory] = useState<(typeof MAP_SERVICE_CATEGORIES)[number]['id']>('restroom')
  const [assistantOpen, setAssistantOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null)

  const route = useMemo(
    () => scenicRouteConfigs.find((item) => item.id === selectedRouteId) ?? scenicRouteConfigs[0],
    [selectedRouteId]
  )
  const previewStops = route.stops.filter((stop) => stop.poiId).slice(0, 5)
  const selectedStop = route.stops.find((stop) => (stop.poiId ?? stop.id) === selectedPoiId)
  const selectedGuideSpot = guideSpots.find((spot) => spot.id === selectedStop?.id)

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 1800)
    return () => window.clearTimeout(timer)
  }, [notice])

  const chooseRoute = (nextRoute: ScenicRouteConfig) => {
    setSelectedRouteId(nextRoute.id)
    setSelectedPoiId(null)
    setRoutePickerOpen(false)
    focusMap(runtime, nextRoute.stops.find((stop) => stop.location)?.location)
    setNotice(`已切换为${nextRoute.name}`)
  }

  const locate = () => {
    setNotice(focusMap(runtime, scenicCenter) ? '已回到景区中心位置' : '地图定位准备中')
  }

  return (
    <div className="map-v2-preview c-app-root">
      <Map3DGuideExperience
        variant="prototype-c"
        guideState={previewGuideState}
        presentation={presentation}
        onMapRuntimeChange={setRuntime}
      />

      <div className={`map-v2-overlay ${serviceOpen ? 'has-service-sheet' : ''}`} aria-label="地图导览 UI V2 本地预览">
        <header className="map-v2-topbar">
          <button type="button" className="map-v2-round-button" aria-label="返回 V2 首页" onClick={() => navigate('/home-v2')}>
            <ArrowLeftOutlined />
          </button>
          <div className="map-v2-brand"><span>灵山胜境</span><strong>地图导览</strong></div>
          <span className="map-v2-status"><i /> 游园中</span>
        </header>

        <div className="map-v2-location-chip">
          <EnvironmentOutlined />
          <span><small>当前位置</small><strong>胜境广场附近</strong></span>
        </div>

        <MapMobileToolRail
          side="right"
          className="map-v2-tools map-v2-plaque-toolrail"
          ariaLabel="地图工具牌匾"
          items={[
            { id: 'locate', label: '定位', icon: '⌖', onClick: locate },
            {
              id: '3d',
              label: '3D',
              icon: '◆',
              active: presentation === 'scenic3d',
              onClick: () => setPresentation((current) => current === 'ink2d' ? 'scenic3d' : 'ink2d')
            },
            {
              id: 'service',
              label: '服务',
              icon: '⌂',
              active: serviceOpen,
              expanded: serviceOpen,
              onClick: () => {
                setLayerPanelOpen(false)
                setServiceOpen(true)
              }
            },
            {
              id: 'layers',
              label: '图层',
              icon: '▧',
              active: layerPanelOpen,
              expanded: layerPanelOpen,
              onClick: () => setLayerPanelOpen((open) => !open)
            }
          ]}
        />
        <MapLayerPanel open={layerPanelOpen} className="map-v2-layer-panel" />
        {serviceOpen ? (
          <CAppBottomSheet
            title="游园服务"
            eyebrow="灵山行旅 · 便民指引"
            onClose={() => setServiceOpen(false)}
            className="map-v2-service-sheet"
            closeLabel="收起"
          >
            <p className="map-v2-service-sheet__intro">选择一项服务，地图将结合你的位置和当前路线给出附近建议。</p>
            <MarketCategoryTabs
              items={MAP_SERVICE_CATEGORIES.map((item) => ({ ...item }))}
              value={serviceCategory}
              onChange={(id) => setServiceCategory(id as (typeof MAP_SERVICE_CATEGORIES)[number]['id'])}
              ariaLabel="游园服务分类"
              className="map-v2-service-tabs"
            />
            <section className="map-v2-service-sheet__result" aria-live="polite">
              <span>当前服务</span>
              <h3>{MAP_SERVICE_CONTENT[serviceCategory].title}</h3>
              <p>{MAP_SERVICE_CONTENT[serviceCategory].description}</p>
              <small>{MAP_SERVICE_CONTENT[serviceCategory].meta}</small>
              <button type="button" onClick={() => setNotice('服务点位导航能力建设中')}>在地图中查看</button>
            </section>
          </CAppBottomSheet>
        ) : null}

        <section className="map-v2-route-dock" aria-label="当前游览路线">
          <div className="map-v2-route-dock__head">
            <span className="map-v2-route-seal">小灵<br />推荐</span>
            <button type="button" className="map-v2-route-summary" onClick={() => setRoutePickerOpen(true)}>
              <small>今日路线 · {route.theme}</small>
              <strong>{route.name}</strong>
              <span>{route.subtitle} · {route.stops.length} 站 · {route.guideRoute.walkIntensity}</span>
            </button>
            <button
              className="map-v2-route-enter"
              type="button"
              aria-label={`进入${route.name}`}
              onClick={() => navigate(`/map-3d-guide-c/route/${encodeURIComponent(route.id)}`)}
            >
              <RightOutlined />
            </button>
          </div>

          <div className="map-v2-poi-strip" aria-label="路线景点，可横向滑动">
            {previewStops.map((stop, index) => {
              const poiId = stop.poiId ?? stop.id
              const media = getPoiMedia(poiId)
              return (
                <button
                  type="button"
                  key={`${route.id}-${poiId}`}
                  className={selectedPoiId === poiId ? 'is-selected' : ''}
                  onClick={() => {
                    setSelectedPoiId(poiId)
                    focusMap(runtime, stop.location)
                  }}
                >
                  <img src={media.thumbnail ?? media.cover} alt="" />
                  <span><small>{String(index + 1).padStart(2, '0')}</small><strong>{stop.name}</strong></span>
                </button>
              )
            })}
          </div>
        </section>

        <div className={`map-v2-assistant-note ${assistantOpen ? 'is-open' : ''}`} role="status">
          <small>小灵随行</small>
          <strong>{selectedStop ? `已为你定位到${selectedStop.name}` : '前方是经典地标密集区'}</strong>
          <p>{selectedStop?.narrative ?? '沿精华路线前行约 6 分钟，可到九龙灌浴。要我边走边讲吗？'}</p>
          <button type="button" onClick={() => setAssistantOpen(false)}>收起</button>
        </div>
        <button
          type="button"
          className={`map-v2-assistant ${assistantOpen ? 'is-active' : ''}`}
          aria-label="打开小灵随行提示"
          aria-expanded={assistantOpen}
          onClick={() => setAssistantOpen((open) => !open)}
        >
          <XiaolingAvatar size="floating" />
          <span>问小灵</span>
        </button>

        {selectedStop ? (
          <section className="map-v2-poi-peek" aria-label={`${selectedStop.name}景点预览`}>
            <img src={getPoiMedia(selectedStop.poiId ?? selectedStop.id).cover} alt="" />
            <div>
              <small>路线景点 · 建议停留 {selectedGuideSpot?.stayMinutes ?? 15} 分钟</small>
              <strong>{selectedStop.name}</strong>
              <p>{selectedStop.narrative}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/map-3d-guide-c/poi/${encodeURIComponent(selectedStop.poiId ?? selectedStop.id)}?from=browse&presentation=${presentation}`)}
            >
              进入景点 <RightOutlined />
            </button>
            <button type="button" className="map-v2-poi-peek__close" aria-label="关闭景点预览" onClick={() => setSelectedPoiId(null)}>×</button>
          </section>
        ) : null}

        {routePickerOpen ? (
          <div className="map-v2-sheet-layer" role="presentation" onPointerDown={() => setRoutePickerOpen(false)}>
            <section className="map-v2-route-sheet" role="dialog" aria-modal="true" aria-labelledby="map-v2-route-title" onPointerDown={(event) => event.stopPropagation()}>
              <i className="map-v2-sheet-handle" aria-hidden="true" />
              <small>小灵路线笺</small>
              <h2 id="map-v2-route-title">选一条适合今天的路线</h2>
              <p>路线会同步景点顺序与地图视野，本地预览不会写入正式行程。</p>
              <div className="map-v2-route-list">
                {scenicRouteConfigs.map((item, index) => (
                  <button key={item.id} type="button" className={item.id === route.id ? 'is-selected' : ''} onClick={() => chooseRoute(item)}>
                    <i>{String(index + 1).padStart(2, '0')}</i>
                    <span><strong>{item.name}</strong><small>{item.subtitle} · {item.stops.length} 站 · {item.guideRoute.walkIntensity}</small></span>
                    <em>{item.id === route.id ? '当前' : '选择'}</em>
                  </button>
                ))}
              </div>
            </section>
          </div>
        ) : null}

        <nav className="map-v2-tabbar" aria-label="V2 原型底部导航">
          {[
            ['导览', '/home-v2', '/icons/tab-home.png'],
            ['地图', '', '/icons/tab-map.png'],
            ['小灵', 'assistant', '/icons/lingshan-guide-avatar.png'],
            ['消费', '/consume-v2', '/icons/tab-shop.png'],
            ['我的', 'notice', '/icons/tab-me.png']
          ].map(([label, action, icon]) => (
            <button
              key={label}
              type="button"
              className={`${label === '地图' ? 'is-active' : ''} ${label === '小灵' ? 'is-xiaoling' : ''}`}
              onClick={() => {
                if (action === 'assistant') setAssistantOpen(true)
                else if (action === 'notice' || !action) setNotice(label === '地图' ? '当前已在地图导览' : '个人中心沿用现有页面')
                else navigate(action)
              }}
            >
              <img src={icon} alt="" /><span>{label}</span>
            </button>
          ))}
        </nav>

        {notice ? <div className="map-v2-toast" role="status">{notice}</div> : null}
      </div>
    </div>
  )
}

export default Map3DGuideV2PreviewPage
