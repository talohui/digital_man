import { SCENIC_MEDIA_POI_IDS, type PoiId } from './scenicMediaCatalog'

export type PoiReviewSample = {
  id: string
  rating: number
  tags: string[]
  text: string
  createdAt: string
}

export type PoiDetailPresentationConfig = {
  template: 'editorial'
  transparentModelBackdrop: boolean
  companionPrompt: string
  review: {
    averageRating: number
    reviewCount: number
    samples?: PoiReviewSample[]
  }
}

const DEFAULT_CONFIG: PoiDetailPresentationConfig = {
  template: 'editorial',
  transparentModelBackdrop: true,
  companionPrompt: '请继续为我讲解{spotName}，并告诉我现场最值得留意的细节。',
  review: {
    averageRating: 4.7,
    reviewCount: 48
  }
}

const POI_DETAIL_PRESENTATION_OVERRIDES: Partial<Record<PoiId, Partial<PoiDetailPresentationConfig>>> = {
  giant_buddha: {
    review: {
      averageRating: 4.8,
      reviewCount: 128,
      samples: [
        {
          id: 'sample-overall-view',
          rating: 5,
          tags: ['庄严震撼', '视野开阔'],
          text: '建议先在佛前广场看整体，再慢慢上行，视角变化很有层次。',
          createdAt: '近期到访'
        },
        {
          id: 'sample-guide-detail',
          rating: 5,
          tags: ['讲解有帮助', '值得登临'],
          text: '听完手印和登云道的讲解后再看大佛，理解会更完整。',
          createdAt: '近期到访'
        }
      ]
    }
  },
  fan_gong: {
    review: {
      averageRating: 4.7,
      reviewCount: 96,
      samples: [
        {
          id: 'sample-fan-gong-dome',
          rating: 5,
          tags: ['庄严震撼', '讲解有帮助'],
          text: '进门后记得抬头看穹顶，跟着讲解慢慢看工艺细节会更有收获。',
          createdAt: '近期到访'
        },
        {
          id: 'sample-fan-gong-show',
          rating: 5,
          tags: ['值得登临', '拍照出片'],
          text: '建筑外观适合在广场留影，若要看演出建议提前看当天场次。',
          createdAt: '近期到访'
        }
      ]
    }
  }
}

export const POI_DETAIL_PRESENTATION_CONFIGS: Record<PoiId, PoiDetailPresentationConfig> = Object.fromEntries(
  SCENIC_MEDIA_POI_IDS.map((poiId) => {
    const override = POI_DETAIL_PRESENTATION_OVERRIDES[poiId]
    return [
      poiId,
      {
        ...DEFAULT_CONFIG,
        ...override,
        review: { ...DEFAULT_CONFIG.review, ...override?.review }
      }
    ]
  })
) as Record<PoiId, PoiDetailPresentationConfig>

export function getPoiDetailPresentationConfig(poiId?: string): PoiDetailPresentationConfig {
  return poiId && poiId in POI_DETAIL_PRESENTATION_CONFIGS
    ? POI_DETAIL_PRESENTATION_CONFIGS[poiId as PoiId]
    : DEFAULT_CONFIG
}

export function getPoiReviewSamples({
  poiId,
  spotName,
  primaryHighlight,
  config
}: {
  poiId: string
  spotName: string
  primaryHighlight: string
  config: PoiDetailPresentationConfig
}): PoiReviewSample[] {
  if (config.review.samples?.length) return config.review.samples

  return [
    {
      id: `sample-${poiId}-view`,
      rating: 5,
      tags: ['值得登临', '讲解有帮助'],
      text: `${spotName}的${primaryHighlight}很值得慢慢看，结合现场讲解会更容易理解。`,
      createdAt: '近期到访'
    },
    {
      id: `sample-${poiId}-pace`,
      rating: 5,
      tags: ['拍照出片', '视野开阔'],
      text: `建议为${spotName}预留一点停留时间，按现场动线慢慢游览会更舒服。`,
      createdAt: '近期到访'
    }
  ]
}
