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

export type MapModelCompanionModelType = 'base'

export type MapModelCompanionModel = {
  id: string
  type: MapModelCompanionModelType
  name: string
  modelUrl: string
  fileSizeLabel?: string
  enabled: boolean
  scale: number
  height: number
  rotationY: number
  lngOffset: number
  latOffset: number
  note?: string
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
  companionModels?: MapModelCompanionModel[]
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
    modelUrl: '/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb',
    fileSizeLabel: '14.57 MB',
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
    note: '灵山大佛人工验证 safe-v2 可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb；raw 路径 /models/lingshan/landmarks/lingshan-buddha-v2.glb 仍保留在本地用于 debugPerf 对比和回退，旧 Meshy 与 blockout 路径继续作为历史回退说明。'
  },
  {
    poiId: 'fan_gong',
    name: '梵宫',
    modelUrl: '/models/lingshan/optimized/fan-gong.safe-v2.glb',
    fileSizeLabel: '44 MB',
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
    modelUrl: '/models/lingshan/optimized-min/jiulong-guanyu.runtime-v1.glb',
    fileSizeLabel: '1.4 MB',
    positionSource: 'navLocation',
    height: 51,
    scale: 240,
    rotation: [0, 0, 0],
    lngOffset: 0.00003,
    latOffset: 0,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '新增核心参照地标 runtime-v1：/models/lingshan/optimized/jiulong-guanyu.runtime-v1.glb。人工校准 patch 已固化；后续仍可通过 Landmark Inspector / debugPerf 本地 calibration draft 微调。'
  },
  {
    poiId: 'wuyin_tancheng',
    name: '五印坛城',
    modelUrl: '/models/lingshan/optimized/wuyin-mandala.safe-v2.glb',
    fileSizeLabel: '17 MB',
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
    modelUrl: '/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb',
    fileSizeLabel: '29 MB',
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
    note: '第二批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb；raw 路径 /models/lingshan/landmarks/buddha-hand-plaza.glb 仍保留在本地用于 debugPerf 对比和回退。'
  },
  {
    poiId: 'xiangfu_temple',
    name: '祥符禅寺',
    modelUrl: '/models/lingshan/optimized-min/xiangfu-temple.safe-v2.glb',
    fileSizeLabel: '2.1 MB',
    positionSource: 'navLocation',
    height: 23,
    scale: 670,
    rotation: [0, 31, 0],
    lngOffset: 0.00001,
    latOffset: -0.00001,
    companionModels: [
      {
        id: 'xiangfu_temple_base',
        type: 'base',
        name: '祥符禅寺 3D 底座',
        modelUrl: '/models/lingshan/optimized-min/xiangfu-temple-base.runtime-v1.glb',
        fileSizeLabel: '3 KB',
        enabled: true,
        scale: 120,
        height: -2,
        rotationY: 31,
        lngOffset: -0.00005,
        latOffset: 0.00007,
        note: '真实 3D 低矮石台 / 院落铺装底座；用于替代 polygon mask，增强祥符禅寺落地感并弱化腾讯白模穿插。Three.js 纯几何 runtime-v1 约 35KB，已随祥符禅寺主模型默认启用，后续仍可在 debugPerf Landmark Inspector 中微调。'
      }
    ],
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'high',
    note: '祥符禅寺主模型重新人工校准 patch 已固化：scale 670、height 23、rotationY 31、lngOffset 0.00001、latOffset -0.00001；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 继续使用 /models/lingshan/optimized/xiangfu-temple.safe-v2.glb；raw 路径 /models/lingshan/landmarks/xiangfu-temple.glb 仍保留在本地用于 debugPerf 对比和回退。祥符禅寺底座采用 companion 3D base model，不新增 polygon footprint mask。'
  },
  {
    poiId: 'foqian_square',
    name: '佛前广场',
    modelUrl: '/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb',
    fileSizeLabel: '16 MB',
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
    note: '第二批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/buddha-front-plaza.safe-v2.glb；raw 路径 /models/lingshan/landmarks/buddha-front-plaza.glb 仍保留在本地用于 debugPerf 对比和回退。'
  },
  {
    poiId: 'baizi_mile',
    name: '百子戏弥勒',
    modelUrl: '/models/lingshan/optimized-min/baizi-milefo.safe-v2.glb',
    fileSizeLabel: '1.1 MB',
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
    note: '第三批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/baizi-milefo.safe-v2.glb；raw 路径 /models/lingshan/landmarks/baizi-milefo.glb 仍保留在本地用于 debugPerf 对比和回退。'
  },
  {
    poiId: 'puti_avenue',
    name: '菩提大道',
    modelUrl: '/models/lingshan/optimized-min/bodhi-avenue.runtime-v1.glb',
    fileSizeLabel: '3.3 MB',
    positionSource: 'navLocation',
    height: 11,
    scale: 180,
    rotation: [0, 30, 0],
    lngOffset: 0.00009,
    latOffset: 0.00005,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'low',
    note: '新版菩提大道 runtime-v1，约 23MB，用于替代旧 464M raw 的调试方向；旧 raw 文件本轮不处理、不提交、不作为运行时引用。菩提大道属于线性场景资产，人工校准 patch 已固化；后续仍可通过 Landmark Inspector / debugPerf 本地 calibration draft 微调。'
  },
  {
    poiId: 'lingshan_wall',
    inspectorId: 'lingshan_dazhaobi',
    name: '灵山大照壁',
    modelUrl: '/models/lingshan/optimized-min/lingshan-dazhaobi.runtime-v1.glb',
    fileSizeLabel: '1.1 MB',
    positionSource: 'navLocation',
    height: 6,
    scale: 150,
    rotation: [0, 28, 0],
    lngOffset: -0.00005,
    latOffset: 0,
    status: 'model_ready',
    enabledInDebug: true,
    visible: true,
    priority: 'medium',
    note: '新增核心参照地标 runtime-v1：/models/lingshan/optimized/lingshan-dazhaobi.runtime-v1.glb。POI anchor 使用现有 lingshan_wall；Inspector / 模型调试 id 使用 lingshan_dazhaobi。人工校准 patch 已固化；后续仍可通过 Landmark Inspector / debugPerf 本地 calibration draft 微调。'
  },
  {
    poiId: 'shengjing_square',
    name: '胜境广场',
    modelUrl: '/models/lingshan/optimized-min/shengjing-plaza.safe-v2.glb',
    fileSizeLabel: '1.1 MB',
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
    note: '第三批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/shengjing-plaza.safe-v2.glb；raw 路径 /models/lingshan/landmarks/shengjing-plaza.glb 仍保留在本地用于 debugPerf 对比和回退。'
  },
  {
    poiId: 'sansheng_hall',
    name: '三圣殿',
    modelUrl: '/models/lingshan/optimized-min/sansheng-hall.safe-v2.glb',
    fileSizeLabel: '2.1 MB',
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
    note: '第三批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/sansheng-hall.safe-v2.glb；raw 路径 /models/lingshan/landmarks/sansheng-hall.glb 仍保留在本地用于 debugPerf 对比和回退。现有 POI 名称为三圣殿；safe-v2 输出仍超过 100 MB，后续仍建议二次优化或低模化。'
  },
  {
    poiId: 'manfeilong_tower',
    inspectorId: 'manlong_flying_tower',
    name: '曼龙飞塔',
    modelUrl: '/models/lingshan/optimized-min/manlong-flying-tower.safe-v2.glb',
    fileSizeLabel: '2.9 MB',
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
    note: '第三批人工校准 patch 已固化；safe-v2 已人工验证可正常加载、显示和卸载，正式 runtime 已切换到 /models/lingshan/optimized/manlong-flying-tower.safe-v2.glb；raw 路径 /models/lingshan/landmarks/manlong-flying-tower.glb 仍保留在本地用于 debugPerf 对比和回退。现有 POI anchor 仍使用 manfeilong_tower；Inspector / 模型调试 id 统一显示为曼龙飞塔 / manlong_flying_tower。'
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
