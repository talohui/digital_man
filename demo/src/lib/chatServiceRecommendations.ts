export type ChatServiceCategory = 'food' | 'shopping' | 'transport'

export type ChatServiceCatalogProduct = {
  id: string
  name: string
  category: string
  price: number
  description: string
  spotIds: string[]
}

export type ChatServiceRecommendation = {
  category: ChatServiceCategory
  product: ChatServiceCatalogProduct
  reason: string
  personalized: boolean
}

export type ChatServiceRecommendationOptions = {
  question: string
  personalizationEnabled: boolean
  selectedSpotId?: string
  ticketType?: string
  groupSize?: number
}

const categoryMatchers: Array<{ category: ChatServiceCategory; pattern: RegExp }> = [
  { category: 'food', pattern: /(吃|餐饮|美食|素斋|饿|饭|喝|茶|小吃|点心)/ },
  { category: 'shopping', pattern: /(文创|纪念品|伴手礼|礼物|香囊|冰箱贴|明信片|特产|买什么|买点)/ },
  { category: 'transport', pattern: /(交通|电瓶车|观光车|接驳|停车|怎么去|怎么走|入口|出入口|少走|台阶)/ }
]

function matchedCategories(question: string): ChatServiceCategory[] {
  const normalized = question.trim()
  if (!normalized) return []
  return categoryMatchers
    .filter((matcher) => matcher.pattern.test(normalized))
    .map((matcher) => matcher.category)
}

function personalizedScore(product: ChatServiceCatalogProduct, category: ChatServiceCategory, options: ChatServiceRecommendationOptions): number {
  let score = 0
  if (options.selectedSpotId && product.spotIds.includes(options.selectedSpotId)) score += 100
  if (product.spotIds.length === 0) score += 20
  if (category === 'transport' && (options.groupSize ?? 1) >= 3 && product.id === 'p_trans_pass') score += 70
  if (category === 'shopping' && options.ticketType === 'culture' && product.id === 'p_shop_postcard') score += 24
  if (category === 'food' && options.ticketType === 'family' && product.id === 'p_food_congee') score += 18
  return score
}

function recommendationReason(product: ChatServiceCatalogProduct, category: ChatServiceCategory, options: ChatServiceRecommendationOptions): string {
  if (!options.personalizationEnabled) return '来自景区服务目录'
  if (options.selectedSpotId && product.spotIds.includes(options.selectedSpotId)) return '结合当前所在景点筛选'
  if (category === 'transport' && (options.groupSize ?? 1) >= 3 && product.id === 'p_trans_pass') return '适合多人当日园内接驳'
  return '景区服务目录推荐'
}

export function getChatServiceRecommendations(
  options: ChatServiceRecommendationOptions,
  catalog: ChatServiceCatalogProduct[]
): ChatServiceRecommendation[] {
  const categories = matchedCategories(options.question)
  if (categories.length === 0) return []

  return categories
    .flatMap((category) =>
      catalog
        .filter((product) => product.category === category)
        .sort((left, right) => {
          if (options.personalizationEnabled) {
            const scoreDifference = personalizedScore(right, category, options) - personalizedScore(left, category, options)
            if (scoreDifference !== 0) return scoreDifference
          }
          return left.price - right.price || left.id.localeCompare(right.id)
        })
        .slice(0, 3)
        .map((product) => ({
          category,
          product,
          reason: recommendationReason(product, category, options),
          personalized: options.personalizationEnabled
        }))
    )
    .slice(0, 3)
}
