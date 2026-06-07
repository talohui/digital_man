import type { LatLngPoint } from './guideData'

export type Map3DGardenAssetKind =
  | 'pine_cluster'
  | 'mixed_grove'
  | 'bamboo_grove'
  | 'shrub_mass'
  | 'forest_edge'
  | 'rock_cluster'
  | 'stone_mass'

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

const vendorAssetBaseUrl = '/assets/map-3d-guide/glb-garden/vendor'
const kenneyNatureKitLicenseId = 'kenney-nature-kit-cc0'

const gardenAssetUrls: Record<Map3DGardenAssetKind, string> = {
  pine_cluster: `${vendorAssetBaseUrl}/kenney_tree_pine_tall_a.glb`,
  mixed_grove: `${vendorAssetBaseUrl}/kenney_tree_default_dark.glb`,
  bamboo_grove: `${vendorAssetBaseUrl}/kenney_tree_pine_round_c.glb`,
  shrub_mass: `${vendorAssetBaseUrl}/kenney_bush_detailed.glb`,
  forest_edge: `${vendorAssetBaseUrl}/kenney_tree_pine_round_c.glb`,
  rock_cluster: `${vendorAssetBaseUrl}/kenney_rock_large_c.glb`,
  stone_mass: `${vendorAssetBaseUrl}/kenney_rock_tall_h.glb`
}

type GardenAssetInput = Omit<LingshanMap3DGardenAsset, 'assetUrl' | 'licenseId' | 'opacity' | 'visible'> & {
  opacity?: number
  visible?: boolean
}

function gardenAsset(input: GardenAssetInput): LingshanMap3DGardenAsset {
  return {
    ...input,
    assetUrl: gardenAssetUrls[input.kind],
    opacity: input.opacity ?? 0.92,
    visible: input.visible ?? true,
    licenseId: kenneyNatureKitLicenseId
  }
}

export const lingshanMap3DGardenAssets: LingshanMap3DGardenAsset[] = [
  gardenAsset({
    id: 'c-entry-outer-west-pine',
    kind: 'pine_cluster',
    name: '入口外西侧松列',
    location: { lat: 31.42038, lng: 120.10192 },
    scale: 82,
    height: 2,
    yaw: -24,
    priority: 'low',
    routeFraction: 0.01,
    note: '入口外侧低密度松列，用于从停车场到南门形成自然边界。'
  }),
  gardenAsset({
    id: 'c-entry-outer-east-forest',
    kind: 'forest_edge',
    name: '入口外东侧林缘',
    location: { lat: 31.42044, lng: 120.10324 },
    scale: 92,
    height: 2,
    yaw: 18,
    priority: 'low',
    routeFraction: 0.02,
    note: '入口东侧林缘，避开主入口轴线。'
  }),
  gardenAsset({
    id: 'c-parking-west-forest-screen',
    kind: 'mixed_grove',
    name: '西侧停车区林屏',
    location: { lat: 31.41996, lng: 120.10112 },
    scale: 96,
    height: 2,
    yaw: -36,
    priority: 'low',
    routeFraction: 0.02,
    note: '弱化停车区边缘，仍保持主路和入口开阔。'
  }),
  gardenAsset({
    id: 'c-parking-east-forest-screen',
    kind: 'bamboo_grove',
    name: '东侧停车区林屏',
    location: { lat: 31.42002, lng: 120.10378 },
    scale: 86,
    height: 2,
    yaw: 30,
    priority: 'low',
    routeFraction: 0.03,
    note: '停车区东侧低调树屏，不进入道路中心。'
  }),
  gardenAsset({
    id: 'c-south-gate-west-forest-edge',
    kind: 'forest_edge',
    name: '南门西侧林缘',
    location: { lat: 31.42092, lng: 120.10245 },
    scale: 106,
    height: 3,
    yaw: -18,
    priority: 'high',
    routeFraction: 0.05,
    note: '中轴入口西侧林带，避开南门道路中心和主路线。'
  }),
  gardenAsset({
    id: 'c-south-gate-east-pine',
    kind: 'pine_cluster',
    name: '南门东侧松群',
    location: { lat: 31.42108, lng: 120.10326 },
    scale: 92,
    height: 3,
    yaw: 24,
    priority: 'medium',
    routeFraction: 0.06,
    note: '南门东侧留出中轴路面，只在边缘形成低饱和树影。'
  }),
  gardenAsset({
    id: 'c-south-gate-west-bush-low',
    kind: 'shrub_mass',
    name: '南门西侧低灌木',
    location: { lat: 31.42118, lng: 120.10182 },
    scale: 62,
    height: 1,
    yaw: -8,
    priority: 'low',
    routeFraction: 0.07,
    note: '入口西侧低矮绿量，不遮挡南门 marker。'
  }),
  gardenAsset({
    id: 'c-south-gate-east-bush-low',
    kind: 'shrub_mass',
    name: '南门东侧低灌木',
    location: { lat: 31.42128, lng: 120.10362 },
    scale: 58,
    height: 1,
    yaw: 18,
    priority: 'low',
    routeFraction: 0.08,
    note: '入口东侧低矮绿量，控制在道路边缘。'
  }),
  gardenAsset({
    id: 'c-wall-west-rocks',
    kind: 'rock_cluster',
    name: '照壁西侧山石',
    location: { lat: 31.42178, lng: 120.10196 },
    scale: 78,
    height: 2,
    yaw: -8,
    priority: 'medium',
    routeFraction: 0.12,
    note: '照壁与胜境广场之间的低矮自然边界。'
  }),
  gardenAsset({
    id: 'c-wall-east-shrubs',
    kind: 'shrub_mass',
    name: '照壁东侧灌木',
    location: { lat: 31.42182, lng: 120.10278 },
    scale: 66,
    height: 1,
    yaw: 16,
    priority: 'low',
    routeFraction: 0.13,
    note: '照壁东侧低灌木，避免遮挡中轴。'
  }),
  gardenAsset({
    id: 'c-wall-north-west-pine',
    kind: 'pine_cluster',
    name: '照壁北侧西松',
    location: { lat: 31.42212, lng: 120.1015 },
    scale: 88,
    height: 3,
    yaw: -28,
    priority: 'medium',
    routeFraction: 0.15,
    note: '照壁北侧向胜境广场过渡的松群。'
  }),
  gardenAsset({
    id: 'c-wall-north-east-grove',
    kind: 'mixed_grove',
    name: '照壁北侧东林',
    location: { lat: 31.42224, lng: 120.10298 },
    scale: 92,
    height: 3,
    yaw: 22,
    priority: 'medium',
    routeFraction: 0.16,
    note: '照壁北侧东边界树群，保持广场中心留白。'
  }),
  gardenAsset({
    id: 'c-axis-west-forest-belt-01',
    kind: 'forest_edge',
    name: '中轴西侧林带一',
    location: { lat: 31.42262, lng: 120.10098 },
    scale: 142,
    height: 4,
    yaw: -32,
    priority: 'high',
    routeFraction: 0.2,
    note: '胜境广场前西侧连续山林边界，保持路线与广场留白。'
  }),
  gardenAsset({
    id: 'c-axis-west-forest-belt-02',
    kind: 'mixed_grove',
    name: '中轴西侧林带二',
    location: { lat: 31.42308, lng: 120.10072 },
    scale: 128,
    height: 4,
    yaw: -18,
    priority: 'high',
    routeFraction: 0.22,
    note: '补齐中轴西侧连续林带，让总览视角形成山林包围感。'
  }),
  gardenAsset({
    id: 'c-axis-west-forest-belt-03',
    kind: 'forest_edge',
    name: '中轴西侧林带三',
    location: { lat: 31.42352, lng: 120.10028 },
    scale: 136,
    height: 4,
    yaw: -44,
    priority: 'medium',
    routeFraction: 0.25,
    note: '靠近胜境广场西北边缘的树屏，避开广场中心。'
  }),
  gardenAsset({
    id: 'c-axis-east-bamboo-belt-01',
    kind: 'bamboo_grove',
    name: '中轴东侧针叶一',
    location: { lat: 31.42288, lng: 120.10184 },
    scale: 116,
    height: 3,
    yaw: 14,
    priority: 'medium',
    routeFraction: 0.23,
    note: '中轴东侧树影，给胜境广场边缘降噪，不遮挡节点。'
  }),
  gardenAsset({
    id: 'c-axis-east-bamboo-belt-02',
    kind: 'bamboo_grove',
    name: '中轴东侧针叶二',
    location: { lat: 31.42332, lng: 120.1022 },
    scale: 112,
    height: 3,
    yaw: 36,
    priority: 'medium',
    routeFraction: 0.26,
    note: '东侧第二组针叶树，形成连续但不封闭的林带。'
  }),
  gardenAsset({
    id: 'c-square-west-low-bush',
    kind: 'shrub_mass',
    name: '胜境广场西侧低灌木',
    location: { lat: 31.42348, lng: 120.10116 },
    scale: 68,
    height: 1,
    yaw: -20,
    priority: 'low',
    routeFraction: 0.28,
    note: '广场边缘低灌木，中心仍保持开阔。'
  }),
  gardenAsset({
    id: 'c-square-east-low-bush',
    kind: 'shrub_mass',
    name: '胜境广场东侧低灌木',
    location: { lat: 31.42362, lng: 120.10262 },
    scale: 72,
    height: 1,
    yaw: 18,
    priority: 'low',
    routeFraction: 0.29,
    note: '广场东侧低灌木，远离中轴路线。'
  }),
  gardenAsset({
    id: 'c-shengjing-square-north-pine',
    kind: 'pine_cluster',
    name: '胜境广场北侧松群',
    location: { lat: 31.42398, lng: 120.10048 },
    scale: 104,
    height: 4,
    yaw: -26,
    priority: 'medium',
    routeFraction: 0.31,
    note: '胜境广场北侧边缘树群，广场中心仍保持开阔。'
  }),
  gardenAsset({
    id: 'c-shengjing-square-north-east-grove',
    kind: 'mixed_grove',
    name: '胜境广场东北树群',
    location: { lat: 31.4241, lng: 120.1017 },
    scale: 98,
    height: 3,
    yaw: 12,
    priority: 'medium',
    routeFraction: 0.32,
    note: '胜境广场北侧向九龙灌浴过渡的树群。'
  }),
  gardenAsset({
    id: 'c-jiulong-south-west-bush',
    kind: 'shrub_mass',
    name: '九龙南西低树',
    location: { lat: 31.42424, lng: 120.09986 },
    scale: 68,
    height: 1,
    yaw: -10,
    priority: 'low',
    routeFraction: 0.34,
    note: '九龙灌浴南侧低树，不遮挡水景。'
  }),
  gardenAsset({
    id: 'c-jiulong-south-east-bush',
    kind: 'shrub_mass',
    name: '九龙南东低树',
    location: { lat: 31.42428, lng: 120.10074 },
    scale: 64,
    height: 1,
    yaw: 20,
    priority: 'low',
    routeFraction: 0.35,
    note: '九龙灌浴南东侧低矮绿量。'
  }),
  gardenAsset({
    id: 'c-jiulong-west-grove',
    kind: 'mixed_grove',
    name: '九龙西侧山林',
    location: { lat: 31.4249, lng: 120.09952 },
    scale: 128,
    height: 4,
    yaw: -40,
    priority: 'medium',
    routeFraction: 0.38,
    note: '九龙灌浴西侧背景林，避开表演核心和路线。'
  }),
  gardenAsset({
    id: 'c-jiulong-west-pine-backdrop',
    kind: 'pine_cluster',
    name: '九龙西侧松影',
    location: { lat: 31.42524, lng: 120.09904 },
    scale: 118,
    height: 4,
    yaw: -16,
    priority: 'medium',
    routeFraction: 0.4,
    note: '补强九龙西侧林带，参考俯拍中水景周边绿化。'
  }),
  gardenAsset({
    id: 'c-jiulong-east-stone',
    kind: 'stone_mass',
    name: '九龙东侧山石',
    location: { lat: 31.42442, lng: 120.1008 },
    scale: 68,
    height: 2,
    yaw: 18,
    priority: 'low',
    routeFraction: 0.41,
    note: '九龙灌浴东侧低矮自然物，避免遮挡水景和站点标识。'
  }),
  gardenAsset({
    id: 'c-jiulong-east-forest-edge',
    kind: 'forest_edge',
    name: '九龙东侧林缘',
    location: { lat: 31.42505, lng: 120.10092 },
    scale: 108,
    height: 3,
    yaw: 32,
    priority: 'medium',
    routeFraction: 0.43,
    note: '九龙东侧向梵宫方向过渡的林缘。'
  }),
  gardenAsset({
    id: 'c-jiulong-north-bamboo',
    kind: 'bamboo_grove',
    name: '九龙北侧针叶',
    location: { lat: 31.42552, lng: 120.09992 },
    scale: 112,
    height: 3,
    yaw: -8,
    priority: 'medium',
    routeFraction: 0.45,
    note: '九龙北侧至登佛动线之间的针叶绿带。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-west-forest',
    kind: 'forest_edge',
    name: '登佛西侧林缘',
    location: { lat: 31.42628, lng: 120.09838 },
    scale: 132,
    height: 4,
    yaw: -26,
    priority: 'high',
    routeFraction: 0.48,
    note: '佛手广场南段西侧林带，避开中轴阶道。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-east-forest',
    kind: 'mixed_grove',
    name: '登佛东侧林缘',
    location: { lat: 31.42652, lng: 120.09928 },
    scale: 122,
    height: 4,
    yaw: 24,
    priority: 'medium',
    routeFraction: 0.49,
    note: '佛手广场南段东侧树群，形成对称绿带。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-west-forest-02',
    kind: 'forest_edge',
    name: '登佛西侧林缘二',
    location: { lat: 31.42715, lng: 120.0976 },
    scale: 152,
    height: 5,
    yaw: -24,
    priority: 'high',
    routeFraction: 0.52,
    note: '佛手广场至佛前广场西侧山林带，避开中轴阶道。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-east-bamboo',
    kind: 'bamboo_grove',
    name: '登佛东侧针叶',
    location: { lat: 31.42752, lng: 120.09855 },
    scale: 132,
    height: 4,
    yaw: 34,
    priority: 'medium',
    routeFraction: 0.54,
    note: '登佛动线东侧树带，给建筑与山体之间做柔性过渡。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-west-rock',
    kind: 'rock_cluster',
    name: '登佛西侧山石',
    location: { lat: 31.42792, lng: 120.0972 },
    scale: 74,
    height: 2,
    yaw: -18,
    priority: 'low',
    routeFraction: 0.55,
    note: '登佛动线西侧山石点缀，不作为主视觉。'
  }),
  gardenAsset({
    id: 'c-buddha-approach-east-bush',
    kind: 'shrub_mass',
    name: '登佛东侧灌木',
    location: { lat: 31.42818, lng: 120.09836 },
    scale: 74,
    height: 1,
    yaw: 22,
    priority: 'low',
    routeFraction: 0.56,
    note: '登佛东侧低层绿量，避免遮挡路线。'
  }),
  gardenAsset({
    id: 'c-foqian-square-west-pine',
    kind: 'pine_cluster',
    name: '佛前西侧松阵',
    location: { lat: 31.42982, lng: 120.09592 },
    scale: 122,
    height: 6,
    yaw: -12,
    priority: 'high',
    routeFraction: 0.62,
    note: '佛前广场西侧高密度松阵，主广场和路线保留留白。'
  }),
  gardenAsset({
    id: 'c-foqian-square-east-pine',
    kind: 'pine_cluster',
    name: '佛前东侧松阵',
    location: { lat: 31.42962, lng: 120.09682 },
    scale: 116,
    height: 6,
    yaw: 18,
    priority: 'high',
    routeFraction: 0.63,
    note: '佛前广场东侧松阵，和西侧形成山林夹道。'
  }),
  gardenAsset({
    id: 'c-foqian-square-west-bush',
    kind: 'shrub_mass',
    name: '佛前西侧低树',
    location: { lat: 31.42918, lng: 120.09628 },
    scale: 72,
    height: 2,
    yaw: -30,
    priority: 'low',
    routeFraction: 0.64,
    note: '佛前广场边缘低层绿量，保持广场开阔。'
  }),
  gardenAsset({
    id: 'c-foqian-square-east-bush',
    kind: 'shrub_mass',
    name: '佛前东侧低树',
    location: { lat: 31.42928, lng: 120.09708 },
    scale: 76,
    height: 2,
    yaw: 26,
    priority: 'low',
    routeFraction: 0.65,
    note: '佛前东侧低层绿量，不遮挡大佛 GLB 和路线。'
  }),
  gardenAsset({
    id: 'c-buddha-north-forest-backdrop',
    kind: 'mixed_grove',
    name: '大佛背后山林一',
    location: { lat: 31.43078, lng: 120.09606 },
    scale: 182,
    height: 10,
    yaw: 8,
    priority: 'high',
    routeFraction: 0.68,
    note: '大佛背后形成主要山林背景，不覆盖大佛 marker 和 GLB 模型。'
  }),
  gardenAsset({
    id: 'c-buddha-north-forest-backdrop-02',
    kind: 'forest_edge',
    name: '大佛背后山林二',
    location: { lat: 31.43118, lng: 120.09522 },
    scale: 176,
    height: 11,
    yaw: -18,
    priority: 'high',
    routeFraction: 0.69,
    note: '大佛背后西北侧高密度山林，参考俯拍山体包围。'
  }),
  gardenAsset({
    id: 'c-buddha-north-forest-backdrop-03',
    kind: 'bamboo_grove',
    name: '大佛背后针叶林',
    location: { lat: 31.43112, lng: 120.09692 },
    scale: 164,
    height: 10,
    yaw: 24,
    priority: 'high',
    routeFraction: 0.7,
    note: '大佛背后东北侧针叶林，增加树种变化。'
  }),
  gardenAsset({
    id: 'c-buddha-west-forest-backdrop',
    kind: 'mixed_grove',
    name: '大佛西侧山林',
    location: { lat: 31.43028, lng: 120.09478 },
    scale: 166,
    height: 8,
    yaw: -42,
    priority: 'high',
    routeFraction: 0.7,
    note: '大佛西侧高密山林，形成俯拍图中的大片绿量。'
  }),
  gardenAsset({
    id: 'c-buddha-east-forest-backdrop',
    kind: 'forest_edge',
    name: '大佛东侧林缘',
    location: { lat: 31.43018, lng: 120.09712 },
    scale: 148,
    height: 7,
    yaw: 32,
    priority: 'medium',
    routeFraction: 0.71,
    note: '大佛东侧林缘，增强俯拍中山体包围感。'
  }),
  gardenAsset({
    id: 'c-buddha-east-stone-line',
    kind: 'stone_mass',
    name: '大佛东侧竖石',
    location: { lat: 31.43054, lng: 120.09772 },
    scale: 82,
    height: 3,
    yaw: 12,
    priority: 'low',
    routeFraction: 0.72,
    note: '大佛东侧山石点缀，控制在背景层。'
  }),
  gardenAsset({
    id: 'c-buddha-west-rock-line',
    kind: 'rock_cluster',
    name: '大佛西侧山石',
    location: { lat: 31.43056, lng: 120.09538 },
    scale: 84,
    height: 3,
    yaw: -20,
    priority: 'low',
    routeFraction: 0.72,
    note: '大佛西侧山石点缀，不进入广场。'
  }),
  gardenAsset({
    id: 'c-buddha-north-pine-line',
    kind: 'pine_cluster',
    name: '大佛北侧松线',
    location: { lat: 31.4315, lng: 120.09608 },
    scale: 132,
    height: 11,
    yaw: 4,
    priority: 'medium',
    routeFraction: 0.73,
    note: '大佛背后更远处松线，远景总览中形成山脊感。'
  }),
  gardenAsset({
    id: 'c-xiangfu-temple-south-grove',
    kind: 'mixed_grove',
    name: '祥符禅寺南侧树群',
    location: { lat: 31.42758, lng: 120.09748 },
    scale: 118,
    height: 4,
    yaw: -38,
    priority: 'medium',
    routeFraction: 0.74,
    note: '祥符禅寺南侧树群，只做建筑边缘背景，不放香炉/屋顶符号。'
  }),
  gardenAsset({
    id: 'c-xiangfu-temple-west-pines',
    kind: 'pine_cluster',
    name: '祥符禅寺西侧松群',
    location: { lat: 31.42782, lng: 120.09672 },
    scale: 112,
    height: 4,
    yaw: -18,
    priority: 'medium',
    routeFraction: 0.75,
    note: '禅寺西侧松群，增强寺院边缘绿量。'
  }),
  gardenAsset({
    id: 'c-xiangfu-temple-east-bamboo',
    kind: 'bamboo_grove',
    name: '祥符禅寺东侧针叶',
    location: { lat: 31.42812, lng: 120.09872 },
    scale: 118,
    height: 4,
    yaw: 20,
    priority: 'low',
    routeFraction: 0.76,
    note: '寺院东侧低密度增强沉静感。'
  }),
  gardenAsset({
    id: 'c-xiangfu-temple-north-grove',
    kind: 'mixed_grove',
    name: '祥符禅寺北侧树群',
    location: { lat: 31.42862, lng: 120.09782 },
    scale: 124,
    height: 5,
    yaw: 26,
    priority: 'medium',
    routeFraction: 0.77,
    note: '禅寺北侧连接大佛山林的背景树群。'
  }),
  gardenAsset({
    id: 'c-fan-gong-west-grove',
    kind: 'mixed_grove',
    name: '梵宫西侧庭林',
    location: { lat: 31.42772, lng: 120.10168 },
    scale: 128,
    height: 4,
    yaw: -18,
    priority: 'medium',
    routeFraction: 0.82,
    note: '梵宫西侧建筑边缘树群，不覆盖梵宫主体。'
  }),
  gardenAsset({
    id: 'c-fan-gong-north-grove',
    kind: 'forest_edge',
    name: '梵宫北侧林缘',
    location: { lat: 31.42832, lng: 120.10234 },
    scale: 132,
    height: 5,
    yaw: -34,
    priority: 'medium',
    routeFraction: 0.83,
    note: '梵宫北侧背景林缘，保留建筑主体轮廓。'
  }),
  gardenAsset({
    id: 'c-fan-gong-east-pine',
    kind: 'pine_cluster',
    name: '梵宫东侧松群',
    location: { lat: 31.42746, lng: 120.10292 },
    scale: 108,
    height: 4,
    yaw: 22,
    priority: 'medium',
    routeFraction: 0.84,
    note: '梵宫东侧松群，形成建筑边缘绿化。'
  }),
  gardenAsset({
    id: 'c-fan-gong-square-east-shrub',
    kind: 'shrub_mass',
    name: '梵宫广场东侧灌木',
    location: { lat: 31.42678, lng: 120.10312 },
    scale: 82,
    height: 2,
    yaw: 12,
    priority: 'low',
    routeFraction: 0.85,
    note: '梵宫广场边缘低矮灌木，广场中心留白。'
  }),
  gardenAsset({
    id: 'c-fan-gong-south-bush-line',
    kind: 'shrub_mass',
    name: '梵宫南侧低树线',
    location: { lat: 31.42624, lng: 120.10254 },
    scale: 78,
    height: 2,
    yaw: -8,
    priority: 'low',
    routeFraction: 0.86,
    note: '梵宫南侧低树线，不遮挡广场和路线。'
  }),
  gardenAsset({
    id: 'c-fan-gong-water-rock',
    kind: 'rock_cluster',
    name: '梵宫水岸山石',
    location: { lat: 31.4266, lng: 120.10402 },
    scale: 72,
    height: 2,
    yaw: 28,
    priority: 'low',
    routeFraction: 0.87,
    note: '梵宫东侧水岸点缀山石，保持低调。'
  }),
  gardenAsset({
    id: 'c-wuyin-waterfront-forest',
    kind: 'forest_edge',
    name: '坛城水岸林缘',
    location: { lat: 31.42512, lng: 120.10368 },
    scale: 128,
    height: 4,
    yaw: 24,
    priority: 'medium',
    routeFraction: 0.89,
    note: '五印坛城水岸侧林缘，不放法轮/莲台，保持树群主视觉。'
  }),
  gardenAsset({
    id: 'c-wuyin-west-pines',
    kind: 'pine_cluster',
    name: '坛城西侧松群',
    location: { lat: 31.42538, lng: 120.10284 },
    scale: 108,
    height: 4,
    yaw: -18,
    priority: 'medium',
    routeFraction: 0.9,
    note: '五印坛城西侧松群，避开主建筑。'
  }),
  gardenAsset({
    id: 'c-wuyin-north-bush',
    kind: 'shrub_mass',
    name: '坛城北侧灌木',
    location: { lat: 31.42578, lng: 120.10392 },
    scale: 76,
    height: 2,
    yaw: 6,
    priority: 'low',
    routeFraction: 0.91,
    note: '坛城北侧水岸低矮绿量。'
  }),
  gardenAsset({
    id: 'c-wuyin-east-forest',
    kind: 'mixed_grove',
    name: '坛城东侧树群',
    location: { lat: 31.42482, lng: 120.10472 },
    scale: 118,
    height: 4,
    yaw: 30,
    priority: 'medium',
    routeFraction: 0.92,
    note: '坛城东侧边缘树群，形成水体边界。'
  }),
  gardenAsset({
    id: 'c-wuyin-south-rock',
    kind: 'stone_mass',
    name: '坛城南侧竖石',
    location: { lat: 31.42446, lng: 120.10394 },
    scale: 62,
    height: 2,
    yaw: -24,
    priority: 'low',
    routeFraction: 0.93,
    note: '坛城南侧低调竖石，不成为主视觉。'
  }),
  gardenAsset({
    id: 'c-exit-north-grove',
    kind: 'forest_edge',
    name: '出口北侧林缘',
    location: { lat: 31.42432, lng: 120.10222 },
    scale: 104,
    height: 3,
    yaw: -12,
    priority: 'medium',
    routeFraction: 0.94,
    note: '出口前北侧林缘，收束路线末端。'
  }),
  gardenAsset({
    id: 'c-exit-south-grove',
    kind: 'pine_cluster',
    name: '出口南侧松群',
    location: { lat: 31.42392, lng: 120.10266 },
    scale: 98,
    height: 3,
    yaw: -6,
    priority: 'low',
    routeFraction: 0.95,
    note: '出口前低调收束树群，不遮挡终点和重规划线。'
  }),
  gardenAsset({
    id: 'c-exit-east-bush',
    kind: 'shrub_mass',
    name: '出口东侧低灌木',
    location: { lat: 31.42372, lng: 120.10324 },
    scale: 66,
    height: 1,
    yaw: 16,
    priority: 'low',
    routeFraction: 0.96,
    note: '出口东侧低灌木，保持终点 marker 清晰。'
  }),
  gardenAsset({
    id: 'c-exit-west-bamboo',
    kind: 'bamboo_grove',
    name: '出口西侧针叶',
    location: { lat: 31.42372, lng: 120.1019 },
    scale: 92,
    height: 3,
    yaw: -20,
    priority: 'low',
    routeFraction: 0.97,
    note: '出口西侧针叶，形成路线末端余韵。'
  }),
  gardenAsset({
    id: 'c-route-return-west-forest',
    kind: 'mixed_grove',
    name: '回程西侧林屏',
    location: { lat: 31.42296, lng: 120.10118 },
    scale: 98,
    height: 3,
    yaw: -30,
    priority: 'low',
    routeFraction: 0.98,
    note: '回程边缘树屏，增强整体山林连续性。'
  }),
  gardenAsset({
    id: 'c-route-return-east-forest',
    kind: 'forest_edge',
    name: '回程东侧林屏',
    location: { lat: 31.4228, lng: 120.10274 },
    scale: 102,
    height: 3,
    yaw: 26,
    priority: 'low',
    routeFraction: 0.99,
    note: '回程东侧林屏，避免路线末端显得空。'
  })
]

export function getDefaultMap3DGardenAssets() {
  return lingshanMap3DGardenAssets.map((asset) => ({
    ...asset,
    location: { ...asset.location }
  }))
}
