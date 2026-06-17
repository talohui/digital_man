import type { LatLngPoint } from './guideData'
import { LINGSHAN_MANUAL_TREE_ASSETS, LINGSHAN_MANUAL_TREE_ASSET_STATS } from './lingshanMap3DManualTreeAssets'

export type Map3DGardenAssetKind =
  | 'pine_cluster'
  | 'mixed_grove'
  | 'bamboo_grove'
  | 'shrub_mass'
  | 'forest_edge'
  | 'rock_cluster'
  | 'stone_mass'
  | 'fluffy_bodhi_grove'
  | 'fluffy_round_tree'
  | 'bushy_canopy_tree'
  | 'dense_shrub_cluster'
  | 'soft_forest_clump'
  | 'fluffy_tree_mix'

export type Map3DGardenAssetPriority = 'low' | 'medium' | 'high'

export type LingshanMap3DGardenAsset = {
  id: string
  zoneId?: string
  kind: Map3DGardenAssetKind
  name: string
  assetUrl: string
  location: LatLngPoint
  scale: number
  height: number
  yaw: number
  opacity: number
  visible: boolean
  priority: Map3DGardenAssetPriority
  routeFraction: number
  licenseId: string
  note?: string
}

export type LingshanMap3DForestPatch = {
  id: string
  name: string
  center: LatLngPoint
  radiusX: number
  radiusY: number
  rotation: number
  color: string
  opacity: number
  visible: boolean
  priority: Map3DGardenAssetPriority
  routeFraction: number
  note?: string
}

type VegetationZone = {
  id: string
  name: string
  center: LatLngPoint
  radiusX: number
  radiusY: number
  rotation: number
  count: number
  routeFraction: [number, number]
  scale: [number, number]
  height: [number, number]
  opacity: [number, number]
  priority: Map3DGardenAssetPriority
  assetPool: Map3DGardenAssetKind[]
  keepoutScale?: number
  note: string
}

type KeepoutCircle = {
  id: string
  center: LatLngPoint
  radius: number
  note: string
}

const vendorAssetBaseUrl = '/assets/map-3d-guide/glb-garden/vendor'
const treeCandidateAssetBaseUrl = '/models/lingshan/tree-candidates'
const kenneyNatureKitLicenseId = 'kenney-nature-kit-cc0'

const gardenAssetUrls: Record<Map3DGardenAssetKind, string> = {
  pine_cluster: `${vendorAssetBaseUrl}/kenney_tree_pine_tall_a_sage.glb`,
  mixed_grove: `${vendorAssetBaseUrl}/kenney_tree_default_dark_sage.glb`,
  bamboo_grove: `${vendorAssetBaseUrl}/kenney_tree_pine_round_c_sage.glb`,
  shrub_mass: `${vendorAssetBaseUrl}/kenney_bush_detailed_sage.glb`,
  forest_edge: `${vendorAssetBaseUrl}/kenney_tree_pine_round_c_sage.glb`,
  rock_cluster: `${vendorAssetBaseUrl}/kenney_rock_large_c_sage.glb`,
  stone_mass: `${vendorAssetBaseUrl}/kenney_rock_tall_h_sage.glb`,
  fluffy_bodhi_grove: `${treeCandidateAssetBaseUrl}/fluffy-bodhi-grove.runtime-v2.glb`,
  fluffy_round_tree: `${treeCandidateAssetBaseUrl}/fluffy-round-tree-a.glb`,
  bushy_canopy_tree: `${treeCandidateAssetBaseUrl}/bushy-canopy-tree-a.glb`,
  dense_shrub_cluster: `${treeCandidateAssetBaseUrl}/dense-shrub-cluster-a.glb`,
  soft_forest_clump: `${treeCandidateAssetBaseUrl}/soft-forest-clump-a.glb`,
  fluffy_tree_mix: `${treeCandidateAssetBaseUrl}/fluffy-round-tree-b.glb`
}

export function getMap3DGardenAssetUrl(kind: Map3DGardenAssetKind) {
  return gardenAssetUrls[kind]
}

export function getMap3DGardenLicenseId() {
  return kenneyNatureKitLicenseId
}

const denseTreePool: Map3DGardenAssetKind[] = [
  'mixed_grove',
  'forest_edge',
  'bamboo_grove',
  'pine_cluster',
  'mixed_grove',
  'forest_edge'
]
const axisTreePool: Map3DGardenAssetKind[] = ['forest_edge', 'pine_cluster', 'bamboo_grove', 'mixed_grove', 'shrub_mass']
const edgeTreePool: Map3DGardenAssetKind[] = ['mixed_grove', 'forest_edge', 'pine_cluster', 'shrub_mass', 'bamboo_grove']
const lowEdgePool: Map3DGardenAssetKind[] = ['shrub_mass', 'shrub_mass', 'pine_cluster', 'rock_cluster', 'stone_mass']
const waterEdgePool: Map3DGardenAssetKind[] = ['forest_edge', 'shrub_mass', 'bamboo_grove', 'rock_cluster', 'mixed_grove']

// The zones are hand-placed from the user's aerial reference: forest mass north of
// the Buddha, continuous belts beside the central axis, and lower vegetation around
// water / plaza edges. They are deterministic and never use Math.random().
export const lingshanMap3DGardenVegetationZones: VegetationZone[] = [
  {
    id: 'buddha-north-mountain',
    name: '大佛背后北侧山体',
    center: { lat: 31.43115, lng: 120.09605 },
    radiusX: 235,
    radiusY: 150,
    rotation: -8,
    count: 31,
    routeFraction: [0.64, 0.74],
    scale: [132, 202],
    height: [9, 16],
    opacity: [0.82, 0.98],
    priority: 'high',
    assetPool: denseTreePool,
    note: '最高密度山林背景，参考航拍图中大佛背后大面积林地。'
  },
  {
    id: 'buddha-west-slope',
    name: '大佛西侧山坡',
    center: { lat: 31.42988, lng: 120.09505 },
    radiusX: 190,
    radiusY: 105,
    rotation: -22,
    count: 16,
    routeFraction: [0.58, 0.72],
    scale: [108, 168],
    height: [5, 10],
    opacity: [0.74, 0.94],
    priority: 'high',
    assetPool: denseTreePool,
    note: '大佛西侧高密林面，避开佛前广场中心。'
  },
  {
    id: 'buddha-east-slope',
    name: '大佛东侧山坡',
    center: { lat: 31.42996, lng: 120.09785 },
    radiusX: 185,
    radiusY: 110,
    rotation: 18,
    count: 16,
    routeFraction: [0.58, 0.73],
    scale: [102, 164],
    height: [5, 10],
    opacity: [0.72, 0.92],
    priority: 'high',
    assetPool: denseTreePool,
    note: '大佛东侧山林与祥符禅寺方向衔接。'
  },
  {
    id: 'buddha-front-edge',
    name: '佛前广场边缘低树',
    center: { lat: 31.42925, lng: 120.09655 },
    radiusX: 140,
    radiusY: 70,
    rotation: -4,
    count: 8,
    routeFraction: [0.55, 0.66],
    scale: [58, 96],
    height: [1, 4],
    opacity: [0.62, 0.82],
    priority: 'low',
    assetPool: lowEdgePool,
    keepoutScale: 1.12,
    note: '佛前广场只在边缘放低树和少量山石，中心留白。'
  },
  {
    id: 'central-axis-west-belt',
    name: '中轴西侧连续林带',
    center: { lat: 31.42635, lng: 120.09825 },
    radiusX: 380,
    radiusY: 58,
    rotation: -28,
    count: 20,
    routeFraction: [0.35, 0.62],
    scale: [86, 144],
    height: [3, 7],
    opacity: [0.64, 0.9],
    priority: 'high',
    assetPool: axisTreePool,
    note: '从九龙灌浴到佛前广场西侧形成连续林带。'
  },
  {
    id: 'central-axis-east-belt',
    name: '中轴东侧连续林带',
    center: { lat: 31.42645, lng: 120.09942 },
    radiusX: 350,
    radiusY: 56,
    rotation: -28,
    count: 17,
    routeFraction: [0.36, 0.62],
    scale: [82, 138],
    height: [3, 7],
    opacity: [0.62, 0.88],
    priority: 'medium',
    assetPool: axisTreePool,
    note: '中轴东侧林带，避开主路线和佛手广场开阔面。'
  },
  {
    id: 'jiulong-west-woodland',
    name: '九龙灌浴西侧林地',
    center: { lat: 31.42495, lng: 120.09935 },
    radiusX: 150,
    radiusY: 90,
    rotation: -20,
    count: 16,
    routeFraction: [0.3, 0.46],
    scale: [70, 122],
    height: [2, 5],
    opacity: [0.62, 0.86],
    priority: 'medium',
    assetPool: edgeTreePool,
    note: '九龙灌浴水景西侧背景林，避开水景中心。'
  },
  {
    id: 'jiulong-east-edge',
    name: '九龙灌浴东侧边缘绿化',
    center: { lat: 31.42475, lng: 120.10088 },
    radiusX: 130,
    radiusY: 70,
    rotation: 14,
    count: 8,
    routeFraction: [0.32, 0.46],
    scale: [46, 88],
    height: [1, 4],
    opacity: [0.54, 0.78],
    priority: 'low',
    assetPool: lowEdgePool,
    note: '九龙灌浴东侧低树和山石，不遮挡站点和重规划线。'
  },
  {
    id: 'shengjing-west-belt',
    name: '胜境广场西侧林带',
    center: { lat: 31.42318, lng: 120.10072 },
    radiusX: 180,
    radiusY: 62,
    rotation: -16,
    count: 14,
    routeFraction: [0.15, 0.32],
    scale: [62, 112],
    height: [2, 5],
    opacity: [0.58, 0.84],
    priority: 'medium',
    assetPool: axisTreePool,
    note: '胜境广场西侧边缘树带，广场中心留白。'
  },
  {
    id: 'shengjing-east-belt',
    name: '胜境广场东侧林带',
    center: { lat: 31.42328, lng: 120.10222 },
    radiusX: 160,
    radiusY: 56,
    rotation: 12,
    count: 8,
    routeFraction: [0.16, 0.34],
    scale: [56, 102],
    height: [1, 4],
    opacity: [0.56, 0.8],
    priority: 'medium',
    assetPool: axisTreePool,
    note: '胜境广场东侧边缘绿化，保持中轴和广场开阔。'
  },
  {
    id: 'xiangfu-temple-edges',
    name: '祥符禅寺边缘林带',
    center: { lat: 31.42792, lng: 120.09782 },
    radiusX: 170,
    radiusY: 88,
    rotation: 8,
    count: 11,
    routeFraction: [0.68, 0.8],
    scale: [72, 128],
    height: [3, 6],
    opacity: [0.6, 0.86],
    priority: 'medium',
    assetPool: edgeTreePool,
    note: '寺院周边树群，只做边缘背景，不放香炉/屋顶等复杂资产。'
  },
  {
    id: 'fan-gong-edges',
    name: '梵宫边缘庭林',
    center: { lat: 31.42718, lng: 120.10258 },
    radiusX: 205,
    radiusY: 105,
    rotation: -12,
    count: 13,
    routeFraction: [0.78, 0.9],
    scale: [62, 126],
    height: [2, 6],
    opacity: [0.56, 0.82],
    priority: 'medium',
    assetPool: edgeTreePool,
    note: '梵宫建筑和广场边缘树群，建筑主体保持可见。'
  },
  {
    id: 'wuyin-waterfront',
    name: '五印坛城水岸林缘',
    center: { lat: 31.42505, lng: 120.10402 },
    radiusX: 175,
    radiusY: 95,
    rotation: 20,
    count: 13,
    routeFraction: [0.84, 0.95],
    scale: [50, 112],
    height: [1, 5],
    opacity: [0.52, 0.8],
    priority: 'medium',
    assetPool: waterEdgePool,
    note: '五印坛城和水体边缘绿化，避免遮挡圆形建筑主体。'
  },
  {
    id: 'south-gate-buffer',
    name: '南门外侧低密缓冲',
    center: { lat: 31.42055, lng: 120.10248 },
    radiusX: 170,
    radiusY: 72,
    rotation: 0,
    count: 4,
    routeFraction: [0.01, 0.1],
    scale: [44, 86],
    height: [1, 3],
    opacity: [0.48, 0.72],
    priority: 'low',
    assetPool: lowEdgePool,
    note: '南门和停车场边缘只做低密缓冲，不在停车场主区域撒树。'
  },
  {
    id: 'exit-edge-buffer',
    name: '出口边缘收束林带',
    center: { lat: 31.42372, lng: 120.10248 },
    radiusX: 150,
    radiusY: 70,
    rotation: -4,
    count: 4,
    routeFraction: [0.92, 0.99],
    scale: [48, 96],
    height: [1, 4],
    opacity: [0.5, 0.76],
    priority: 'low',
    assetPool: lowEdgePool,
    note: '路线末端边缘收束树群，不遮挡终点。'
  }
]

export const lingshanMap3DForestPatches: LingshanMap3DForestPatch[] = [
  {
    id: 'forest-patch-buddha-north-mountain',
    name: '大佛背后山林底色',
    center: { lat: 31.43112, lng: 120.09612 },
    radiusX: 285,
    radiusY: 178,
    rotation: -9,
    color: '#244f3c',
    opacity: 0.34,
    visible: true,
    priority: 'high',
    routeFraction: 0.69,
    note: '最明显的山林面底色，用于连接大佛背后密集树群。'
  },
  {
    id: 'forest-patch-buddha-west-slope',
    name: '大佛西侧山坡底色',
    center: { lat: 31.4299, lng: 120.09515 },
    radiusX: 210,
    radiusY: 118,
    rotation: -22,
    color: '#2e5d42',
    opacity: 0.26,
    visible: true,
    priority: 'high',
    routeFraction: 0.64,
    note: '大佛西侧山坡连续底色，弱于北侧山体。'
  },
  {
    id: 'forest-patch-buddha-east-slope',
    name: '大佛东侧山坡底色',
    center: { lat: 31.42992, lng: 120.09768 },
    radiusX: 205,
    radiusY: 116,
    rotation: 18,
    color: '#315f45',
    opacity: 0.25,
    visible: true,
    priority: 'high',
    routeFraction: 0.65,
    note: '大佛东侧山坡与祥符禅寺方向衔接。'
  },
  {
    id: 'forest-patch-central-axis-west',
    name: '中轴西侧林带底色',
    center: { lat: 31.42625, lng: 120.09834 },
    radiusX: 410,
    radiusY: 72,
    rotation: -28,
    color: '#3e6d4e',
    opacity: 0.2,
    visible: true,
    priority: 'medium',
    routeFraction: 0.49,
    note: '中轴西侧连续林带底色，保持主路留白。'
  },
  {
    id: 'forest-patch-central-axis-east',
    name: '中轴东侧林带底色',
    center: { lat: 31.42632, lng: 120.09948 },
    radiusX: 380,
    radiusY: 68,
    rotation: -28,
    color: '#426f51',
    opacity: 0.18,
    visible: true,
    priority: 'medium',
    routeFraction: 0.5,
    note: '中轴东侧较淡林带底色，不抢主路线。'
  },
  {
    id: 'forest-patch-jiulong-west',
    name: '九龙西侧林地底色',
    center: { lat: 31.42492, lng: 120.09948 },
    radiusX: 174,
    radiusY: 104,
    rotation: -20,
    color: '#496f52',
    opacity: 0.18,
    visible: true,
    priority: 'medium',
    routeFraction: 0.38,
    note: '九龙灌浴西侧林地底色，水景核心继续留白。'
  },
  {
    id: 'forest-patch-xiangfu-edge',
    name: '祥符禅寺边缘底色',
    center: { lat: 31.42788, lng: 120.09795 },
    radiusX: 190,
    radiusY: 96,
    rotation: 8,
    color: '#3b6549',
    opacity: 0.17,
    visible: true,
    priority: 'medium',
    routeFraction: 0.74,
    note: '寺院建筑边缘底色，建筑主体由 keepout 留白。'
  },
  {
    id: 'forest-patch-fan-gong-edge',
    name: '梵宫边缘庭林底色',
    center: { lat: 31.42712, lng: 120.10258 },
    radiusX: 220,
    radiusY: 116,
    rotation: -12,
    color: '#4a7253',
    opacity: 0.16,
    visible: true,
    priority: 'medium',
    routeFraction: 0.84,
    note: '梵宫周边中低透明林地底色。'
  },
  {
    id: 'forest-patch-wuyin-waterfront',
    name: '五印坛城水岸底色',
    center: { lat: 31.42508, lng: 120.10396 },
    radiusX: 188,
    radiusY: 102,
    rotation: 20,
    color: '#4e7357',
    opacity: 0.14,
    visible: true,
    priority: 'medium',
    routeFraction: 0.9,
    note: '水岸边缘淡色底色，不遮挡坛城圆形主体。'
  }
]

const routeKeepoutPath: LatLngPoint[] = [
  { lat: 31.42062, lng: 120.10252 },
  { lat: 31.42155, lng: 120.10242 },
  { lat: 31.42318, lng: 120.10154 },
  { lat: 31.42455, lng: 120.10026 },
  { lat: 31.42635, lng: 120.09886 },
  { lat: 31.42805, lng: 120.09762 },
  { lat: 31.42962, lng: 120.0965 },
  { lat: 31.4305, lng: 120.09608 },
  { lat: 31.4281, lng: 120.09784 },
  { lat: 31.42718, lng: 120.10208 },
  { lat: 31.42512, lng: 120.10376 },
  { lat: 31.42392, lng: 120.10262 }
]

export const lingshanMap3DGardenKeepouts: KeepoutCircle[] = [
  {
    id: 'south-gate-axis',
    center: { lat: 31.42095, lng: 120.1025 },
    radius: 38,
    note: '南门中轴入口留白。'
  },
  {
    id: 'shengjing-square-open',
    center: { lat: 31.42328, lng: 120.10152 },
    radius: 86,
    note: '胜境广场中心留白。'
  },
  {
    id: 'jiulong-water-open',
    center: { lat: 31.42455, lng: 120.10028 },
    radius: 92,
    note: '九龙灌浴水景和表演核心留白。'
  },
  {
    id: 'foqian-square-open',
    center: { lat: 31.42952, lng: 120.09642 },
    radius: 105,
    note: '佛前广场和大佛 marker 周边留白。'
  },
  {
    id: 'xiangfu-temple-building',
    center: { lat: 31.42786, lng: 120.0978 },
    radius: 62,
    note: '祥符禅寺建筑主体上方不放树。'
  },
  {
    id: 'fan-gong-building',
    center: { lat: 31.42718, lng: 120.1021 },
    radius: 86,
    note: '梵宫主体和广场留白。'
  },
  {
    id: 'wuyin-building',
    center: { lat: 31.42472, lng: 120.1042 },
    radius: 76,
    note: '五印坛城圆形建筑主体留白。'
  },
  {
    id: 'parking-south-main',
    center: { lat: 31.41968, lng: 120.10282 },
    radius: 90,
    note: '南侧停车场主区域不放树。'
  }
]

function gardenAsset(input: Omit<LingshanMap3DGardenAsset, 'assetUrl' | 'licenseId' | 'visible'>): LingshanMap3DGardenAsset {
  return {
    ...input,
    assetUrl: gardenAssetUrls[input.kind],
    visible: true,
    licenseId: kenneyNatureKitLicenseId
  }
}

function buildZoneAssets(zone: VegetationZone): LingshanMap3DGardenAsset[] {
  const assets: LingshanMap3DGardenAsset[] = []
  const seed = hashString(zone.id)
  let attempt = 0
  const maxAttempts = zone.count * 16

  while (assets.length < zone.count && attempt < maxAttempts) {
    const point = sampleZonePoint(zone, seed, attempt)
    attempt += 1

    if (!isPointAllowed(point, zone.keepoutScale ?? 1)) {
      continue
    }

    const index = assets.length
    const kind = zone.assetPool[(seed + attempt + index) % zone.assetPool.length]
    const scale = roundNumber(lerp(zone.scale[0], zone.scale[1], seeded01(seed, attempt, 11)), 0)
    const height = roundNumber(lerp(zone.height[0], zone.height[1], seeded01(seed, attempt, 23)), 1)
    const yaw = roundNumber(-180 + seeded01(seed, attempt, 31) * 360, 0)
    const opacity = roundNumber(lerp(zone.opacity[0], zone.opacity[1], seeded01(seed, attempt, 43)), 2)
    const routeFraction = roundNumber(lerp(zone.routeFraction[0], zone.routeFraction[1], zone.count <= 1 ? 0 : index / (zone.count - 1)), 3)

    assets.push(
      gardenAsset({
        id: `c-zone-${zone.id}-${String(index + 1).padStart(2, '0')}`,
        zoneId: zone.id,
        kind,
        name: `${zone.name}${index + 1}`,
        location: {
          lat: roundNumber(point.lat, 6),
          lng: roundNumber(point.lng, 6)
        },
        scale,
        height,
        yaw,
        opacity,
        priority: zone.priority,
        routeFraction,
        note: `${zone.note} 由 deterministic vegetation zone 生成。`
      })
    )
  }

  return assets
}

function sampleZonePoint(zone: VegetationZone, seed: number, attempt: number): LatLngPoint {
  const radiusSeed = ((attempt * 73 + seed * 17) % 997) / 997
  const radius = Math.sqrt(Math.max(0.02, radiusSeed))
  const angle = ((attempt * 137.507764 + seed * 0.61803398875) % 360) * (Math.PI / 180)
  const x = Math.cos(angle) * radius * zone.radiusX
  const y = Math.sin(angle) * radius * zone.radiusY
  const rotation = zone.rotation * (Math.PI / 180)
  const rotatedX = x * Math.cos(rotation) - y * Math.sin(rotation)
  const rotatedY = x * Math.sin(rotation) + y * Math.cos(rotation)

  return offsetMeters(zone.center, rotatedX, rotatedY)
}

function isPointAllowed(point: LatLngPoint, keepoutScale: number) {
  if (distanceToPolylineMeters(point, routeKeepoutPath) < 29) {
    return false
  }

  return !lingshanMap3DGardenKeepouts.some((keepout) => {
    return haversineDistanceMeters(point, keepout.center) < keepout.radius * keepoutScale
  })
}

function offsetMeters(origin: LatLngPoint, eastMeters: number, northMeters: number): LatLngPoint {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos(origin.lat * (Math.PI / 180))

  return {
    lat: origin.lat + northMeters / metersPerDegreeLat,
    lng: origin.lng + eastMeters / metersPerDegreeLng
  }
}

function hashString(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash)
}

function seeded01(seed: number, index: number, salt: number) {
  let value = seed ^ Math.imul(index + 1, 0x45d9f3b) ^ Math.imul(salt + 1, 0x27d4eb2d)
  value ^= value >>> 15
  value = Math.imul(value, 0x2c1b3c6d)
  value ^= value >>> 12
  value = Math.imul(value, 0x297a2d39)
  value ^= value >>> 15
  return ((value >>> 0) % 10000) / 10000
}

function lerp(from: number, to: number, ratio: number) {
  return from + (to - from) * ratio
}

function roundNumber(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

function haversineDistanceMeters(a: LatLngPoint, b: LatLngPoint) {
  const earthRadiusMeters = 6_371_000
  const toRadians = (value: number) => (value * Math.PI) / 180
  const dLat = toRadians(b.lat - a.lat)
  const dLng = toRadians(b.lng - a.lng)
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng
  return 2 * earthRadiusMeters * Math.asin(Math.min(1, Math.sqrt(h)))
}

function distanceToPolylineMeters(point: LatLngPoint, path: LatLngPoint[]) {
  if (path.length < 2) {
    return Number.POSITIVE_INFINITY
  }

  let minDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < path.length - 1; index += 1) {
    minDistance = Math.min(minDistance, distanceToSegmentMeters(point, path[index], path[index + 1]))
  }

  return minDistance
}

function distanceToSegmentMeters(point: LatLngPoint, start: LatLngPoint, end: LatLngPoint) {
  const metersPerDegreeLat = 111_320
  const metersPerDegreeLng = 111_320 * Math.cos(point.lat * (Math.PI / 180))
  const px = (point.lng - start.lng) * metersPerDegreeLng
  const py = (point.lat - start.lat) * metersPerDegreeLat
  const ex = (end.lng - start.lng) * metersPerDegreeLng
  const ey = (end.lat - start.lat) * metersPerDegreeLat
  const lengthSquared = ex * ex + ey * ey

  if (!lengthSquared) {
    return Math.sqrt(px * px + py * py)
  }

  const ratio = Math.max(0, Math.min(1, (px * ex + py * ey) / lengthSquared))
  const dx = px - ex * ratio
  const dy = py - ey * ratio
  return Math.sqrt(dx * dx + dy * dy)
}

export const DEFAULT_LINGSHAN_GARDEN_ASSETS_LEGACY: LingshanMap3DGardenAsset[] = lingshanMap3DGardenVegetationZones.flatMap(buildZoneAssets)
export const lingshanMap3DGardenAssetsLegacy = DEFAULT_LINGSHAN_GARDEN_ASSETS_LEGACY
export const lingshanMap3DGardenAssets: LingshanMap3DGardenAsset[] = LINGSHAN_MANUAL_TREE_ASSETS
export const lingshanMap3DGardenAssetStats = LINGSHAN_MANUAL_TREE_ASSET_STATS

export function getDefaultMap3DGardenAssets() {
  return lingshanMap3DGardenAssets.map((asset) => ({
    ...asset,
    location: { ...asset.location }
  }))
}

export function getLegacyMap3DGardenAssets() {
  return lingshanMap3DGardenAssetsLegacy.map((asset) => ({
    ...asset,
    location: { ...asset.location }
  }))
}
