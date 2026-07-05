// Debug-only optimized GLB candidates for Landmark GLB Inspector.
// These public URLs are not used by normal /map-3d-guide-c visitor mode.
// safe-v2 is the current validated runtime direction for most Tencent GLTFModel assets.
// safe-v3 is used only where non-Draco recompression was needed to stay below GitHub's 100 MB limit.
// The listed core landmarks are formally switched after manual verification.
// raw is kept for local debug/rollback comparison, and safe-v1 is kept only where earlier trial files exist.
// Draco candidates are intentionally excluded because current manual Tencent GLTFModel testing cannot open them.

export type LandmarkModelVariant = 'raw' | 'safe-v1' | 'safe-v2' | 'safe-v3'

export type LandmarkOptimizedModelCandidate = {
  variant: LandmarkModelVariant
  modelUrl: string
  sizeLabel: string
}

const lingshanOptimizedModelCandidates: Record<string, LandmarkOptimizedModelCandidate[]> = {
  giant_buddha: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/lingshan-buddha-v2.glb',
      sizeLabel: '28.73 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/lingshan-buddha-v2.safe-v2.glb',
      sizeLabel: '14.57 MB'
    }
  ],
  baizi_mile: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/baizi-milefo.glb',
      sizeLabel: '38.86 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/baizi-milefo.safe-v2.glb',
      sizeLabel: '21.90 MB'
    }
  ],
  foshou_square: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/buddha-hand-plaza.glb',
      sizeLabel: '50.66 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/buddha-hand-plaza.safe-v2.glb',
      sizeLabel: '30.04 MB'
    }
  ],
  shengjing_square: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/shengjing-plaza.glb',
      sizeLabel: '37.95 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/shengjing-plaza.safe-v2.glb',
      sizeLabel: '20.90 MB'
    }
  ],
  sansheng_hall: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/sansheng-hall.glb',
      sizeLabel: '148.85 MB'
    },
    {
      variant: 'safe-v3',
      modelUrl: '/models/lingshan/optimized/sansheng-hall.safe-v3.glb',
      sizeLabel: '90.62 MB'
    }
  ],
  xiangfu_temple: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/xiangfu-temple.glb',
      sizeLabel: '150.72 MB'
    },
    {
      variant: 'safe-v3',
      modelUrl: '/models/lingshan/optimized/xiangfu-temple.safe-v3.glb',
      sizeLabel: '91.29 MB'
    }
  ],
  manlong_flying_tower: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/manlong-flying-tower.glb',
      sizeLabel: '89.12 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/manlong-flying-tower.safe-v2.glb',
      sizeLabel: '58.97 MB'
    }
  ],
  foqian_square: [
    {
      variant: 'raw',
      modelUrl: '/models/lingshan/landmarks/buddha-front-plaza.glb',
      sizeLabel: '31.13 MB'
    },
    {
      variant: 'safe-v2',
      modelUrl: '/models/lingshan/optimized/buddha-front-plaza.safe-v2.glb',
      sizeLabel: '16.80 MB'
    }
  ],
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
