import { getMapModelOverlayInspectorId, type LingshanMapModelOverlay } from './lingshanMapModelOverlays'

export type LandmarkLodTier = 'far' | 'near'

export type LandmarkLodRuntimeChoice = {
  tier: LandmarkLodTier
  modelUrl: string
  sizeLabel?: string
  source: 'configured-lod' | 'runtime-default'
}

export type LandmarkLodConfig = {
  nearDistanceMeters: number
  farModelUrl?: string
  farSizeLabel?: string
}

export type LandmarkLodPreloadEntry = {
  landmarkId: string
  modelUrl: string
  sizeLabel?: string
}

export type LandmarkLodResolveOptions = {
  forceNear?: boolean
  forceFar?: boolean
  nearDistanceScale?: number
  maxNearDistanceMeters?: number
}

const DEFAULT_NEAR_DISTANCE_METERS = 380

const lingshanLandmarkLodConfig: Record<string, LandmarkLodConfig> = {
  giant_buddha: {
    nearDistanceMeters: 460,
    farModelUrl: '/models/lingshan/optimized/lingshan-buddha-v2.lod-far-v1.glb',
    farSizeLabel: '7.20 MB'
  },
  fan_gong: {
    nearDistanceMeters: 520,
    farModelUrl: '/models/lingshan/optimized/fan-gong.lod-map-v1.glb',
    farSizeLabel: '12.98 MB'
  },
  wuyin_tancheng: {
    nearDistanceMeters: 430,
    farModelUrl: '/models/lingshan/optimized/wuyin-mandala.lod-far-v1.glb',
    farSizeLabel: '7.85 MB'
  },
  xiangfu_temple: {
    nearDistanceMeters: 440,
    farModelUrl: '/models/lingshan/optimized/xiangfu-temple.lod-map-q1.glb',
    farSizeLabel: '13.72 MB'
  },
  jiulong_guanyu: {
    nearDistanceMeters: 360,
    farModelUrl: '/models/lingshan/optimized/jiulong-guanyu.lod-map-v1.glb',
    farSizeLabel: '14.47 MB'
  },
  foshou_square: {
    nearDistanceMeters: 320,
    farModelUrl: '/models/lingshan/optimized/buddha-hand-plaza.lod-far-v1.glb',
    farSizeLabel: '11.38 MB'
  },
  foqian_square: {
    nearDistanceMeters: 320,
    farModelUrl: '/models/lingshan/optimized/buddha-front-plaza.lod-far-v1.glb',
    farSizeLabel: '7.70 MB'
  },
  baizi_mile: {
    nearDistanceMeters: 320,
    farModelUrl: '/models/lingshan/optimized/baizi-milefo.lod-far-v1.glb',
    farSizeLabel: '9.75 MB'
  },
  puti_avenue: {
    nearDistanceMeters: 420,
    farModelUrl: '/models/lingshan/optimized/bodhi-avenue.lod-map-v3.glb',
    farSizeLabel: '9.90 MB'
  },
  lingshan_dazhaobi: {
    nearDistanceMeters: 320,
    farModelUrl: '/models/lingshan/optimized/lingshan-dazhaobi.lod-map-v2.glb',
    farSizeLabel: '13.66 MB'
  },
  shengjing_square: {
    nearDistanceMeters: 320,
    farModelUrl: '/models/lingshan/optimized/shengjing-plaza.lod-far-v1.glb',
    farSizeLabel: '9.46 MB'
  },
  sansheng_hall: {
    nearDistanceMeters: 460,
    farModelUrl: '/models/lingshan/optimized/sansheng-hall.lod-map-q1.glb',
    farSizeLabel: '13.12 MB'
  },
  manlong_flying_tower: {
    nearDistanceMeters: 420,
    farModelUrl: '/models/lingshan/optimized/manlong-flying-tower.lod-far-v2.glb',
    farSizeLabel: '12.68 MB'
  }
}

export function getLandmarkLodConfig(landmarkId: string) {
  return lingshanLandmarkLodConfig[landmarkId]
}

export function getLandmarkLodPreloadEntries(): LandmarkLodPreloadEntry[] {
  return Object.entries(lingshanLandmarkLodConfig)
    .filter((entry): entry is [string, LandmarkLodConfig & { farModelUrl: string }] => Boolean(entry[1].farModelUrl))
    .map(([landmarkId, config]) => ({
      landmarkId,
      modelUrl: config.farModelUrl,
      sizeLabel: config.farSizeLabel
    }))
}

export function resolveLandmarkLodRuntimeChoice(
  overlay: LingshanMapModelOverlay,
  distanceMeters: number | undefined,
  options: LandmarkLodResolveOptions = {}
): LandmarkLodRuntimeChoice | undefined {
  const landmarkId = getMapModelOverlayInspectorId(overlay)
  const config = getLandmarkLodConfig(landmarkId)
  const defaultUrl = overlay.modelUrl

  if (!defaultUrl) {
    return undefined
  }

  const nearDistanceMeters = config?.nearDistanceMeters ?? DEFAULT_NEAR_DISTANCE_METERS
  const scaledNearDistanceMeters = nearDistanceMeters * (options.nearDistanceScale ?? 1)
  const effectiveNearDistanceMeters =
    options.maxNearDistanceMeters === undefined
      ? scaledNearDistanceMeters
      : Math.min(scaledNearDistanceMeters, options.maxNearDistanceMeters)
  const shouldUseNear =
    options.forceNear === true ||
    (options.forceFar !== true && (distanceMeters === undefined || distanceMeters <= effectiveNearDistanceMeters))
  const farModelUrl = config?.farModelUrl

  if (!shouldUseNear && farModelUrl) {
    return {
      tier: 'far',
      modelUrl: farModelUrl,
      sizeLabel: config?.farSizeLabel,
      source: 'configured-lod'
    }
  }

  return {
    tier: shouldUseNear ? 'near' : 'far',
    modelUrl: defaultUrl,
    sizeLabel: overlay.fileSizeLabel,
    source: 'runtime-default'
  }
}
