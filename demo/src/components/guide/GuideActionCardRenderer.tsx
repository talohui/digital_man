import { getLingshanPoiDetailById } from '../../data/lingshanPoiDetails'
import { getScenicRouteById, getRouteStops } from '../../data/lingshanScenicRoutes'
import type { GuideAction, GuideUiPayload } from '../../guide'
import { GuideRecommendationCard } from './GuideRecommendationCard'

const INTEREST_LABELS = {
  culture: '文化建筑',
  prayer: '祈福礼佛',
  photo: '拍照打卡',
  nature: '自然风光',
  family: '亲子同行',
  relax: '轻松慢游'
} as const

function getInterestLabel(tag: string) {
  return INTEREST_LABELS[tag as keyof typeof INTEREST_LABELS] ?? tag
}

export function GuideActionCardRenderer({
  payload,
  onAction
}: {
  payload: GuideUiPayload
  onAction: (action: GuideAction) => void
}) {
  if (payload.type === 'route_cards') {
    return (
      <div className="guide-action-card-list guide-action-card-list--routes" aria-label="推荐路线">
        {payload.items.map((item) => {
          const route = getScenicRouteById(item.routeId)
          if (!route) return null
          const stops = getRouteStops(item.routeId)
          const cover = stops
            .map((stop) => stop.poiId ? getLingshanPoiDetailById(stop.poiId)?.photo : undefined)
            .find(Boolean)
          return (
            <GuideRecommendationCard
              key={item.routeId}
              card={{
                kind: 'route',
                typeLabel: '路线推荐',
                title: route.name,
                facts: [route.guideRoute.durationLabel, `${stops.length} 个景点`],
                reason: item.reason,
                tags: item.matchedTags.length
                  ? item.matchedTags.map(getInterestLabel)
                  : route.tags.slice(0, 2),
                image: cover ? { src: cover.url, fallbackSrc: cover.fallbackUrl, alt: cover.alt } : undefined,
                actionLabel: '查看路线'
              }}
              primary={item.primary}
              onAction={() => onAction({ type: 'open_route_preview', routeId: item.routeId })}
            />
          )
        })}
      </div>
    )
  }

  if (payload.type === 'poi_card') {
    const poi = getLingshanPoiDetailById(payload.poiId)
    return (
      <GuideRecommendationCard
        card={{
          kind: 'poi',
          typeLabel: '景点导览',
          title: poi?.name ?? payload.poiId,
          description: poi?.subtitle ?? '查看景点导览详情。',
          reason: payload.reason,
          image: poi?.photo ? { src: poi.photo.url, fallbackSrc: poi.photo.fallbackUrl, alt: poi.photo.alt } : undefined,
          actionLabel: '查看景点'
        }}
        onAction={() => onAction({ type: 'open_poi_detail', poiId: payload.poiId })}
      />
    )
  }

  if (payload.type === 'navigation_card') {
    return (
      <GuideRecommendationCard
        card={{
          kind: 'navigation',
          typeLabel: '路线提醒',
          title: payload.label,
          description: '导航能力将在正式定位接入后启用。',
          actionLabel: '开始导航'
        }}
        onAction={() => onAction({ type: 'start_navigation', targetType: payload.targetType, targetId: payload.targetId })}
      />
    )
  }

  if (payload.type === 'next_stop_card') {
    const poiId = payload.poiId
    return (
      <GuideRecommendationCard
        card={{
          kind: 'next-stop',
          typeLabel: '下一站',
          title: payload.name,
          facts: [`第 ${payload.stopIndex + 1} 站`],
          actionLabel: poiId ? '查看景点' : undefined
        }}
        onAction={poiId ? () => onAction({ type: 'open_poi_detail', poiId }) : undefined}
      />
    )
  }

  const route = getScenicRouteById(payload.routeId)
  return (
    <GuideRecommendationCard
      card={{
        kind: 'progress',
        typeLabel: '路线进度',
        title: route?.name ?? '当前路线',
        facts: [`第 ${payload.currentStopIndex + 1}/${payload.totalStops} 站`]
      }}
    />
  )
}
