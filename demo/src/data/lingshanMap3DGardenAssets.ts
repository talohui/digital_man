import type { LatLngPoint } from './guideData'

export type Map3DGardenAssetKind =
  | 'pine_cluster'
  | 'mixed_grove'
  | 'bamboo_grove'
  | 'shrub_mass'
  | 'forest_edge'

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

const treeAssetBaseUrl = '/assets/map-3d-guide/glb-garden/trees'
const projectOwnedTreeFallbackLicense = 'project-owned-ink-tree-grove-fallback'

const treeAssetUrls: Record<Map3DGardenAssetKind, string> = {
  pine_cluster: `${treeAssetBaseUrl}/ink_pine_cluster_v2.glb`,
  mixed_grove: `${treeAssetBaseUrl}/ink_mixed_grove_v2.glb`,
  bamboo_grove: `${treeAssetBaseUrl}/ink_bamboo_grove_v2.glb`,
  shrub_mass: `${treeAssetBaseUrl}/ink_shrub_mass_v2.glb`,
  forest_edge: `${treeAssetBaseUrl}/ink_forest_edge_v2.glb`
}

export const lingshanMap3DGardenAssets: LingshanMap3DGardenAsset[] = [
  {
    id: 'c-south-gate-west-forest-edge',
    kind: 'forest_edge',
    name: '南门西侧林缘',
    assetUrl: treeAssetUrls.forest_edge,
    location: { lat: 31.42092, lng: 120.10245 },
    scale: 86,
    height: 3,
    yaw: -18,
    opacity: 1,
    visible: true,
    priority: 'high',
    routeFraction: 0.05,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '中轴入口西侧林带，避开南门道路中心和主路线。'
  },
  {
    id: 'c-south-gate-east-pine',
    kind: 'pine_cluster',
    name: '南门东侧松群',
    assetUrl: treeAssetUrls.pine_cluster,
    location: { lat: 31.42108, lng: 120.10326 },
    scale: 72,
    height: 3,
    yaw: 24,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.08,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '南门东侧留出中轴路面，只在边缘形成低饱和树影。'
  },
  {
    id: 'c-lingshan-wall-west-shrubs',
    kind: 'shrub_mass',
    name: '照壁西侧灌木',
    assetUrl: treeAssetUrls.shrub_mass,
    location: { lat: 31.42178, lng: 120.10196 },
    scale: 96,
    height: 2,
    yaw: -8,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.13,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '照壁与胜境广场之间的低矮绿量，不压住广场中心。'
  },
  {
    id: 'c-axis-west-forest-belt-01',
    kind: 'forest_edge',
    name: '中轴西侧林带一',
    assetUrl: treeAssetUrls.forest_edge,
    location: { lat: 31.42262, lng: 120.10098 },
    scale: 118,
    height: 3,
    yaw: -32,
    opacity: 1,
    visible: true,
    priority: 'high',
    routeFraction: 0.2,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '胜境广场前西侧连续山林边界，保持路线与广场留白。'
  },
  {
    id: 'c-axis-east-bamboo-belt-01',
    kind: 'bamboo_grove',
    name: '中轴东侧竹影一',
    assetUrl: treeAssetUrls.bamboo_grove,
    location: { lat: 31.42288, lng: 120.10184 },
    scale: 104,
    height: 3,
    yaw: 14,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.23,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '中轴东侧竹影，给胜境广场边缘降噪，不遮挡节点。'
  },
  {
    id: 'c-shengjing-square-north-pine',
    kind: 'pine_cluster',
    name: '胜境广场北侧松群',
    assetUrl: treeAssetUrls.pine_cluster,
    location: { lat: 31.42398, lng: 120.10048 },
    scale: 88,
    height: 4,
    yaw: -26,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.31,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '胜境广场北侧边缘树群，广场中心仍保持开阔。'
  },
  {
    id: 'c-jiulong-west-grove',
    kind: 'mixed_grove',
    name: '九龙西侧山林',
    assetUrl: treeAssetUrls.mixed_grove,
    location: { lat: 31.4249, lng: 120.09952 },
    scale: 112,
    height: 4,
    yaw: -40,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.38,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '九龙灌浴西侧背景林，避开表演核心和路线。'
  },
  {
    id: 'c-jiulong-east-shrub',
    kind: 'shrub_mass',
    name: '九龙东侧灌木',
    assetUrl: treeAssetUrls.shrub_mass,
    location: { lat: 31.42442, lng: 120.1008 },
    scale: 92,
    height: 2,
    yaw: 18,
    opacity: 1,
    visible: true,
    priority: 'low',
    routeFraction: 0.41,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '九龙灌浴东侧低矮灌木，避免遮挡水景和站点标识。'
  },
  {
    id: 'c-buddha-approach-west-forest',
    kind: 'forest_edge',
    name: '登佛西侧林缘',
    assetUrl: treeAssetUrls.forest_edge,
    location: { lat: 31.42715, lng: 120.0976 },
    scale: 132,
    height: 5,
    yaw: -24,
    opacity: 1,
    visible: true,
    priority: 'high',
    routeFraction: 0.52,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '佛手广场至佛前广场西侧山林带，避开中轴阶道。'
  },
  {
    id: 'c-buddha-approach-east-bamboo',
    kind: 'bamboo_grove',
    name: '登佛东侧竹影',
    assetUrl: treeAssetUrls.bamboo_grove,
    location: { lat: 31.42752, lng: 120.09855 },
    scale: 118,
    height: 4,
    yaw: 34,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.56,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '登佛动线东侧竹林，给建筑与山体之间做柔性过渡。'
  },
  {
    id: 'c-foqian-square-west-pine',
    kind: 'pine_cluster',
    name: '佛前西侧松阵',
    assetUrl: treeAssetUrls.pine_cluster,
    location: { lat: 31.42982, lng: 120.09592 },
    scale: 104,
    height: 6,
    yaw: -12,
    opacity: 1,
    visible: true,
    priority: 'high',
    routeFraction: 0.66,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '佛前广场西侧高密度松阵，主广场和路线保留留白。'
  },
  {
    id: 'c-buddha-north-forest-backdrop',
    kind: 'mixed_grove',
    name: '大佛背后山林',
    assetUrl: treeAssetUrls.mixed_grove,
    location: { lat: 31.43078, lng: 120.09606 },
    scale: 158,
    height: 9,
    yaw: 8,
    opacity: 1,
    visible: true,
    priority: 'high',
    routeFraction: 0.7,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '大佛背后形成山林背景，不覆盖大佛 marker 和 GLB 模型。'
  },
  {
    id: 'c-buddha-east-forest-backdrop',
    kind: 'forest_edge',
    name: '大佛东侧林缘',
    assetUrl: treeAssetUrls.forest_edge,
    location: { lat: 31.43018, lng: 120.09712 },
    scale: 126,
    height: 6,
    yaw: 32,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.72,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '大佛东侧林缘，增强俯拍中山体包围感。'
  },
  {
    id: 'c-xiangfu-temple-south-grove',
    kind: 'mixed_grove',
    name: '祥符禅寺南侧树群',
    assetUrl: treeAssetUrls.mixed_grove,
    location: { lat: 31.42758, lng: 120.09748 },
    scale: 112,
    height: 4,
    yaw: -38,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.76,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '祥符禅寺南侧树群，只做建筑边缘背景，不放香炉/屋顶符号。'
  },
  {
    id: 'c-xiangfu-temple-east-bamboo',
    kind: 'bamboo_grove',
    name: '祥符禅寺东侧竹林',
    assetUrl: treeAssetUrls.bamboo_grove,
    location: { lat: 31.42812, lng: 120.09872 },
    scale: 104,
    height: 4,
    yaw: 20,
    opacity: 1,
    visible: true,
    priority: 'low',
    routeFraction: 0.78,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '寺院东侧竹林，低密度增强沉静感。'
  },
  {
    id: 'c-fan-gong-west-grove',
    kind: 'mixed_grove',
    name: '梵宫西侧庭林',
    assetUrl: treeAssetUrls.mixed_grove,
    location: { lat: 31.42772, lng: 120.10168 },
    scale: 118,
    height: 4,
    yaw: -18,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.83,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '梵宫西侧建筑边缘树群，不覆盖梵宫主体。'
  },
  {
    id: 'c-fan-gong-square-east-shrub',
    kind: 'shrub_mass',
    name: '梵宫广场东侧灌木',
    assetUrl: treeAssetUrls.shrub_mass,
    location: { lat: 31.42678, lng: 120.10312 },
    scale: 98,
    height: 2,
    yaw: 12,
    opacity: 1,
    visible: true,
    priority: 'low',
    routeFraction: 0.86,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '梵宫广场边缘低矮灌木，广场中心留白。'
  },
  {
    id: 'c-wuyin-waterfront-forest',
    kind: 'forest_edge',
    name: '坛城水岸林缘',
    assetUrl: treeAssetUrls.forest_edge,
    location: { lat: 31.42512, lng: 120.10368 },
    scale: 116,
    height: 4,
    yaw: 24,
    opacity: 1,
    visible: true,
    priority: 'medium',
    routeFraction: 0.9,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '五印坛城水岸侧林缘，不放法轮/莲台，保持树群主视觉。'
  },
  {
    id: 'c-exit-south-grove',
    kind: 'pine_cluster',
    name: '出口南侧松群',
    assetUrl: treeAssetUrls.pine_cluster,
    location: { lat: 31.42392, lng: 120.10266 },
    scale: 88,
    height: 3,
    yaw: -6,
    opacity: 1,
    visible: true,
    priority: 'low',
    routeFraction: 0.96,
    licenseId: projectOwnedTreeFallbackLicense,
    note: '出口前低调收束树群，不遮挡终点和重规划线。'
  }
]

export function getDefaultMap3DGardenAssets() {
  return lingshanMap3DGardenAssets.map((asset) => ({
    ...asset,
    location: { ...asset.location }
  }))
}
