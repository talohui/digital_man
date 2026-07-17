export type RecommendationEngineStat = {
  engine: string
  count: number
}

export function visibleRecommendationEngines(items: RecommendationEngineStat[]) {
  return items.filter(({ engine }) => !/gorse|协同过滤/i.test(engine))
}
