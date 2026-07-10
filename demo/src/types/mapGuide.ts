export type MapViewMode = 'browse' | 'route' | 'poi'

export type RouteStage = 'preview' | 'active' | 'arrived' | 'paused' | 'completed'

export type XiaolingMode = 'browse' | 'route' | 'poi'

export type PoiEntrySource = 'browse' | 'route' | 'ai'

export type MapGuideState = {
  viewMode: MapViewMode
  routeId?: string
  routeStage?: RouteStage
  poiId?: string
  stopIndex?: number
  source?: PoiEntrySource
  xiaolingMode: XiaolingMode
}

export type BrowseGuideContext = {
  mode: 'browse'
  scenicName: '灵山胜境'
  recommendedRouteId?: string
  recommendedRouteName?: string
  selectedPoiId?: string
  selectedPoiName?: string
}

export type RouteGuideContext = {
  mode: 'route'
  routeId: string
  routeName: string
  routeStage: Extract<RouteStage, 'preview' | 'active' | 'arrived'>
  progressText?: string
  currentStopIndex?: number
  currentStopName?: string
  nextStopIndex?: number
  nextStopName?: string
  distanceToNext?: string
  etaToNext?: string
}

export type PoiGuideContext = {
  mode: 'poi'
  poiId: string
  poiName: string
  from: PoiEntrySource
  routeId?: string
  routeName?: string
  stopIndex?: number
}

export type XiaolingGuideContext = BrowseGuideContext | RouteGuideContext | PoiGuideContext

export const ROUTE_STAGES = ['preview', 'active', 'arrived', 'paused', 'completed'] as const satisfies readonly RouteStage[]

export const POI_ENTRY_SOURCES = ['browse', 'route', 'ai'] as const satisfies readonly PoiEntrySource[]

export const BROWSE_MODE_QUESTIONS = [
  '我还有 1 小时怎么逛？',
  '最近的厕所在哪？',
  '这附近有什么好拍的？',
  '给我讲讲这个景点',
  '推荐一条适合我的路线'
] as const

export const ROUTE_MODE_QUESTIONS = [
  '下一站怎么走？',
  '讲讲下一站',
  '我想跳过这一站',
  '附近有休息点吗？',
  '还有多久到？'
] as const

export const POI_MODE_QUESTION_MAP: Record<string, readonly string[]> = {
  giant_buddha: ['灵山大佛有什么看点？', '216 级台阶有什么寓意？', '抱佛脚怎么安排更顺？', '哪里适合拍大佛全景？'],
  fan_gong: ['梵宫最值得看什么？', '《灵山吉祥颂》什么时候看？', '穹顶和琉璃作品怎么看？', '参观梵宫要注意什么？'],
  wuyin_tancheng: ['五印坛城有什么看点？', '转经筒应该怎么转？', '这里和梵宫有什么不同？', '雨天游览要注意什么？'],
  xiangfu_temple: [
    '祥符禅寺有什么看点？',
    '建筑格局有什么讲究？',
    '礼佛顺序应该怎么走？',
    '下一站接哪里比较顺？'
  ],
  jiulong_guanyu: [
    '九龙灌浴讲的是什么故事？',
    '什么时候看表演最好？',
    '这里适合拍照吗？',
    '站在哪个位置看更好？'
  ],
  jiulong_bath: [
    '九龙灌浴讲的是什么故事？',
    '什么时候看表演最好？',
    '这里适合拍照吗？',
    '站在哪个位置看更好？'
  ],
  lingshan_wall: ['大照壁为什么重要？', '赵朴初题字有什么来历？', '这里怎么拍更好看？', '看完大照壁往哪里走？'],
  foshou_square: ['佛手广场怎么祈福？', '天下第一掌有什么寓意？', '这里适合停留多久？', '下一站怎么接大佛？'],
  foqian_square: ['佛前广场怎么看大佛？', '登台前要注意什么？', '哪里适合拍仰视角？', '继续往上怎么走？'],
  puti_avenue: ['菩提大道有什么寓意？', '这里适合拍照吗？', '走这段路要多久？', '前面接哪个景点？'],
  shengjing_square: ['胜境广场有什么作用？', '这里适合集合吗？', '从这里怎么规划路线？', '附近有什么核心景点？'],
  sansheng_hall: ['三圣殿有什么看点？', '这里适合礼佛吗？', '历史文化路线到这里怎么看？', '下一站怎么安排？'],
  baizi_mile: ['百子戏弥勒有什么寓意？', '适合亲子互动吗？', '这里怎么拍更有趣？', '摸弥勒肚皮有什么说法？'],
  manfeilong_tower: ['曼飞龙塔是什么风格？', '九塔组合有什么寓意？', '和五印坛城怎么对比？', '雨天游览要注意什么？']
}

export function isRouteStage(value: string | null | undefined): value is RouteStage {
  return ROUTE_STAGES.includes(value as RouteStage)
}

export function isPoiEntrySource(value: string | null | undefined): value is PoiEntrySource {
  return POI_ENTRY_SOURCES.includes(value as PoiEntrySource)
}

export function parseStopParam(value: string | null | undefined): number | undefined {
  if (!value) {
    return undefined
  }

  const stopNumber = Number(value)
  if (!Number.isInteger(stopNumber) || stopNumber <= 0) {
    return undefined
  }

  return stopNumber - 1
}

export function formatStopParam(stopIndex: number): string {
  return String(Math.max(0, stopIndex) + 1)
}
