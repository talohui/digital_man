import type { GuidePreferenceKey, GuideRecommendationCard } from '../../../data/guideData'
import { SCENIC_MEDIA_FALLBACK } from '../../../data/scenicMediaCatalog'

export const ROUTE_REQUEST_PRESETS = [
  '下午带老人，想少走路，安静礼佛',
  '第一次来，想看经典景点和梵宫',
  '带孩子玩半天，希望轻松又有互动'
]

export function resolveRouteRequest(request: string) {
  const message = request.replace(/\s/g, '')
  const tags: string[] = []
  if (/孩子|儿童|亲子|家庭/.test(message)) tags.push('亲子游')
  if (/文化|历史|建筑|梵宫|艺术|佛教/.test(message)) tags.push('文化探秘')
  if (/祈福|礼佛|静心|安静|禅/.test(message)) tags.push('祈福静心')
  if (/轻松|慢游|漫步|休闲|不赶|从容/.test(message)) tags.push('轻松漫步')
  if (/拍照|打卡|摄影|出片/.test(message)) tags.push('拍照打卡')

  const preferences: Partial<Record<GuidePreferenceKey, string>> = {}
  if (/1[-—至到]?2小时|两小时|快速|时间紧/.test(message)) preferences.duration = 'quick'
  else if (/全天|一整天|深度|慢慢看/.test(message)) preferences.duration = 'deep'
  else if (/半天|半日/.test(message)) preferences.duration = 'half_day'
  if (/上午|早上|一早/.test(message)) preferences.arrival = 'morning'
  else if (/中午|午后/.test(message)) preferences.arrival = 'noon'
  else if (/下午|傍晚/.test(message)) preferences.arrival = 'afternoon'
  if (/孩子|儿童|亲子/.test(message)) preferences.companion = 'family'
  else if (/老人|长辈|父母/.test(message)) preferences.companion = 'elder'
  else if (/朋友|同学|同事/.test(message)) preferences.companion = 'friends'
  if (/少走|腿脚|体力|轻松|老人|长辈/.test(message)) preferences.walk = 'light'
  else if (/多走|徒步|体力好/.test(message)) preferences.walk = 'deep'
  if (/不看演出|不看表演|跳过演出/.test(message)) preferences.show = 'skip'
  else if (/想看演出|想看表演|吉祥颂|九龙灌浴/.test(message)) preferences.show = 'must'

  const signals = [
    tags.length ? `偏好${tags.join('、')}` : '',
    preferences.duration ? '游览时长' : '',
    preferences.arrival ? '到达时间' : '',
    preferences.companion ? '同行人群' : '',
    preferences.walk ? '步行强度' : '',
    preferences.show ? '演出安排' : ''
  ].filter(Boolean)

  return {
    tags,
    preferences,
    reply: signals.length
      ? `我听懂了你对${signals.join('、')}的想法，已经据此重新排卷。`
      : '我会沿用你当前的心愿与节奏，先推荐最顺路的一卷。也可以再告诉我同行人、到达时间、体力或最想看的内容。'
  }
}

export function scoreRoute(route: GuideRecommendationCard) {
  if (typeof route.matchScore === 'number') return `${Math.round(route.matchScore)}%`
  if (typeof route.score === 'number') return `${Math.max(86, Math.min(99, Math.round(86 + route.score / 24)))}%`
  return '优选'
}

export function getRouteCoverStyle(cover: string) {
  return { backgroundImage: `url("${cover}"), url("${SCENIC_MEDIA_FALLBACK}")` }
}
