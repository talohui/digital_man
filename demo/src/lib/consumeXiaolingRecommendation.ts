import { getGuideSpotById, type GuidePreferenceContext, type GuideSpot } from '../data/guideData'
import { lingshanProducts, type Product } from '../data/shopData'
import type { PurchaseCategory } from '../store/useTicketStore'

export type ConsumeAssistantRecommendation = {
  product: Product
  rank: number
  reason: string
  distanceLabel?: string
}

export type ConsumeAssistantResult = {
  response: string
  recommendations: ConsumeAssistantRecommendation[]
  source: 'catalog-rule'
}

export type ConsumeAssistantRequest = {
  category: PurchaseCategory
  question: string
  selectedSpotId?: string
  selectedTags: readonly string[]
  preferences: GuidePreferenceContext
  personalizationEnabled: boolean
  variation?: number
}

export const CONSUME_ASSISTANT_QUICK_QUESTIONS: Record<PurchaseCategory, string[]> = {
  food: ['我想吃一点清凉的', '想找素食', '带孩子吃什么方便', '推荐离我最近的', '有什么不用排队的'],
  shopping: ['推荐100元以内的', '想买适合送人的', '有什么祈福纪念品', '推荐方便携带的', '有景区限定款吗'],
  transport: ['怎么走路最少', '去下一站最快的方式', '带老人怎么坐车', '有没有无障碍路线'],
  entertainment: ['最近一场演出是什么', '推荐适合亲子的', '想找室内避暑项目', '半小时内能看的演出']
}

const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  food: '餐饮斋茶',
  shopping: '文创礼品',
  transport: '园内交通',
  entertainment: '演艺秀场'
}

function toRadians(value: number) {
  return value * Math.PI / 180
}

function distanceInMeters(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number }
) {
  const earthRadius = 6371000
  const deltaLat = toRadians(to.lat - from.lat)
  const deltaLng = toRadians(to.lng - from.lng)
  const a = Math.sin(deltaLat / 2) ** 2
    + Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(deltaLng / 2) ** 2
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(meters: number) {
  if (meters < 1000) return `约 ${Math.max(10, Math.round(meters / 10) * 10)} 米`
  return `约 ${(meters / 1000).toFixed(1)} 公里`
}

function getDistanceLabel(product: Product, selectedSpotId?: string) {
  const currentSpot = getGuideSpotById(selectedSpotId)
  if (!currentSpot || product.spotIds.length === 0) return undefined
  const targets = product.spotIds
    .map((spotId) => getGuideSpotById(spotId))
    .filter((spot): spot is GuideSpot => Boolean(spot))
  if (!targets.length) return undefined
  const nearest = targets.reduce((closest, target) => {
    const distance = distanceInMeters(currentSpot, target)
    return distance < closest ? distance : closest
  }, Number.POSITIVE_INFINITY)
  return Number.isFinite(nearest) ? formatDistance(nearest) : undefined
}

function scoreProduct(product: Product, request: ConsumeAssistantRequest) {
  const question = request.question.replace(/\s/g, '')
  let score = product.category === request.category ? 100 : Number.NEGATIVE_INFINITY
  if (!Number.isFinite(score)) return score

  const has = (pattern: RegExp) => pattern.test(question)
  if (request.personalizationEnabled && request.selectedSpotId && product.spotIds.includes(request.selectedSpotId)) score += 80
  if (request.personalizationEnabled && request.preferences.walk === 'light' && product.category === 'transport') score += 44
  if (request.personalizationEnabled && request.preferences.companion === 'elder' && product.category === 'transport') score += 36
  if (request.personalizationEnabled && request.preferences.companion === 'family' && product.category === 'entertainment') score += 28
  if (request.personalizationEnabled && request.selectedTags.includes('祈福静心') && /祈福|禅|素斋|茶/.test(`${product.name}${product.description}`)) score += 24

  if (has(/清凉|热|避暑|冰饮/)) score += /茶/.test(product.name) ? 70 : product.category === 'entertainment' ? 26 : 0
  if (has(/素食|素斋|清淡/)) score += product.category === 'food' ? 48 : 0
  if (has(/孩子|亲子/)) score += product.category === 'food' || product.category === 'entertainment' ? 34 : 0
  if (has(/最近|附近/)) score += request.selectedSpotId && product.spotIds.includes(request.selectedSpotId) ? 72 : 0
  if (has(/100|预算|便宜/)) score += product.price !== null && product.price <= 100 ? 42 : 0
  if (has(/送人|礼物|伴手/)) score += product.category === 'shopping' ? 42 : 0
  if (has(/祈福|纪念/)) score += /祈福/.test(product.name) ? 68 : 0
  if (has(/携带/)) score += product.category === 'shopping' ? 30 : 0
  if (has(/少走|最快|老人|无障碍/)) score += product.category === 'transport' ? 66 : 0
  if (has(/演出|场次|半小时|室内/)) score += product.category === 'entertainment' ? 62 : 0
  if (product.orderable) score += 6
  return score
}

function getReason(product: Product, request: ConsumeAssistantRequest, distanceLabel?: string) {
  const currentSpot = getGuideSpotById(request.selectedSpotId)
  if (request.personalizationEnabled && currentSpot && product.spotIds.includes(currentSpot.id)) {
    return `就在${currentSpot.name}，${product.availabilityLabel}。`
  }
  if (distanceLabel && currentSpot) return `从${currentSpot.name}前往${distanceLabel}，${product.availabilityLabel}。`
  if (request.personalizationEnabled && request.preferences.walk === 'light' && product.category === 'transport') {
    return '结合“少走路”的游览偏好筛选，具体运营以现场说明为准。'
  }
  return `${product.locationLabel} · ${product.availabilityLabel}。`
}

export function getConsumeAssistantRecommendation(request: ConsumeAssistantRequest): ConsumeAssistantResult {
  const ranked = lingshanProducts
    .filter((product) => product.category === request.category)
    .map((product) => ({
      product,
      score: scoreProduct(product, request),
      distanceLabel: getDistanceLabel(product, request.selectedSpotId)
    }))
    .sort((left, right) => {
      const scoreDifference = right.score - left.score
      if (scoreDifference !== 0) return scoreDifference
      const leftPrice = left.product.price ?? Number.POSITIVE_INFINITY
      const rightPrice = right.product.price ?? Number.POSITIVE_INFINITY
      return leftPrice - rightPrice || left.product.id.localeCompare(right.product.id)
    })

  const variation = Math.max(0, request.variation ?? 0)
  const rotated = ranked.length > 1
    ? [...ranked.slice(variation % ranked.length), ...ranked.slice(0, variation % ranked.length)]
    : ranked
  const recommendations = rotated.slice(0, 3).map((item, index) => ({
    product: item.product,
    rank: index + 1,
    distanceLabel: item.distanceLabel,
    reason: getReason(item.product, request, item.distanceLabel)
  }))
  const first = recommendations[0]
  const categoryLabel = CATEGORY_LABELS[request.category]
  const queueNotice = /排队/.test(request.question) ? ' 当前未接入实时排队数据，我不会据此判断等候时长。' : ''
  const personalizationNotice = request.personalizationEnabled ? ' 已结合当前景点、路线偏好筛选。' : ' 你已关闭个性化，因此仅按景区服务目录筛选。'

  return {
    source: 'catalog-rule',
    recommendations,
    response: first
      ? `我从${categoryLabel}的真实服务目录中挑了“${first.product.name}”等 ${recommendations.length} 项。${first.reason}${personalizationNotice}${queueNotice}`
      : `当前${categoryLabel}目录暂未收录可推荐服务，请以景区现场公告为准。`
  }
}
