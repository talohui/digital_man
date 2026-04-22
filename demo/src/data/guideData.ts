export const GUIDE_TAGS = ['亲子游', '文化探秘', '祈福静心', '轻松漫步', '拍照打卡'] as const

export type GuideTag = (typeof GUIDE_TAGS)[number]

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

export type GuideRoute = {
  id: string
  name: string
  durationLabel: string
  tags: GuideTag[]
  description: string
  stops: GuideRouteStop[]
  experiences: string[]
}

export type GuideRecommendationCard = {
  id: string
  name: string
  description: string
  durationLabel: string
  tags: GuideTag[]
  reason: string
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
    intro: '佛足坛适合做礼佛开场与仪式感体验，是自然风光线的重要起步点。'
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
    intro: '三圣殿承接佛教历史文化展示，是历史文化路线的收束点之一。'
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
    name: '历史文化路线',
    durationLabel: '6 小时深度游',
    tags: ['文化探秘', '祈福静心'],
    description: '适合喜欢佛教历史、建筑艺术与沉浸式讲解的游客，覆盖灵山最有代表性的人文主线。',
    stops: [
      { spotId: 'south_gate', narrative: '从南门开始建立整体认知，这条路线会以佛教历史、建筑艺术和文化轴线为主线展开。' },
      { spotId: 'lingshan_wall', narrative: '灵山大照壁最适合先铺开景区的文化门面，帮助游客快速进入整座景区的历史语境。' },
      { spotId: 'shengjing_square', narrative: '胜境广场是景区文化轴线的重要过渡点，适合讲清空间展开方式和后续参观节奏。' },
      { spotId: 'foshou_square', narrative: '佛手广场以天下第一掌著称，这里既有祈福意味，也承担游客与佛教文化的第一层互动体验。' },
      { spotId: 'xiangfu_temple', narrative: '祥符禅寺重点可讲玄奘法师与小灵山的渊源、古井与银杏的历史故事，以及寺院千年兴衰的文化脉络。' },
      { spotId: 'xingtan_square', narrative: '杏坛广场适合承接寺院区到大佛轴线的礼仪氛围，让游览状态逐步进入更庄重的朝礼节奏。' },
      { spotId: 'foqian_square', narrative: '佛前广场是登临灵山大佛前的礼佛空间，在这里更适合讲礼佛动线与朝礼秩序。' },
      { spotId: 'giant_buddha', narrative: '灵山大佛可重点解析佛像手印、216 级台阶与青铜铸造工艺，讲清传统理念与现代技术的结合。' },
      { spotId: 'fan_gong', narrative: '梵宫内部重点看穹顶天象图、《华藏世界》琉璃作品与木雕空间叙事，也要讲清它作为世界佛教论坛主会场的文化地位。' },
      { spotId: 'wuyin_tancheng', narrative: '五印坛城适合对比汉传与藏传佛教建筑艺术差异，并讲解曼荼罗与转经祈福的文化意义。' },
      { spotId: 'sansheng_hall', narrative: '三圣殿作为佛教历史文化展示的延展点，能帮助游客把前面看到的艺术与信仰内容串成完整脉络。' },
      { spotId: 'exit', narrative: '离园前可以回顾这条路线的核心收获：从大照壁、古寺、大佛到梵宫与坛城，形成一条完整的人文参观线。' }
    ],
    experiences: [
      '在祥符禅寺参与撞钟祈福，感受古寺庄严氛围。',
      '在梵宫欣赏《吉祥颂》，体验沉浸式佛教艺术空间。',
      '登上灵山大佛平台俯瞰太湖全景，拍摄大佛与山水同框。',
      '在五印坛城转动经筒，体验转经祈福的仪式感。'
    ]
  },
  {
    id: 'natural_scenery',
    name: '自然风光路线',
    durationLabel: '5 小时全景游',
    tags: ['轻松漫步', '拍照打卡'],
    description: '适合偏好慢节奏漫游、园林禅意和太湖视野的游客，整体更轻松也更适合拍照。',
    stops: [
      { spotId: 'south_gate', narrative: '自然风光线从南门开始，重点不是赶景点，而是沿着更开阔的观景动线感受太湖与园林空间。' },
      { spotId: 'fozu_tan', narrative: '佛足坛适合做礼佛开场，也能把游览节奏从入园的喧闹自然过渡到更平静的观景状态。' },
      { spotId: 'jiulong_guanyu', narrative: '九龙灌浴强调观赏表演与接取祈福圣水的体验感，是自然与仪式感结合的起点。' },
      { spotId: 'puti_avenue', narrative: '菩提大道沿线可以同时欣赏植物、太湖、山体与佛教文化象征之间的呼应关系。' },
      { spotId: 'giant_buddha', narrative: '自然风光线中的灵山大佛重点在地理选址与观景视角，适合从高处俯瞰太湖和马山半岛。' },
      { spotId: 'manfeilong_tower', narrative: '曼飞龙塔可重点看傣族佛教建筑风格、园林景观设计思路以及它与周边自然环境的融合方式。' },
      { spotId: 'lingshan_jingshe', narrative: '灵山精舍适合体验禅意园林的宁静之美，并借此讲天人合一的园林思想。' },
      { spotId: 'fan_gong_square', narrative: '梵宫广场是收束自然风光线的过渡空间，离园前很适合做一次轻松休憩与回望。' },
      { spotId: 'exit', narrative: '这条路线以太湖视野、山水格局和禅意园林为主，离园时可以把自然与文化融合的感受再整理一遍。' }
    ],
    experiences: [
      '在九龙灌浴接取祈福圣水，感受水幕与阳光交织出的七彩佛光。',
      '在灵山大佛平台拍摄太湖日落，体验金色光影落在大佛与水面的层次感。',
      '在灵山精舍一带放慢脚步，感受清静园林与素雅禅意带来的放松体验。',
      '沿菩提大道漫步看太湖与山体轮廓，体会佛教文化与自然环境的协调关系。'
    ]
  },
  {
    id: 'family',
    name: '亲子路线',
    durationLabel: '4 小时轻松游',
    tags: ['亲子游', '拍照打卡'],
    description: '适合带孩子边玩边逛，侧重互动体验、故事表达和视觉冲击，节奏更友好。',
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
      '在佛手广场和百子戏弥勒前拍照互动，让孩子在轻松氛围里留下游览记忆。',
      '在梵宫圣坛观看沉浸式演出，通过光影效果让故事更容易理解。',
      '体验适合家庭口味的素食餐点，顺带认识佛门饮食的清淡风格。',
      '一路保持轻松节奏，让孩子在玩和看之间自然吸收景区故事。'
    ]
  }
]

export function getGuideRouteById(routeId?: string | null) {
  if (!routeId) {
    return guideRoutes[0]
  }
  return guideRoutes.find((route) => route.id === routeId) ?? guideRoutes[0]
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
  return route.stops[1]?.spotId ?? route.stops[0]?.spotId ?? guideSpots[0]?.id ?? ''
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

export function buildSpotQuestions(routeId: string, spotId: string) {
  const route = getGuideRouteById(routeId)
  const spot = getGuideSpotById(spotId)

  return [
    `${spot.name}最值得看的细节是什么？`,
    `${spot.name}适合怎么拍照？`,
    `${route.name}接下来为什么安排去下一站？`
  ]
}

export function buildLocalGuideRecommendations(selectedTags: string[]): GuideRecommendationCard[] {
  const ranked = [...guideRoutes].sort((left, right) => {
    const leftScore = countOverlap(left.tags, selectedTags)
    const rightScore = countOverlap(right.tags, selectedTags)
    return rightScore - leftScore
  })

  return ranked.map((route, index) => {
    const matchedTags = route.tags.filter((tag) => selectedTags.includes(tag))
    const reason =
      matchedTags.length > 0
        ? `本地兜底命中标签：${matchedTags.join(' / ')}`
        : index === 0
          ? '当前按默认热门路线为你补齐推荐。'
          : '根据景区通用偏好为你补齐了一条备选路线。'

    return {
      id: route.id,
      name: route.name,
      description: route.description,
      durationLabel: route.durationLabel,
      tags: route.tags,
      reason
    }
  })
}

function countOverlap(routeTags: string[], selectedTags: string[]) {
  return routeTags.reduce((count, tag) => (selectedTags.includes(tag) ? count + 1 : count), 0)
}
