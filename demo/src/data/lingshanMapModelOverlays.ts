// Tencent Maps Web GLTFModel overlay configuration for Lingshan landmarks.
// This file only describes model overlays and does not change real POI coordinates.
// Model status is separate from POI data status. `missing_model` means the GLB asset is pending.
// These overlays are currently used by /map?debugGltfModel=1 and /map-3d-guide-c GLB Beta.
// GLB files must be referenced by public URL strings and must not be imported into TypeScript chunks.

export type MapModelOverlayStatus =
  | 'debug_ready'
  | 'model_ready'
  | 'placeholder'
  | 'missing_model'

export type MapModelPositionSource =
  | 'navLocation'
  | 'displayLocation'

export type MapModelOverlayPriority =
  | 'high'
  | 'medium'
  | 'low'

export type FootprintMaskMode =
  | 'none'
  | 'solid'
  | 'ring'

export type MapModelFootprintMask = {
  enabled: boolean
  mode: FootprintMaskMode
  width: number
  depth: number
  innerWidth?: number
  innerDepth?: number
  height: number
  rotationY: number
  lngOffset: number
  latOffset: number
  color: string
  opacity: number
}

export type LingshanMapModelOverlay = {
  poiId: string
  inspectorId?: string
  name: string
  modelUrl?: string
  fileSizeLabel?: string
  positionSource: MapModelPositionSource
  height: number
  scale: number
  rotation: [number, number, number]
  lngOffset?: number
  latOffset?: number
  footprintMask?: MapModelFootprintMask
  status: MapModelOverlayStatus
  enabledInDebug: boolean
  visible: boolean
  priority: MapModelOverlayPriority
  note?: string
}

export const lingshanMapModelOverlays: LingshanMapModelOverlay[] = [
  {
    poiId: 'giant_buddha',
    name: '灵山大佛',
    modelUrl: '/models/lingshan/landmarks/lingshan-buddha-v2.glb',
    fileSizeLabel: '27M',
    positionSource: 'navLocation',
    height: 73,
    scale: 380,
    rotation: [0, 15, 0],
    lngOffset: 0,
    latOffset: 0.00005,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '新版灵山大佛 GLB 初始接入，旧 Meshy 路径 /models/lingshan/landmarks/lingshan_buddha_meshy_v1.glb 和历史 blockout 路径 /models/lingshan/landmarks/lingshan_buddha_blockout_v1.glb 保留为回退说明；仍需在 /map?debugGltfModel=1 或 /map-3d-guide-c 中校准 scale/height/yaw。'
  },
  {
    poiId: 'fan_gong',
    name: '梵宫',
    modelUrl: '/models/lingshan/optimized/fan-gong.safe-v2.glb',
    fileSizeLabel: '43.86 MB',
    positionSource: 'navLocation',
    height: 50,
    scale: 1012,
    rotation: [0, 10, 0],
    lngOffset: -0.00004,
    latOffset: 0.0006,
    footprintMask: {
      enabled: false,
      mode: 'none',
      width: 120,
      depth: 88,
      innerWidth: 78,
      innerDepth: 50,
      height: 0,
      rotationY: 9,
      lngOffset: 0,
      latOffset: 0,
      color: '#ded4bd',
      opacity: 0.68
    },
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '最新梵宫人工校准 patch 已固化。正式 runtime 已切换到 safe-v2：/models/lingshan/optimized/fan-gong.safe-v2.glb；raw 路径 /models/lingshan/landmarks/fan-gong.glb 仍保留在本地用于回退和 debugPerf 对比。polygon footprint mask 仍为高级调试实验，enabled=false 且 mode=none，不作为梵宫最终方案；若与腾讯底图白模建筑穿插，应在 style1 中弱化白模视觉，并后续制作真正 3D 场地底座 / 低模场景。'
  },
  {
    poiId: 'jiulong_guanyu',
    name: '九龙灌浴',
    positionSource: 'navLocation',
    height: 0,
    scale: 1,
    rotation: [0, 0, 0],
    status: 'missing_model',
    enabledInDebug: true,
    visible: false,
    priority: 'medium',
    note: '等待 MeshyAI / GLB 模型接入。'
  },
  {
    poiId: 'wuyin_tancheng',
    name: '五印坛城',
    modelUrl: '/models/lingshan/optimized/wuyin-mandala.safe-v2.glb',
    fileSizeLabel: '16.53 MB',
    positionSource: 'navLocation',
    height: 32,
    scale: 420,
    rotation: [0, 9, 0],
    lngOffset: -0.00001,
    latOffset: 0,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '五印坛城人工校准 patch 已固化。正式 runtime 已切换到 safe-v2：/models/lingshan/optimized/wuyin-mandala.safe-v2.glb；raw 路径 /models/lingshan/landmarks/wuyin-mandala.glb 仍保留在本地用于回退和 debugPerf 对比。'
  },
  {
    poiId: 'foshou_square',
    name: '佛手广场',
    modelUrl: '/models/lingshan/landmarks/buddha-hand-plaza.glb',
    fileSizeLabel: '48M',
    positionSource: 'navLocation',
    height: 9,
    scale: 194,
    rotation: [0, 30, 0],
    lngOffset: -0.00017,
    latOffset: -0.00017,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '第二批人工校准 patch 已固化；debugPerf 本地校准草稿仍可覆盖默认值，方便后续继续微调。'
  },
  {
    poiId: 'xiangfu_temple',
    name: '祥符禅寺',
    modelUrl: '/models/lingshan/landmarks/xiangfu-temple.glb',
    fileSizeLabel: '144M',
    positionSource: 'navLocation',
    height: 12,
    scale: 618,
    rotation: [0, 31, 0],
    lngOffset: -0.00006,
    latOffset: 0.00009,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '第二批人工校准 patch 已固化。祥符禅寺属于建筑类核心地标，当前位置、scale 和高度已初步校准，但仍存在与梵宫类似的腾讯 3D 白模建筑重叠风险；不新增 polygon footprint mask，后续需要真正 3D 场地底座 / 低模底座，或将底座整合进 GLB。'
  },
  {
    poiId: 'foqian_square',
    name: '佛前广场',
    modelUrl: '/models/lingshan/landmarks/buddha-front-plaza.glb',
    fileSizeLabel: '30M',
    positionSource: 'navLocation',
    height: 3,
    scale: 103,
    rotation: [0, 28, 0],
    lngOffset: -0.00004,
    latOffset: 0.00005,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '第二批人工校准 patch 已固化；debugPerf 本地校准草稿仍可覆盖默认值，方便后续继续微调。'
  },
  {
    poiId: 'baizi_mile',
    name: '百子戏弥勒',
    modelUrl: '/models/lingshan/landmarks/baizi-milefo.glb',
    fileSizeLabel: '37M',
    positionSource: 'navLocation',
    height: 9,
    scale: 145,
    rotation: [0, 20, 0],
    lngOffset: 0.00009,
    latOffset: 0,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '第三批人工校准 patch 已固化；debugPerf 本地校准草稿仍可覆盖默认值，方便后续继续微调。'
  },
  {
    poiId: 'puti_avenue',
    name: '菩提大道',
    modelUrl: '/models/lingshan/landmarks/bodhi-avenue.glb',
    fileSizeLabel: '464M',
    positionSource: 'navLocation',
    height: 2,
    scale: 55,
    rotation: [0, 0, 0],
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '次高优先级线性节点 GLB 初始接入；文件体积较大，后续需要压缩和校准。'
  },
  {
    poiId: 'shengjing_square',
    name: '胜境广场',
    modelUrl: '/models/lingshan/landmarks/shengjing-plaza.glb',
    fileSizeLabel: '36M',
    positionSource: 'navLocation',
    height: 8,
    scale: 150,
    rotation: [0, 30, 0],
    lngOffset: 0.00001,
    latOffset: 0,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '第三批人工校准 patch 已固化；debugPerf 本地校准草稿仍可覆盖默认值，方便后续继续微调。'
  },
  {
    poiId: 'sansheng_hall',
    name: '三圣殿',
    modelUrl: '/models/lingshan/landmarks/sansheng-hall.glb',
    fileSizeLabel: '142M',
    positionSource: 'navLocation',
    height: 46,
    scale: 763,
    rotation: [0, 53, 0],
    lngOffset: 0.00011,
    latOffset: -0.00021,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '第三批人工校准 patch 已固化。现有 POI 名称为三圣殿；GLB 文件按 sansheng-hall 接入，debugPerf 本地校准草稿仍可覆盖默认值。'
  },
  {
    poiId: 'manfeilong_tower',
    inspectorId: 'manlong_flying_tower',
    name: '曼龙飞塔',
    modelUrl: '/models/lingshan/landmarks/manlong-flying-tower.glb',
    fileSizeLabel: '85M',
    positionSource: 'navLocation',
    height: 35,
    scale: 207.5,
    rotation: [0, 15, 0],
    lngOffset: -0.00005,
    latOffset: -0.00006,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '第三批人工校准 patch 已固化。现有 POI anchor 仍使用 manfeilong_tower；Inspector / 模型调试 id 统一显示为曼龙飞塔 / manlong_flying_tower，debugPerf 本地校准草稿仍可覆盖默认值。'
  }
]

export function getMapModelOverlayByPoiId(poiId: string) {
  return lingshanMapModelOverlays.find((overlay) => overlay.poiId === poiId)
}

export function getDebugMapModelOverlays() {
  return lingshanMapModelOverlays.filter((overlay) => overlay.enabledInDebug)
}

export function getVisibleMapModelOverlays() {
  return lingshanMapModelOverlays.filter(
    (overlay) => overlay.visible && Boolean(overlay.modelUrl) && overlay.status !== 'missing_model'
  )
}

export function getMapModelOverlayInspectorId(overlay: LingshanMapModelOverlay) {
  return overlay.inspectorId ?? overlay.poiId
}
