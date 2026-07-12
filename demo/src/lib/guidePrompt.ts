import type { GuideContext } from '../store/chatSessions'

const casualGreetingPatterns = [
  /^(你|您)?好[啊呀吗呢]?$|^哈喽$|^嗨$|^hi$|^hello$|^hey$/i,
  /^(早上好|上午好|中午好|下午好|晚上好|晚安)$/,
  /^(在吗|有人吗|小灵在吗|小灵你好)$/,
  /^(谢谢|谢了|感谢|好的|好|嗯|嗯嗯|知道了|明白了|可以|行)$/
]

const emotionalSupportPattern = /痛苦|绝望|崩溃|撑不住|想哭|难受|难过|伤心|焦虑|害怕|不开心|生气/
const explicitGuideIntentPattern = /灵山|大佛|梵宫|景点|路线|怎么走|在哪里|下一站|门票|开放|演出|交通|导航|讲解/

function normalizeCasualInput(content: string): string {
  return content
    .trim()
    .replace(/[，。！？!?,.、；;：:\s~～…]+/g, '')
}

export function isCasualTurn(content: string): boolean {
  const normalized = normalizeCasualInput(content)
  if (
    normalized.length <= 30 &&
    emotionalSupportPattern.test(normalized) &&
    !explicitGuideIntentPattern.test(normalized)
  ) {
    return true
  }
  if (!normalized || normalized.length > 8) return false
  return casualGreetingPatterns.some((pattern) => pattern.test(normalized))
}

export function buildGuidePrompt(content: string, guideContext: GuideContext | null) {
  if (!guideContext?.spotName && !guideContext?.routeName) {
    return content
  }

  if (isCasualTurn(content)) {
    return content
  }

  return [
    '你是灵山胜境的数字人讲解员，请根据游客问题决定是否使用当前导览场景。',
    guideContext.routeId || guideContext.spotId
      ? `导览场景：route_id=${guideContext.routeId ?? ''}; spot_id=${guideContext.spotId ?? ''}; source=${guideContext.locationSource ?? 'route-default'}; confidence=${guideContext.locationConfidence ?? 1}`
      : '',
    guideContext.routeName ? `当前路线：${guideContext.routeName}` : '',
    guideContext.spotName ? `当前景点：${guideContext.spotName}` : '',
    guideContext.spotIntro ? `景点简介：${guideContext.spotIntro}` : '',
    guideContext.spotNarrative ? `当前讲解重点：${guideContext.spotNarrative}` : '',
    guideContext.visitedSpotIds?.length
      ? `已游览景点ID：${guideContext.visitedSpotIds.join(',')}`
      : '',
    '只有当游客询问路线、景点、下一站、讲解、游玩建议或位置相关问题时，才结合当前场景回答。',
    '如果游客只是打招呼、寒暄、感谢或确认，请自然简短回应，不要主动展开路线或景点讲解。',
    `游客问题：${content}`
  ]
    .filter(Boolean)
    .join('\n')
}
