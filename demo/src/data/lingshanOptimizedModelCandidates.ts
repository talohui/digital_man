// Debug-only optimized GLB candidates for Landmark GLB Inspector.
// These public URLs are not used by normal /map-3d-guide-c visitor mode.
// safe-v2 is the current validated runtime candidate for wuyin_tancheng and fan_gong.
// raw is kept for local debug/rollback comparison, and safe-v1 is kept for Inspector comparison.
// Draco candidates are intentionally excluded because current manual Tencent GLTFModel testing cannot open them.

export type LandmarkModelVariant = 'raw' | 'safe-v1' | 'safe-v2'

export type LandmarkOptimizedModelCandidate = {
  variant: LandmarkModelVariant
  modelUrl: string
  sizeLabel: string
}

const lingshanOptimizedModelCandidates: Record<string, LandmarkOptimizedModelCandidate[]> = {
  wuyin_tancheng: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/wuyin-mandala.glb',
      sizeLabel: '31.00 MB'
    },
    {
      variant: 'safe-v1',
      modelUrl: '/models/lingshan/optimized/wuyin-mandala.safe.glb',
      sizeLabel: '23.69 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/wuyin-mandala.safe-v2.glb',
      sizeLabel: '16.53 MB'
    }
  ],
  fan_gong: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/fan-gong.glb',
      sizeLabel: '67.17 MB'
    },
    {
      variant: 'safe-v1',
      modelUrl: '/models/lingshan/optimized/fan-gong.safe.glb',
      sizeLabel: '58.92 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/fan-gong.safe-v2.glb',
      sizeLabel: '43.86 MB'
    }
  ]
}

export function getLandmarkOptimizedModelCandidates(landmarkId: string) {
  return lingshanOptimizedModelCandidates[landmarkId] ?? []
}
