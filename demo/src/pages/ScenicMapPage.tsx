import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDemoTicker } from '../hooks/useDemoTicker'
import {
  buildAdminDemoFrame,
  createSeededRandom,
  getAdminDemoSessionStartedAtMs,
  toDemoTick,
} from '../lib/adminDemoTimeline'
import { loadTMap } from '../lib/loadTMap'
import {
  createCrowdAgents,
  LINGSHAN_CENTER,
  LINGSHAN_CROWD_SPOTS,
  tickCrowdAgents,
  toTencentHeatData,
  type CrowdAgent,
  type LiveUserPoint,
  type TencentHeatPoint,
} from '../lib/liveLocation'
import '../styles/heatmap.css'

type MapStatus = 'loading' | 'ready' | 'error'

type LiveUserRecord = LiveUserPoint & {
  seenAt: number
}

type SpotLoad = {
  id: string
  name: string
  score: number
  level: number
}

type DashboardState = {
  onlineCount: number
  heatPoints: number
  tickCount: number
  lastUpdatedAt: string
  spotLoads: SpotLoad[]
}

const CROWD_SIZE = 500
const LIVE_USER_TTL_MS = 20_000
const HOT_SPOT_RADIUS_DEGREES = 0.0018

const initialAgents = createCrowdAgents(CROWD_SIZE, createSeededRandom(20260715))

const initialDashboard: DashboardState = {
  onlineCount: CROWD_SIZE,
  heatPoints: CROWD_SIZE,
  tickCount: 0,
  lastUpdatedAt: formatTime(new Date()),
  spotLoads: calculateSpotLoads(initialAgents, []),
}

const heatGradientColor = {
  0: '#3c82ff',
  0.2: '#00d2c8',
  0.42: '#78e65a',
  0.64: '#ffd746',
  0.82: '#ff7828',
  1: '#e62828',
}

const spotMarkerIcon = createSvgDataUri(`
  <svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="14" fill="#fff8ea" stroke="#7b5729" stroke-width="2"/>
    <circle cx="22" cy="22" r="6" fill="#e8ae16"/>
  </svg>
`)

function ScenicMapPage() {
  const mapElementRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<any>(null)
  const heatLayerRef = useRef<any>(null)
  const spotLayerRef = useRef<any>(null)
  const agentsRef = useRef<CrowdAgent[]>(initialAgents)
  const liveUsersRef = useRef<Map<string, LiveUserRecord>>(new Map())
  const heatDataSetterRef = useRef<((data: TencentHeatPoint[]) => void) | null>(null)

  const [mapStatus, setMapStatus] = useState<MapStatus>('loading')
  const [statusMessage, setStatusMessage] = useState('正在加载腾讯地图与热力服务...')
  const [dashboard, setDashboard] = useState<DashboardState>(initialDashboard)
  const [demoSessionStartedAtMs] = useState(() => getAdminDemoSessionStartedAtMs())
  const demoTick = useDemoTicker(true)

  useEffect(() => {
    let isCancelled = false

    async function initTencentHeatmap() {
      if (!mapElementRef.current) {
        return
      }

      try {
        const TMap = await loadTMap()

        if (isCancelled || !mapElementRef.current) {
          return
        }

        const center = new TMap.LatLng(LINGSHAN_CENTER.lat, LINGSHAN_CENTER.lng)
        const map = new TMap.Map(mapElementRef.current, {
          center,
          zoom: 14.2,
          pitch: 0,
          rotation: 0,
        })
        mapRef.current = map

        spotLayerRef.current = new TMap.MultiMarker({
          map,
          styles: {
            scenic: new TMap.MarkerStyle({
              width: 24,
              height: 24,
              anchor: { x: 12, y: 12 },
              src: spotMarkerIcon,
            }),
          },
          geometries: LINGSHAN_CROWD_SPOTS.map((spot) => ({
            id: spot.id,
            styleId: 'scenic',
            position: new TMap.LatLng(spot.lat, spot.lng),
            properties: {
              title: spot.name,
            },
          })),
        })

        const initialHeatData = toTencentHeatData(agentsRef.current, getFreshLiveUsers(liveUsersRef.current))
        const heatLayer = createTencentHeatLayer(TMap, map, initialHeatData)
        heatLayerRef.current = heatLayer
        heatDataSetterRef.current = createHeatDataSetter(heatLayer)
        heatDataSetterRef.current(initialHeatData)

        setDashboard(buildDashboard(agentsRef.current, liveUsersRef.current, 0))
        setMapStatus('ready')
        setStatusMessage('腾讯地图热力服务已连接。')
      } catch (error) {
        const message = error instanceof Error ? error.message : '腾讯地图服务初始化失败。'
        setMapStatus('error')
        setStatusMessage(message)
      }
    }

    void initTencentHeatmap()

    return () => {
      isCancelled = true
      removeTencentLayer(heatLayerRef.current)
      removeTencentLayer(spotLayerRef.current)
      mapRef.current?.destroy?.()
      mapRef.current = null
      heatLayerRef.current = null
      spotLayerRef.current = null
      heatDataSetterRef.current = null
    }
  }, [])

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    const channel = new BroadcastChannel('lingshan-live')

    channel.onmessage = (event) => {
      const point = normalizeLiveUserPoint(event.data)

      if (!point) {
        return
      }

      liveUsersRef.current.set(point.id, {
        ...point,
        seenAt: Date.now(),
      })
    }

    return () => {
      channel.close()
    }
  }, [])

  useEffect(() => {
    if (mapStatus !== 'ready') {
      return
    }

    agentsRef.current = tickCrowdAgents(agentsRef.current, createSeededRandom(demoTick))
    pruneLiveUsers(liveUsersRef.current)

    const freshLiveUsers = getFreshLiveUsers(liveUsersRef.current)
    const heatData = toTencentHeatData(agentsRef.current, freshLiveUsers)
    const frame = buildAdminDemoFrame(demoTick, {
      activeWindowMinutes: 5,
      sessionStartedAtMs: demoSessionStartedAtMs,
    })
    heatDataSetterRef.current?.(heatData)
    setDashboard({
      onlineCount: CROWD_SIZE + (frame.activeSessions - 43) + freshLiveUsers.length,
      heatPoints: heatData.length,
      tickCount: Math.max(0, demoTick - toDemoTick(demoSessionStartedAtMs)),
      lastUpdatedAt: formatTime(new Date(frame.generatedAtMs)),
      spotLoads: frame.spotLoads,
    })
  }, [demoSessionStartedAtMs, demoTick, mapStatus])

  return (
    <main className="heatmap-page">
      <div ref={mapElementRef} className="heatmap-map" aria-label="灵山胜境腾讯地图客流热力图" />

      <header className="heatmap-topbar" aria-label="客流热力概览">
        <div className="heatmap-title-group">
          <span className="heatmap-kicker">Tencent Maps Live Layer</span>
          <h1>灵山客流热力</h1>
          <p>Lingshan Live Crowd Heatmap</p>
        </div>

        <div className="heatmap-top-actions">
          <Link className="heatmap-back-link" to="/admin">
            返回大屏
          </Link>

          <div className="online-card" aria-live="polite">
            <span>实时在线</span>
            <strong>{dashboard.onlineCount}</strong>
            <small>人</small>
          </div>
        </div>
      </header>

      <aside className="heatmap-side-panel" aria-label="热点排行">
        <div className="side-heading">
          <span>Hotspots</span>
          <strong>景点拥挤度</strong>
        </div>

        <div className="spot-load-list">
          {dashboard.spotLoads.map((spot) => (
            <div className="spot-load-row" key={spot.id}>
              <div>
                <span>{spot.name}</span>
                <small>热度 {spot.score}</small>
              </div>
              <meter min={0} max={100} value={spot.level} aria-label={`${spot.name} 拥挤度`} />
            </div>
          ))}
        </div>

        <div className="service-status">
          <span className={`service-dot ${mapStatus === 'ready' ? 'is-ready' : ''}`} />
          <span>{statusMessage}</span>
        </div>
      </aside>

      <footer className="heatmap-legend" aria-label="客流密度图例">
        <span>疏</span>
        <div className="legend-bar" />
        <span>密</span>
      </footer>

      <div className="heatmap-ticker" aria-label="实时刷新信息">
        <span>刷新 {dashboard.tickCount}</span>
        <span>{dashboard.heatPoints} 个热力点</span>
        <span>{dashboard.lastUpdatedAt}</span>
      </div>

      {mapStatus !== 'ready' ? (
        <div className="heatmap-status-overlay" aria-live="polite">
          <div className="heatmap-status-card">
            <h2>{mapStatus === 'error' ? '腾讯地图热力服务不可用' : '正在连接腾讯地图服务'}</h2>
            <p>{statusMessage}</p>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default ScenicMapPage

function createTencentHeatLayer(TMap: any, map: any, data: TencentHeatPoint[]) {
  if (!TMap.visualization?.Heat) {
    throw new Error('腾讯地图 visualization 热力库不可用，请刷新页面重新加载完整 SDK。')
  }

  const layer = new TMap.visualization.Heat({
    map,
    data,
    min: 0,
    max: 12,
    height: 0,
    radius: 48,
    opacity: 0.84,
    gradientColor: heatGradientColor,
    enableAggregation: true,
  })

  layer?.addTo?.(map)
  layer?.setMap?.(map)

  return layer
}

function createHeatDataSetter(layer: any) {
  let preferredMode: 'array' | 'object' = 'array'

  return (data: TencentHeatPoint[]) => {
    const setData = layer?.setData ?? layer?.updateData

    if (!setData) {
      return
    }

    if (preferredMode === 'array') {
      try {
        setData.call(layer, data)
        return
      } catch {
        preferredMode = 'object'
      }
    }

    setData.call(layer, { data })
  }
}

function removeTencentLayer(layer: any) {
  layer?.remove?.()
  layer?.setMap?.(null)
  layer?.destroy?.()
}

function buildDashboard(
  agents: CrowdAgent[],
  liveUsers: Map<string, LiveUserRecord>,
  tickCount: number,
): DashboardState {
  const freshLiveUsers = getFreshLiveUsers(liveUsers)

  return {
    onlineCount: agents.length + freshLiveUsers.length,
    heatPoints: agents.length + freshLiveUsers.length,
    tickCount,
    lastUpdatedAt: formatTime(new Date()),
    spotLoads: calculateSpotLoads(agents, freshLiveUsers),
  }
}

function calculateSpotLoads(agents: CrowdAgent[], liveUsers: LiveUserPoint[]): SpotLoad[] {
  const loads = LINGSHAN_CROWD_SPOTS.map((spot) => {
    const agentScore = agents.reduce((score, agent) => {
      const distance = Math.hypot(agent.lng - spot.lng, agent.lat - spot.lat)
      return distance <= HOT_SPOT_RADIUS_DEGREES ? score + agent.weight : score
    }, 0)
    const liveScore = liveUsers.reduce((score, point) => {
      const distance = Math.hypot(point.lng - spot.lng, point.lat - spot.lat)
      return distance <= HOT_SPOT_RADIUS_DEGREES ? score + 10 : score
    }, 0)
    const score = Math.round(agentScore + liveScore)

    return {
      id: spot.id,
      name: spot.name,
      score,
      level: Math.min(100, Math.round(score * 3.2)),
    }
  })

  return loads.sort((a, b) => b.score - a.score)
}

function pruneLiveUsers(liveUsers: Map<string, LiveUserRecord>) {
  const now = Date.now()

  for (const [id, point] of liveUsers) {
    if (now - point.seenAt > LIVE_USER_TTL_MS) {
      liveUsers.delete(id)
    }
  }
}

function getFreshLiveUsers(liveUsers: Map<string, LiveUserRecord>) {
  const now = Date.now()

  return Array.from(liveUsers.values())
    .filter((point) => now - point.seenAt <= LIVE_USER_TTL_MS)
    .map(({ id, lng, lat }) => ({ id, lng, lat }))
}

function normalizeLiveUserPoint(value: unknown): LiveUserPoint | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const lng = Number(record.lng)
  const lat = Number(record.lat)

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null
  }

  return {
    id: String(record.id ?? 'live-user'),
    lng,
    lat,
  }
}

function createSvgDataUri(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function formatTime(date: Date) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date)
}
