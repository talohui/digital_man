import type { LatLngPoint } from './guideData'
import { scenicCenter } from './guideData'
import { getLingshanRouteGeometryByGuideRouteId } from './lingshanRouteGeometries'

export type Map3DGardenAssetKind =
  | 'pine_cluster'
  | 'rock_cluster'
  | 'stone_steps'
  | 'courtyard_wall'
  | 'arch_bridge'
  | 'temple_roof'
  | 'lotus_pedestal'
  | 'dharma_wheel'
  | 'incense_burner'

export type Map3DGardenAssetPriority = 'low' | 'medium' | 'high'

export type LingshanMap3DGardenAsset = {
  id: string
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

const historicalPath = getLingshanRouteGeometryByGuideRouteId('historical_culture')?.path ?? [scenicCenter]
const assetBaseUrl = '/assets/map-3d-guide/glb-garden'
const projectOwnedFallbackLicense = 'project-owned-lowpoly-fallback'

const assetSpecs: Array<Omit<LingshanMap3DGardenAsset, 'location' | 'licenseId'> & {
  latOffset: number
  lngOffset: number
}> = [
  {
    id: 'c-south-gate-courtyard-wall',
    kind: 'courtyard_wall',
    name: '南门院墙',
    assetUrl: `${assetBaseUrl}/garden_courtyard_wall.glb`,
    routeFraction: 0.04,
    latOffset: -0.00011,
    lngOffset: 0.00013,
    scale: 220,
    height: 8,
    yaw: -12,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '南门入口的低矮院墙感，用于建立入园边界。'
  },
  {
    id: 'c-south-gate-stone-steps',
    kind: 'stone_steps',
    name: '南门石阶',
    assetUrl: `${assetBaseUrl}/garden_stone_steps.glb`,
    routeFraction: 0.065,
    latOffset: 0.0001,
    lngOffset: -0.00008,
    scale: 190,
    height: 5,
    yaw: 22,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '入口轴线旁的石阶低模资产，避免固定屏幕贴片。'
  },
  {
    id: 'c-lingshan-wall-pine',
    kind: 'pine_cluster',
    name: '照壁松群',
    assetUrl: `${assetBaseUrl}/garden_pine_cluster.glb`,
    routeFraction: 0.12,
    latOffset: 0.00015,
    lngOffset: -0.00013,
    scale: 135,
    height: 6,
    yaw: 18,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '照壁段以松群形成沉稳框景。'
  },
  {
    id: 'c-shengjing-rocks',
    kind: 'rock_cluster',
    name: '胜境山石',
    assetUrl: `${assetBaseUrl}/garden_rock_cluster.glb`,
    routeFraction: 0.18,
    latOffset: -0.00012,
    lngOffset: 0.00016,
    scale: 180,
    height: 4,
    yaw: -20,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '胜境广场附近的山石节点，弱化贴纸感。'
  },
  {
    id: 'c-bridge-ink-arch',
    kind: 'arch_bridge',
    name: '游线小桥',
    assetUrl: `${assetBaseUrl}/garden_arch_bridge.glb`,
    routeFraction: 0.28,
    latOffset: -0.00006,
    lngOffset: 0.0002,
    scale: 130,
    height: 4,
    yaw: -18,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '路线水边段的小桥意象，仅作为导览氛围。'
  },
  {
    id: 'c-jiulong-pine-cluster',
    kind: 'pine_cluster',
    name: '九龙树群',
    assetUrl: `${assetBaseUrl}/garden_pine_cluster.glb`,
    routeFraction: 0.36,
    latOffset: 0.00014,
    lngOffset: -0.00012,
    scale: 150,
    height: 6,
    yaw: -24,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '九龙灌浴附近以树群控制视觉密度。'
  },
  {
    id: 'c-approach-stone-steps',
    kind: 'stone_steps',
    name: '登佛石阶',
    assetUrl: `${assetBaseUrl}/garden_stone_steps.glb`,
    routeFraction: 0.47,
    latOffset: 0.00007,
    lngOffset: -0.00015,
    scale: 210,
    height: 7,
    yaw: 28,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '大佛前路径的石阶提示，跟随地图坐标。'
  },
  {
    id: 'c-buddha-lotus-pedestal',
    kind: 'lotus_pedestal',
    name: '佛前莲台',
    assetUrl: `${assetBaseUrl}/garden_lotus_pedestal.glb`,
    routeFraction: 0.55,
    latOffset: 0.00003,
    lngOffset: 0.00003,
    scale: 165,
    height: 26,
    yaw: 0,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '灵山大佛节点的低模莲台，不替代大佛 GLB 本体。'
  },
  {
    id: 'c-buddha-rock-cluster',
    kind: 'rock_cluster',
    name: '佛前山石',
    assetUrl: `${assetBaseUrl}/garden_rock_cluster.glb`,
    routeFraction: 0.59,
    latOffset: -0.00012,
    lngOffset: -0.00017,
    scale: 190,
    height: 8,
    yaw: -35,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '大佛前山石陪衬，控制高度避免遮挡路线。'
  },
  {
    id: 'c-xiangfu-incense-burner',
    kind: 'incense_burner',
    name: '禅寺香炉',
    assetUrl: `${assetBaseUrl}/garden_incense_burner.glb`,
    routeFraction: 0.63,
    latOffset: -0.00016,
    lngOffset: 0.00011,
    scale: 120,
    height: 8,
    yaw: 12,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '祥符禅寺附近的香炉符号，风格克制。'
  },
  {
    id: 'c-xiangfu-temple-roof',
    kind: 'temple_roof',
    name: '祥符屋顶',
    assetUrl: `${assetBaseUrl}/garden_temple_roof.glb`,
    routeFraction: 0.66,
    latOffset: 0.00016,
    lngOffset: 0.0001,
    scale: 150,
    height: 12,
    yaw: -9,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '以寺庙屋顶低模提示禅寺空间，不做写实建筑。'
  },
  {
    id: 'c-fan-gong-courtyard-wall',
    kind: 'courtyard_wall',
    name: '梵宫庭墙',
    assetUrl: `${assetBaseUrl}/garden_courtyard_wall.glb`,
    routeFraction: 0.71,
    latOffset: 0.00017,
    lngOffset: 0.0001,
    scale: 230,
    height: 8,
    yaw: -11,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '梵宫区域用院墙和庭院树形成建筑边界。'
  },
  {
    id: 'c-fan-gong-pine-court',
    kind: 'pine_cluster',
    name: '梵宫庭树',
    assetUrl: `${assetBaseUrl}/garden_pine_cluster.glb`,
    routeFraction: 0.735,
    latOffset: -0.00017,
    lngOffset: 0.00006,
    scale: 132,
    height: 6,
    yaw: 22,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '梵宫侧的庭院树群，避免大量卡通植被。'
  },
  {
    id: 'c-tancheng-dharma-wheel',
    kind: 'dharma_wheel',
    name: '坛城法轮',
    assetUrl: `${assetBaseUrl}/garden_dharma_wheel.glb`,
    routeFraction: 0.84,
    latOffset: -0.00008,
    lngOffset: 0.00014,
    scale: 138,
    height: 14,
    yaw: 0,
    opacity: 1,
    visible: true,
    priority: 'high',
    note: '五印坛城附近的法轮符号，作为沉稳终段节点。'
  },
  {
    id: 'c-tancheng-lotus-stage',
    kind: 'lotus_pedestal',
    name: '坛城石台',
    assetUrl: `${assetBaseUrl}/garden_lotus_pedestal.glb`,
    routeFraction: 0.865,
    latOffset: 0.00016,
    lngOffset: 0.00004,
    scale: 120,
    height: 8,
    yaw: -18,
    opacity: 1,
    visible: true,
    priority: 'medium',
    note: '坛城终段用低矮莲台收束，不遮挡终点 marker。'
  },
  {
    id: 'c-exit-rock-pine',
    kind: 'rock_cluster',
    name: '出口山石',
    assetUrl: `${assetBaseUrl}/garden_rock_cluster.glb`,
    routeFraction: 0.94,
    latOffset: 0.00012,
    lngOffset: -0.00011,
    scale: 165,
    height: 5,
    yaw: 12,
    opacity: 1,
    visible: true,
    priority: 'low',
    note: '出口低调收束，不使用强烈固定贴片。'
  }
]

export const lingshanMap3DGardenAssets: LingshanMap3DGardenAsset[] = assetSpecs.map((spec) => {
  const routeIndex = Math.max(
    0,
    Math.min(historicalPath.length - 1, Math.round(spec.routeFraction * Math.max(0, historicalPath.length - 1)))
  )
  const anchor = historicalPath[routeIndex] ?? scenicCenter

  return {
    ...spec,
    licenseId: projectOwnedFallbackLicense,
    location: {
      lat: Number((anchor.lat + spec.latOffset).toFixed(6)),
      lng: Number((anchor.lng + spec.lngOffset).toFixed(6))
    }
  }
})

export function getDefaultMap3DGardenAssets() {
  return lingshanMap3DGardenAssets.map((asset) => ({
    ...asset,
    location: { ...asset.location }
  }))
}
