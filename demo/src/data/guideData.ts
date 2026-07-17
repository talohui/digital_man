export const GUIDE_TAGS = ['亲子游', '文化探秘', '祈福静心', '轻松漫步', '拍照打卡'] as const

export type GuideTag = (typeof GUIDE_TAGS)[number]

export type GuidePreferenceKey = 'duration' | 'arrival' | 'companion' | 'walk' | 'show'

export type GuidePreferenceContext = Record<GuidePreferenceKey, string>

export const DEFAULT_GUIDE_PREFERENCES: GuidePreferenceContext = {
  duration: 'half_day',
  arrival: 'morning',
  companion: 'friends',
  walk: 'normal',
  show: 'flexible'
}

export const GUIDE_PREFERENCE_GROUPS: Array<{
  key: GuidePreferenceKey
  label: string
  options: Array<{ value: string; label: string }>
}> = [
  {
    key: 'duration',
    label: '游览时长',
    options: [
      { value: 'quick', label: '1-2 小时' },
      { value: 'half_day', label: '半日游' },
      { value: 'deep', label: '深度游' }
    ]
  },
  {
    key: 'arrival',
    label: '到达时间',
    options: [
      { value: 'morning', label: '上午' },
      { value: 'noon', label: '中午' },
      { value: 'afternoon', label: '下午' }
    ]
  },
  {
    key: 'companion',
    label: '同行人群',
    options: [
      { value: 'friends', label: '朋友' },
      { value: 'family', label: '亲子' },
      { value: 'elder', label: '老人' }
    ]
  },
  {
    key: 'walk',
    label: '步行强度',
    options: [
      { value: 'light', label: '少走路' },
      { value: 'normal', label: '正常' },
      { value: 'deep', label: '可多走' }
    ]
  },
  {
    key: 'show',
    label: '演出安排',
    options: [
      { value: 'must', label: '想看' },
      { value: 'flexible', label: '随缘' },
      { value: 'skip', label: '不看' }
    ]
  }
]

export type LatLngPoint = {
  lat: number
  lng: number
}

export type GuideSpot = {
  id: string
  name: string
  lat: number
  lng: number
  stayMinutes: number
  intro: string
}

export type GuideRouteStop = {
  spotId: string
  narrative: string
}

// 步行强度为路线的静态属性（基于路线长度与地形预估），不是实时人流/排队数据
export type WalkIntensity = '轻松' | '适中' | '较多步行'

export type GuideRoute = {
  id: string
  name: string
  durationLabel: string
  tags: GuideTag[]
  description: string
  // 路线封面图（灵山实拍），用于图卡式路线展示
  cover: string
  stops: GuideRouteStop[]
  experiences: string[]
  walkIntensity: WalkIntensity
}

export type GuideRecommendationCard = {
  id: string
  name: string
  description: string
  durationLabel: string
  tags: GuideTag[]
  reason: string
  score?: number
  matchScore?: number
  routePersona?: string
  whyRecommended?: string
  lightAlternativeId?: string | null
  reasons?: string[]
  matchedTags?: string[]
  reasonCodes?: string[]
  debug?: Record<string, unknown>
  recommendationRequestId?: string
  recommendationEngine?: string
  stopIds?: string[]
  adjustmentReasons?: string[]
}

export type UserProfileSnapshot = {
  userId: string
  primaryPersona: string | null
  primaryPersonaLabel: string | null
  primaryScore: number
  secondaryPreferences: string[]
  interestVector: Record<string, number>
  profileVersion: number
}

export const scenicCenter: LatLngPoint = {
  lat: 31.4268,
  lng: 120.1008
}

export const guideSpots: GuideSpot[] = [
  {
    id: 'south_gate',
    name: '南门入园',
    lat: 31.4206,
    lng: 120.102977,
    stayMinutes: 3,
    intro: '这里是三条主题路线的共同起点，适合先建立整个景区的方向感与今天的游览节奏。'
  },
  {
    id: 'lingshan_wall',
    name: '灵山大照壁',
    lat: 31.421406,
    lng: 120.102497,
    stayMinutes: 8,
    intro: '华夏第一壁以大体量浮雕铺开景区气势，是入园后最适合讲文化门面的第一站。'
  },
  {
    id: 'shengjing_square',
    name: '胜境广场',
    lat: 31.423651,
    lng: 120.100913,
    stayMinutes: 8,
    intro: '这里连接多条游览动线，适合做空间过渡与景区整体格局讲解。'
  },
  {
    id: 'fozu_tan',
    name: '佛足坛',
    lat: 31.422754,
    lng: 120.101616,
    stayMinutes: 8,
    intro: '佛足坛适合做礼佛开场与仪式感体验，是自然风光路线的重要起步点。'
  },
  {
    id: 'jiulong_guanyu',
    name: '九龙灌浴',
    lat: 31.424819,
    lng: 120.100158,
    stayMinutes: 15,
    intro: '这里是动态表演的重要观赏点，也适合安排佛诞故事与祈福仪式的讲解。'
  },
  {
    id: 'puti_avenue',
    name: '菩提大道',
    lat: 31.423152,
    lng: 120.101141,
    stayMinutes: 12,
    intro: '菩提大道串联太湖视野与山水格局，是自然风光路线的核心观景廊道。'
  },
  {
    id: 'foshou_square',
    name: '佛手广场',
    lat: 31.426961,
    lng: 120.09836,
    stayMinutes: 10,
    intro: '佛手广场适合互动打卡，也常被作为天下第一掌的祈福体验点。'
  },
  {
    id: 'xiangfu_temple',
    name: '祥符禅寺',
    lat: 31.427981,
    lng: 120.097983,
    stayMinutes: 18,
    intro: '祥符禅寺承接小灵山历史脉络，是讲佛教渊源与古寺兴衰的重要点位。'
  },
  {
    id: 'xingtan_square',
    name: '杏坛广场',
    lat: 31.428958,
    lng: 120.097377,
    stayMinutes: 8,
    intro: '杏坛广场连接寺院区与大佛核心轴线，适合做礼仪空间与路线承接说明。'
  },
  {
    id: 'foqian_square',
    name: '佛前广场',
    lat: 31.429869,
    lng: 120.096713,
    stayMinutes: 8,
    intro: '佛前广场是登临大佛前的重要礼佛空间，适合做朝礼氛围铺垫。'
  },
  {
    id: 'giant_buddha',
    name: '灵山大佛',
    lat: 31.430272,
    lng: 120.096436,
    stayMinutes: 25,
    intro: '灵山大佛是景区最具代表性的核心景观，兼具佛教文化、地标性和观景价值。'
  },
  {
    id: 'baizi_mile',
    name: '百子戏弥勒',
    lat: 31.427195,
    lng: 120.098842,
    stayMinutes: 12,
    intro: '百子戏弥勒氛围轻松，非常适合亲子互动与生活化文化讲解。'
  },
  {
    id: 'fan_gong',
    name: '梵宫',
    lat: 31.427822,
    lng: 120.102423,
    stayMinutes: 30,
    intro: '梵宫汇集穹顶、木雕、琉璃等多种佛教艺术表达，是深度参观的重要区域。'
  },
  {
    id: 'fan_gong_square',
    name: '梵宫广场',
    lat: 31.426932,
    lng: 120.102597,
    stayMinutes: 8,
    intro: '梵宫广场适合作为梵宫外部空间的休憩与过渡节点。'
  },
  {
    id: 'wuyin_tancheng',
    name: '五印坛城',
    lat: 31.424808,
    lng: 120.103015,
    stayMinutes: 20,
    intro: '五印坛城以藏传佛教风格见长，适合做建筑差异与祈福文化体验讲解。'
  },
  {
    id: 'manfeilong_tower',
    name: '曼飞龙塔',
    lat: 31.426147,
    lng: 120.104684,
    stayMinutes: 10,
    intro: '曼飞龙塔体现傣族佛教建筑风格，也适合串联园林景观视角。'
  },
  {
    id: 'lingshan_jingshe',
    name: '灵山精舍',
    lat: 31.429077,
    lng: 120.105668,
    stayMinutes: 15,
    intro: '灵山精舍氛围清静，适合感受禅意园林与宁静致远的游览节奏。'
  },
  {
    id: 'sansheng_hall',
    name: '三圣殿',
    lat: 31.424393,
    lng: 120.096276,
    stayMinutes: 12,
    intro: '三圣殿承接佛教历史文化展示，是历史文化爱好者路线的收束点之一。'
  },
  {
    id: 'exit',
    name: '景区出口',
    lat: 31.422989,
    lng: 120.102372,
    stayMinutes: 2,
    intro: '这里作为路线收尾点，适合做离园提醒与本次游览总结。'
  }
]

export const guideRoutes: GuideRoute[] = [
  {
    id: 'historical_culture',
    name: '历史文化爱好者路线',
    durationLabel: '6 小时深度游',
    tags: ['文化探秘', '祈福静心'],
    description: '适合喜欢佛教历史、建筑艺术与沉浸式讲解的游客，覆盖灵山最有代表性的人文主线。',
    cover: '/intro/splash/splash-01.webp',
    stops: [
      { spotId: 'south_gate', narrative: '从南门开始建立整体认知，这条路线会以佛教历史、建筑艺术和文化轴线为主线展开。' },
      { spotId: 'lingshan_wall', narrative: '灵山大照壁全长 39.8 米，最高处 7 米、最厚处 1.9 米，由深浮雕花岗石拼块贴面而成；可从“灵山胜境”主题浮雕读懂景区的佛教文化序章。' },
      { spotId: 'shengjing_square', narrative: '胜境广场是景区文化轴线的重要过渡点，适合讲清空间展开方式和后续参观节奏。' },
      { spotId: 'foshou_square', narrative: '佛手广场以天下第一掌著称，这里既有祈福意味，也承担游客与佛教文化的第一层互动体验。' },
      { spotId: 'xiangfu_temple', narrative: '祥符禅寺重点讲玄奘法师与“小灵山”的渊源、古井与银杏的历史故事、12.8 吨重的江南第一钟，以及千年古刹的兴衰轨迹。' },
      { spotId: 'xingtan_square', narrative: '杏坛广场适合承接寺院区到大佛轴线的礼仪氛围，让游览状态逐步进入更庄重的朝礼节奏。' },
      { spotId: 'foqian_square', narrative: '佛前广场是登临灵山大佛前的礼佛空间，在这里更适合讲礼佛动线与朝礼秩序。' },
      { spotId: 'giant_buddha', narrative: '灵山大佛重点解析佛像手印、216 级台阶所对应的 108 烦恼与 108 愿望、青铜铸造工艺与现代科技，以及“五方五佛”理念。' },
      { spotId: 'fan_gong', narrative: '灵山梵宫重点看穹顶天象图、《华藏世界》琉璃作品和东阳木雕，并了解它作为世界佛教论坛主会场的文化地位。' },
      { spotId: 'wuyin_tancheng', narrative: '五印坛城适合对比汉传与藏传佛教建筑艺术差异，了解藏传佛教文化、曼茶罗的佛教意义和转经筒的祈福文化。' },
      { spotId: 'sansheng_hall', narrative: '三圣殿作为佛教历史文化展示的延展点，能帮助游客把前面看到的艺术与信仰内容串成完整脉络。' },
      { spotId: 'exit', narrative: '离园前可以回顾这条路线的核心收获：从大照壁、古寺、大佛到梵宫与坛城，形成一条完整的人文参观线。' }
    ],
    experiences: [
      '在祥符禅寺参与撞钟祈福，聆听 12.8 吨重的江南第一钟。',
      '在梵宫欣赏《吉祥颂》，体验全息投影、水雾等现代科技与佛教文化的融合。',
      '在灵山大佛平台俯瞰太湖全景，拍摄夕阳下的大佛。',
      '在五印坛城转经廊转动经筒，体验“转经一圈，福慧双增”的祈福文化。'
    ],
    walkIntensity: '较多步行'
  },
  {
    id: 'natural_scenery',
    name: '自然风光爱好者路线',
    durationLabel: '5 小时全景游',
    tags: ['轻松漫步', '拍照打卡'],
    description: '适合偏好太湖风光、园林景观与禅意漫游的游客，以自然视野和环境体验串联全程。',
    cover: '/intro/splash/splash-05.webp',
    stops: [
      { spotId: 'south_gate', narrative: '从南门入园，沿太湖风光、园林景观和禅意空间展开 5 小时全景游。' },
      { spotId: 'fozu_tan', narrative: '佛足坛作为自然风光线的礼佛开场，让游览从入园的喧闹过渡到平静的观景节奏。' },
      { spotId: 'jiulong_guanyu', narrative: '在九龙灌浴观赏动态表演、接取祈福圣水，并留意水幕与阳光交织出的七彩佛光。' },
      { spotId: 'puti_avenue', narrative: '菩提大道重点认识景观植物的佛教文化意义，眺望太湖与青龙山、白虎山，感受“前有照、后有靠、左右有抱”的山水格局。' },
      { spotId: 'giant_buddha', narrative: '灵山大佛重点看选址的地理优势，从高处俯瞰太湖和马山半岛，感受大佛与自然环境的和谐融合。' },
      { spotId: 'manfeilong_tower', narrative: '曼飞龙塔展现傣族佛教建筑风格与园林景观设计，适合观察不同民族佛教文化与自然环境的关系。' },
      { spotId: 'lingshan_jingshe', narrative: '灵山精舍适合体验禅意园林，理解“天人合一”的传统园林思想与“宁静致远”的精神境界。' },
      { spotId: 'fan_gong_square', narrative: '梵宫广场作为全景线的收束空间，适合休憩并回望一路的山水与建筑层次。' },
      { spotId: 'exit', narrative: '从梵宫广场前往出口，结束以太湖视野、自然山水和禅意园林为主线的全景游。' }
    ],
    experiences: [
      '在九龙灌浴接取祈福圣水，欣赏水幕与阳光交织出的七彩佛光。',
      '在灵山大佛平台拍摄太湖日落，感受大佛与湖面光影交相辉映。',
      '在灵山精舍品尝素斋，体验“禅食一味”的生活方式。',
      '在菩提大道漫步欣赏太湖风光，放松身心。'
    ],
    walkIntensity: '适中'
  },
  {
    id: 'family',
    name: '亲子家庭路线',
    durationLabel: '4 小时轻松游',
    tags: ['亲子游', '拍照打卡'],
    description: '适合带孩子边玩边逛，侧重互动体验、故事表达和视觉冲击，节奏更友好。',
    cover: '/intro/splash/splash-04.webp',
    stops: [
      { spotId: 'south_gate', narrative: '从南门开始把整条路线讲成一场轻松探索，让孩子先知道今天会有表演、互动和很多好看的艺术空间。' },
      { spotId: 'jiulong_guanyu', narrative: '九龙灌浴适合用生动语言讲释迦牟尼诞生的故事，让孩子先从有画面感的内容进入佛教文化。' },
      { spotId: 'foshou_square', narrative: '佛手广场可以安排摸天下第一掌的轻松打卡，让孩子在互动里建立对景区的亲近感。' },
      { spotId: 'baizi_mile', narrative: '百子戏弥勒适合带孩子观察不同雕塑的动作和神态，从轻松画面里感受皆大欢喜的生活态度。' },
      { spotId: 'fan_gong', narrative: '在梵宫里尽量少用复杂术语，重点引导孩子看色彩、造型、飞天形象和琉璃作品，让艺术体验更直观。' },
      { spotId: 'wuyin_tancheng', narrative: '五印坛城可以用简单语言介绍转经筒、唐卡和藏式建筑，让孩子通过看与动手感受不同民族文化的魅力。' },
      { spotId: 'exit', narrative: '离园前回顾今天最有趣的几个点：表演、佛手、百子戏弥勒、梵宫色彩和坛城互动，让整条亲子线轻松收尾。' }
    ],
    experiences: [
      '参与“抱佛脚”亲子活动，让孩子在家长陪伴下感受大佛的宏伟气势。',
      '在梵宫圣坛观看《吉祥颂》，通过全息投影、水雾等现代科技理解佛陀修行成佛的故事。',
      '在景区体验清淡雅致的特色素面套餐，了解佛门饮食文化。',
      '在百子戏弥勒雕塑前拍照互动，感受“皆大欢喜”的生活态度。'
    ],
    walkIntensity: '轻松'
  }
]

export function getGuideRouteById(routeId?: string | null) {
  if (!routeId) {
    return guideRoutes[0]
  }
  const canonicalRouteId = routeId === 'prayer_meditation' ? 'natural_scenery' : routeId
  return guideRoutes.find((route) => route.id === canonicalRouteId) ?? guideRoutes[0]
}

export function getGuideSpotById(spotId?: string | null) {
  if (!spotId) {
    return guideSpots[0]
  }
  return guideSpots.find((spot) => spot.id === spotId) ?? guideSpots[0]
}

export function getGuideRouteSpots(routeId?: string | null) {
  const route = getGuideRouteById(routeId)
  return route.stops
    .map((stop) => {
      const spot = getGuideSpotById(stop.spotId)
      return spot ? { ...spot, narrative: stop.narrative } : null
    })
    .filter(Boolean) as Array<GuideSpot & { narrative: string }>
}

export function getDefaultSpotId(routeId?: string | null) {
  const route = getGuideRouteById(routeId)
  // 所有路线均从南门入园；默认状态不能跳到路线中的下一站。
  return route.stops[0]?.spotId ?? guideSpots[0]?.id ?? ''
}

export function getRouteStop(routeId: string, spotId: string) {
  const route = getGuideRouteById(routeId)
  const stopIndex = route.stops.findIndex((stop) => stop.spotId === spotId)
  const stop = route.stops[stopIndex] ?? route.stops[0]
  const nextStop = stopIndex >= 0 ? route.stops[stopIndex + 1] : route.stops[1]
  return {
    route,
    stop,
    stopIndex,
    nextStop
  }
}

// 可执行行程卡所需的静态行程元信息：站点数、亮点、步行强度等，全部来自路线静态定义
export function getRouteItineraryMeta(routeId?: string | null) {
  const route = getGuideRouteById(routeId)
  return {
    durationLabel: route.durationLabel,
    stopCount: route.stops.length,
    walkIntensity: route.walkIntensity,
    tags: route.tags,
    cover: route.cover,
    highlights: route.experiences.slice(0, 2)
  }
}

export function buildSpotQuestions(routeId: string, spotId: string) {
  const route = getGuideRouteById(routeId)
  const spot = getGuideSpotById(spotId)

  return [
    `${spot.name}最值得看的细节是什么？`,
    `${spot.name}适合怎么拍照？`,
    `${route.name}接下来为什么安排去下一站？`
  ]
}

export function buildLocalGuideRecommendations(
  selectedTags: string[] = [],
  preferences: GuidePreferenceContext = DEFAULT_GUIDE_PREFERENCES
): GuideRecommendationCard[] {
  const ranked = [...guideRoutes].sort((left, right) => {
    const leftScore = countOverlap(left.tags, selectedTags) * 120 + getRoutePreferenceScore(left, preferences)
    const rightScore = countOverlap(right.tags, selectedTags) * 120 + getRoutePreferenceScore(right, preferences)
    return rightScore - leftScore
  })

  return ranked.map((route, index) => {
    const matchedTags = route.tags.filter((tag) => selectedTags.includes(tag))
    const preferenceReason = getPreferenceReason(route, preferences)
    const reason =
      matchedTags.length > 0
        ? `你选择了“${matchedTags.join('、')}”，这条路线主题最贴近。`
        : preferenceReason
          ? preferenceReason
        : index === 0
          ? '按景区经典游览动线为你推荐，适合首次体验。'
          : '这条路线能补充不同游览节奏，适合作为备选。'

    return {
      id: route.id,
      name: route.name,
      description: route.description,
      durationLabel: route.durationLabel,
      tags: route.tags,
      reason,
      score: countOverlap(route.tags, selectedTags) * 120 + getRoutePreferenceScore(route, preferences),
      debug: {
        source: 'local',
        preferenceScore: getRoutePreferenceScore(route, preferences)
      }
    }
  })
}

function countOverlap(routeTags: string[], selectedTags: string[]) {
  return routeTags.reduce((count, tag) => (selectedTags.includes(tag) ? count + 1 : count), 0)
}

function getRoutePreferenceScore(route: GuideRoute, preferences: GuidePreferenceContext) {
  const routeId = route.id
  const values: number[] = []

  if (preferences.duration === 'quick') values.push(routeId === 'family' ? 100 : routeId === 'natural_scenery' ? 70 : 30)
  if (preferences.duration === 'half_day') values.push(routeId === 'natural_scenery' ? 88 : routeId === 'family' ? 80 : 55)
  if (preferences.duration === 'deep') values.push(routeId === 'historical_culture' ? 100 : routeId === 'natural_scenery' ? 70 : 45)

  if (preferences.arrival === 'morning') values.push(routeId === 'historical_culture' ? 90 : routeId === 'natural_scenery' ? 78 : 70)
  if (preferences.arrival === 'noon') values.push(routeId === 'natural_scenery' ? 80 : routeId === 'family' ? 78 : 62)
  if (preferences.arrival === 'afternoon') values.push(routeId === 'family' ? 85 : routeId === 'natural_scenery' ? 82 : 45)

  if (preferences.companion === 'family') values.push(routeId === 'family' ? 100 : routeId === 'natural_scenery' ? 65 : 45)
  if (preferences.companion === 'elder') values.push(routeId === 'natural_scenery' ? 92 : routeId === 'family' ? 82 : 35)
  if (preferences.companion === 'friends') values.push(routeId === 'historical_culture' ? 78 : routeId === 'family' ? 72 : 68)

  if (preferences.walk === 'light') values.push(route.walkIntensity === '轻松' ? 100 : route.walkIntensity === '适中' ? 72 : 25)
  if (preferences.walk === 'normal') values.push(route.walkIntensity === '适中' ? 95 : route.walkIntensity === '轻松' ? 80 : 70)
  if (preferences.walk === 'deep') values.push(route.walkIntensity === '较多步行' ? 100 : route.walkIntensity === '适中' ? 78 : 48)

  if (preferences.show === 'must') values.push(routeId === 'historical_culture' ? 92 : routeId === 'family' ? 72 : 65)
  if (preferences.show === 'flexible') values.push(70)
  if (preferences.show === 'skip') values.push(routeId === 'natural_scenery' ? 88 : routeId === 'family' ? 82 : 45)

  if (!values.length) {
    return 0
  }
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function getPreferenceReason(route: GuideRoute, preferences: GuidePreferenceContext) {
  if (preferences.duration === 'quick' && route.id === 'family') return '你选择短时游览，这条路线站点更集中、节奏更轻。'
  if (preferences.duration === 'deep' && route.id === 'historical_culture') return '你选择深度游览，这条路线更适合慢慢理解灵山文化。'
  if (preferences.companion === 'family' && route.id === 'family') return '你选择亲子同行，这条路线步行压力低、互动点更友好。'
  if (preferences.companion === 'elder' && route.walkIntensity !== '较多步行') return '你选择带老人同行，优先推荐步行负担更低的路线。'
  if (preferences.walk === 'light' && route.walkIntensity === '轻松') return '你选择少走路，这条路线更轻松，适合慢游。'
  if (preferences.walk === 'deep' && route.walkIntensity === '较多步行') return '你接受较多步行，这条路线覆盖更完整。'
  if (preferences.show === 'must' && route.id === 'historical_culture') return '你希望观看演出，路线会更靠近文化演艺体验。'
  return ''
}
