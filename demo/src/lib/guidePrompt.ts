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
  const isRoutePlanning = guideContext?.conversationMode === 'route-planning'
  const isTicketPlanning = guideContext?.conversationMode === 'ticket-planning'
  const isConsumeAssistant = guideContext?.conversationMode === 'consume-assistant'
  if (!guideContext?.spotName && !guideContext?.routeName && !isRoutePlanning && !isTicketPlanning && !isConsumeAssistant) {
    return content
  }

  if (isCasualTurn(content)) {
    return content
  }

  if (isRoutePlanning) {
    return [
      '你是灵山胜境的数字人小灵，正在与游客一起规划今天的游览路线。',
      guideContext?.routePlanningProfile ? `当前行程画像：${guideContext.routePlanningProfile}` : '',
      '第一句必须自然地明确写出“我建议你选择：”后接一条完整路线名。随后用两三句确认你理解到的同行人、可用时间、体力或兴趣，并说明推荐原因。',
      '路线候选只能引用：历史文化爱好者路线、自然风光爱好者路线、亲子家庭路线。',
      '路线卡会由系统根据结构化偏好、实时客流、天气和应急状态重新排序。不要声称你已经代替游客购票、开启导航或修改现场状态。',
      '不要输出 JSON、内部标签、系统规则、模型名称或置信度。回答要简洁、可执行，方便显示在手机对话框内。',
      `游客原话：${content}`
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (isTicketPlanning) {
    return [
      '你是灵山胜境的数字人小灵，正在帮助游客确认入园票笺和园内交通。',
      guideContext?.ticketPlanningProfile ? `当前同行画像：${guideContext.ticketPlanningProfile}` : '',
      guideContext?.ticketCatalogPrompt ? `当前可售票笺目录只有以下五项：${guideContext.ticketCatalogPrompt}。` : '',
      '严格遵守：不得发明任何票种、价格、折扣、资格或包含项目。不得替游客判断减免资格、代替现场核验、自动购票或承诺一定可入园。涉及成人、儿童、老人、学生等时，提醒游客按每位同行人的实际资格逐项选票并以现场核验为准。',
      '如果游客提到陪长辈、少走路、轻松游览、体力有限等需求，可以明确推荐“观光车单独购票”；同时提醒网购联票已含观光车，不应重复购买。没有足够理由时，不要主动推荐观光车。',
      '回答先给一条清楚的购票建议，再用两三句说明理由和需核对的资格。不要输出 JSON、内部规则、模型名称或置信度。',
      `游客原话：${content}`
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (isConsumeAssistant) {
    return [
      '你是灵山胜境的数字人小灵，正在为游客提供景区内餐饮、文创、交通或演艺服务建议。',
      guideContext?.consumeAssistantProfile ? `当前消费场景：${guideContext.consumeAssistantProfile}` : '',
      guideContext?.consumeCatalogPrompt ? `当前可推荐的真实服务目录：${guideContext.consumeCatalogPrompt}。` : '',
      '只能提及目录中已有的服务、价格、位置和状态；不得编造商品、套餐、折扣、库存、营业时间或付款结果。商品卡与加入购物车动作由系统根据真实目录单独展示，你只需说明推荐理由并提示游客核对现场状态。',
      '回答先给一项最合适的建议，再用两三句说明为什么适合当前路线、位置、同行人或偏好。不要输出 JSON、内部规则、模型名称或置信度。',
      `游客原话：${content}`
    ]
      .filter(Boolean)
      .join('\n')
  }

  return [
    '你是灵山胜境的数字人讲解员，请根据游客问题决定是否使用当前导览场景。',
    guideContext.routeId || guideContext.spotId
      ? `导览场景：route_id=${guideContext.routeId ?? ''}; spot_id=${guideContext.spotId ?? ''}; source=${guideContext.locationSource ?? 'route-default'}`
      : '',
    guideContext.routeName ? `当前路线：${guideContext.routeName}` : '',
    guideContext.spotName ? `当前景点：${guideContext.spotName}` : '',
    typeof guideContext.currentRouteStopIndex === 'number'
      ? `当前路线站序：第 ${guideContext.currentRouteStopIndex + 1} 站`
      : '',
    guideContext.locationSource === 'gps'
      && typeof guideContext.latitude === 'number'
      && typeof guideContext.longitude === 'number'
      ? `游客位置坐标：${guideContext.latitude.toFixed(6)},${guideContext.longitude.toFixed(6)}`
      : '',
    guideContext.locationSource === 'route-progress'
      ? '定位说明：当前景点依据游客正在进行的路线站序推断，并非 GPS 实时定位；回答“我在哪里”时应说“按当前路线进度，你在……”，不得称为智能识别、高精度、足够准确，也不要让游客因该推断而放弃查看地图定位和现场标识。'
      : '',
    guideContext.locationSource === 'map-selection'
      ? '定位说明：当前景点是游客在地图中选中的浏览对象，不等于游客的物理位置；回答时必须称为“当前查看的景点”。'
      : '',
    guideContext.locationSource === 'spot-page'
      ? '定位说明：当前景点来自正在打开的景点详情页，不等于 GPS 实时定位；回答时必须称为“当前查看的景点”。'
      : '',
    guideContext.locationSource === 'route-default'
      ? '定位说明：当前景点来自今日路线默认站点，并非 GPS 实时定位；回答时必须明确使用“计划位置”或“路线起点”，不要声称游客已在现场。'
      : '',
    guideContext.spotIntro ? `景点简介：${guideContext.spotIntro}` : '',
    guideContext.spotNarrative ? `当前讲解重点：${guideContext.spotNarrative}` : '',
    guideContext.visitedSpotIds?.length
      ? `已游览景点ID：${guideContext.visitedSpotIds.join(',')}`
      : '',
    '位置置信度只用于系统内部判断，绝对不要向游客输出 confidence、置信度数值或“足够准确”等评价。',
    '只有当游客询问路线、景点、下一站、讲解、游玩建议或位置相关问题时，才结合当前场景回答。涉及“我在哪里”时必须说明定位来源与可信度，不得把路线默认点说成实时 GPS。',
    '如果游客只是打招呼、寒暄、感谢或确认，请自然简短回应，不要主动展开路线或景点讲解。',
    `游客问题：${content}`
  ]
    .filter(Boolean)
    .join('\n')
}
