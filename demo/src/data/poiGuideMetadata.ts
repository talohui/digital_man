import { guideSpots } from './guideData'
import { getLingshanPoiDetailById } from './lingshanPoiDetails'
import { getMapModelOverlayByPoiId } from './lingshanMapModelOverlays'
import { getPoiDetailContent } from './poiDetailContent'
import { getScenicPoiCatalogItem } from './scenicPoiCatalog'

const arrivalSummaries: Record<string, string> = {
  south_gate: '多条主题路线的共同起点，适合在入园前确认方向、同行人员和当天的游览节奏',
  lingshan_wall: '入园后的文化序章，题字、浮雕与照壁尺度共同建立灵山胜境的第一印象',
  shengjing_square: '承接入口人流与多条游览动线的开阔序厅，适合短暂停留并确认后续方向',
  fozu_tan: '以佛足意象承接礼佛开场，适合观察纹样并感受由入口走向核心景观的仪式序列',
  jiulong_guanyu: '莲花开启、太子佛与九龙喷水共同构成富有仪式感的动态佛诞景观',
  puti_avenue: '连接核心礼佛节点的林荫步道，适合在行走中感受中轴、树影与远近景观的变化',
  foshou_square: '以天下第一掌为核心的祈福互动广场，适合短暂停留、拍照并了解平安祝愿的寓意',
  xiangfu_temple: '承载小灵山历史线索的古刹空间，院落、古井与银杏共同呈现安静的参观层次',
  xingtan_square: '连接寺院区与大佛主轴的过渡广场，适合调整步行节奏并整理后续朝礼动线',
  foqian_square: '瞻礼灵山大佛前的重要前庭空间，适合先看佛像、台阶与广场的整体关系',
  giant_buddha: '灵山最具代表性的核心地标，可从佛像手印、登云道与太湖山水关系理解这一站',
  baizi_mile: '弥勒与百子群像呈现欢喜、包容的生活意象，是适合亲子观察与互动拍照的一站',
  fan_gong: '融合传统工艺与现代建筑的佛教艺术空间，穹顶、木雕与琉璃细节值得放慢脚步观看',
  fan_gong_square: '梵宫外部的开阔过渡空间，适合观看建筑轮廓、莲花圣塔与周边水景',
  wuyin_tancheng: '以坛城意象呈现藏传佛教建筑气质，金顶、红墙与香水海共同构成鲜明景观',
  manfeilong_tower: '九塔组合展现南传佛教建筑风格，适合从远处先看塔身、绿地与水景的关系',
  lingshan_jingshe: '相对安静的园林休憩节点，适合在连续游览中放慢节奏、感受庭院与绿意',
  sansheng_hall: '历史文化路线中的安静人文节点，适合回看前段建筑、礼佛与佛教文化线索',
  exit: '本次游览的收尾节点，适合确认同行人员、物品和返程安排，再回顾当天的路线体验'
}

/**
 * Guide-facing POI facts. Recommended stay time remains owned by
 * guideData.guideSpots; this module only provides a single UI-safe lookup.
 */
export function getRecommendedStayMinutes(poiId?: string | null) {
  if (!poiId) return undefined
  return guideSpots.find((spot) => spot.id === poiId)?.stayMinutes
}

export function getRecommendedStayLabel(poiId?: string | null) {
  const minutes = getRecommendedStayMinutes(poiId)
  return minutes === undefined ? '建议停留时间以现场安排为准' : `建议停留${minutes}分钟`
}

export function getPoiGuideDisplayName(poiId?: string | null) {
  if (!poiId) return undefined
  return guideSpots.find((spot) => spot.id === poiId)?.name ?? getScenicPoiCatalogItem(poiId)?.name
}

function getFirstSentence(value?: string) {
  const firstSentence = value?.split(/[。！？]/u)[0]?.trim()
  return firstSentence?.replace(/[，、；：]$/u, '')
}

/**
 * Arrival cards use a concise editorial summary instead of a page-level
 * template. Formal POIs have dedicated text; newly added POIs fall back to
 * their existing detail, guide-spot or catalog summary in that order.
 */
export function getPoiArrivalSummary(poiId?: string | null) {
  if (!poiId) return undefined

  const dedicated = arrivalSummaries[poiId]
  if (dedicated) return dedicated

  const detailContent = getPoiDetailContent(poiId)
  const detail = getLingshanPoiDetailById(poiId)
  const guideSpot = guideSpots.find((spot) => spot.id === poiId)
  const catalog = getScenicPoiCatalogItem(poiId)
  return getFirstSentence(detailContent?.overview)
    ?? getFirstSentence(detail?.intro)
    ?? getFirstSentence(guideSpot?.intro)
    ?? (catalog ? `${catalog.name}是灵山胜境中的游览节点，适合结合现场环境继续了解` : undefined)
}

/**
 * A model is mentioned to visitors only when the existing model registry has
 * a visible, non-missing GLB URL. Runtime loading success is intentionally
 * not inferred here.
 */
export function hasAvailablePoiGlbModel(poiId?: string | null) {
  if (!poiId) return false
  const model = getMapModelOverlayByPoiId(poiId)
  return Boolean(model?.visible && model.modelUrl && model.status !== 'missing_model')
}
