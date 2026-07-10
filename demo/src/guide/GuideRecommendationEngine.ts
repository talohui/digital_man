import { scenicRouteConfigs } from '../data/lingshanScenicRoutes'
import type { RouteRecommendationItem, ScenicRouteId, UserTravelPreferences } from './GuideMessageSchema'

type RouteProfile = {
  routeId: ScenicRouteId
  interests: UserTravelPreferences['interests']
  pace: NonNullable<UserTravelPreferences['pace']>
  suitableFor: NonNullable<UserTravelPreferences['companions']>[]
}

const profiles: RouteProfile[] = [
  { routeId: 'historical_culture', interests: ['culture'], pace: 'intensive', suitableFor: ['solo', 'couple', 'friends'] },
  { routeId: 'prayer_meditation', interests: ['prayer', 'relax', 'culture'], pace: 'relaxed', suitableFor: ['solo', 'elderly', 'couple'] },
  { routeId: 'highlights_checkin', interests: ['photo', 'culture'], pace: 'normal', suitableFor: ['solo', 'couple', 'friends'] },
  { routeId: 'natural_scenery', interests: ['nature', 'photo', 'relax'], pace: 'relaxed', suitableFor: ['solo', 'couple', 'elderly', 'friends'] },
  { routeId: 'family', interests: ['family', 'relax'], pace: 'relaxed', suitableFor: ['family', 'elderly'] }
]

const reasons: Record<ScenicRouteId, string> = {
  historical_culture: '佛教历史与建筑内容最集中，适合深入了解灵山人文主线',
  prayer_meditation: '节奏舒缓，适合祈福、礼佛与静心漫步',
  highlights_checkin: '核心地标集中，更适合时间有限时游览和拍照',
  natural_scenery: '山水林景更丰富，适合放慢脚步欣赏自然风光',
  family: '游览节奏轻松，适合亲子同行和趣味体验'
}

export function extractTravelPreferences(text: string, previous?: UserTravelPreferences): UserTravelPreferences {
  const interests = new Set(previous?.interests ?? [])
  if (/拍照|拍摄|打卡|出片/.test(text)) interests.add('photo')
  if (/历史|文化|建筑|佛教/.test(text)) interests.add('culture')
  if (/祈福|礼佛|静心|禅/.test(text)) interests.add('prayer')
  if (/自然|风光|山水|林景/.test(text)) interests.add('nature')
  if (/孩子|儿童|亲子/.test(text)) interests.add('family')
  if (/轻松|不累|老人|慢慢/.test(text)) interests.add('relax')

  const hourMatch = text.match(/(\d+(?:\.\d+)?|一|两|二|三|四|五|六|七|八)\s*(?:个)?小时/)
  const minuteMatch = text.match(/(\d+)\s*分钟/)
  const chineseHours: Record<string, number> = { 一: 1, 两: 2, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8 }
  const availableMinutes = hourMatch
    ? Math.round((chineseHours[hourMatch[1]] ?? Number(hourMatch[1])) * 60)
    : minuteMatch
      ? Number(minuteMatch[1])
      : previous?.availableMinutes

  const companions = /孩子|儿童|亲子/.test(text)
    ? 'family'
    : /老人|长辈/.test(text)
      ? 'elderly'
      : previous?.companions
  const pace = /轻松|不累|慢慢|静心/.test(text) ? 'relaxed' : previous?.pace

  return { availableMinutes, interests: [...interests], pace, companions }
}

export function recommendScenicRoutes(preferences: UserTravelPreferences): RouteRecommendationItem[] {
  const scored = profiles.map((profile) => {
    const route = scenicRouteConfigs.find((item) => item.id === profile.routeId)
    const interestHits = preferences.interests.filter((item) => profile.interests.includes(item)).length
    const duration = route?.estimatedMinutes ?? 240
    let score = interestHits * 5
    if (preferences.pace && preferences.pace === profile.pace) score += 2
    if (preferences.companions && profile.suitableFor.includes(preferences.companions)) score += 3
    if (preferences.availableMinutes) {
      const overrun = duration - preferences.availableMinutes
      score += overrun <= 0 ? 3 : Math.max(-6, -Math.ceil(overrun / 60) * 2)
    }
    if (preferences.availableMinutes && preferences.availableMinutes <= 150 && profile.routeId === 'highlights_checkin') score += 7
    return { profile, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, 3).map(({ profile }, index) => ({
    routeId: profile.routeId,
    reason: reasons[profile.routeId],
    primary: index === 0,
    matchedTags: profile.interests.filter((item) => preferences.interests.includes(item))
  }))
}
