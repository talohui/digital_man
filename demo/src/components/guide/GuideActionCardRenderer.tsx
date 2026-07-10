import { getLingshanPoiDetailById } from '../../data/lingshanPoiDetails'
import { getScenicRouteById, getRouteStops } from '../../data/lingshanScenicRoutes'
import type { GuideAction, GuideUiPayload } from '../../guide'
import { NavigationGuideCard } from './NavigationGuideCard'
import { PoiGuideCard } from './PoiGuideCard'
import { RouteRecommendationCard } from './RouteRecommendationCard'

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
      <div className="guide-action-card-list">
        {payload.items.map((item) => {
          const route = getScenicRouteById(item.routeId)
          if (!route) return null
          return (
            <RouteRecommendationCard
              key={item.routeId}
              card={{
                routeId: item.routeId,
                name: route.name,
                duration: route.guideRoute.durationLabel,
                stopCount: getRouteStops(item.routeId).length,
                reason: item.reason,
                tags: item.matchedTags.length
                  ? item.matchedTags.map(getInterestLabel)
                  : route.tags.slice(0, 2)
              }}
              primary={item.primary}
              onOpen={(routeId) => onAction({ type: 'open_route_preview', routeId })}
            />
          )
        })}
      </div>
    )
  }

  if (payload.type === 'poi_card') {
    const poi = getLingshanPoiDetailById(payload.poiId)
    return (
      <PoiGuideCard
        name={poi?.name ?? payload.poiId}
        description={payload.reason ?? poi?.subtitle ?? '查看景点导览详情。'}
        onOpen={() => onAction({ type: 'open_poi_detail', poiId: payload.poiId })}
      />
    )
  }

  if (payload.type === 'navigation_card') {
    return (
      <NavigationGuideCard
        title={payload.label}
        detail="导航能力将在正式定位接入后启用。"
        actionLabel="开始导航"
        onAction={() => onAction({ type: 'start_navigation', targetType: payload.targetType, targetId: payload.targetId })}
      />
    )
  }

  if (payload.type === 'next_stop_card') {
    const poiId = payload.poiId
    return (
      <NavigationGuideCard
        title={payload.name}
        detail={`下一站 · 第 ${payload.stopIndex + 1} 站`}
        actionLabel={poiId ? '查看景点' : undefined}
        onAction={poiId ? () => onAction({ type: 'open_poi_detail', poiId }) : undefined}
      />
    )
  }

  const route = getScenicRouteById(payload.routeId)
  return (
    <NavigationGuideCard
      title="路线进度"
      detail={`${route?.name ?? '当前路线'} · 第 ${payload.currentStopIndex + 1}/${payload.totalStops} 站`}
    />
  )
}
