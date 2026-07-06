import { guideSpots } from './guideData'
import { lingshanMapModelOverlays } from './lingshanMapModelOverlays'

export type LingshanPoiDetail = {
  id: string
  name: string
  shortName: string
  subtitle: string
  category: '核心景点' | '文化节点' | '空间节点'
  intro: string
  highlights: string[]
  visitTips: string[]
  photo?: {
    url: string
    alt: string
    caption: string
    sourceUrl: string
  }
  model?: {
    url: string
    label: string
    sizeLabel?: string
    note: string
  }
  sources: Array<{
    label: string
    url: string
  }>
}

const OFFICIAL_HOME = 'https://www.lingshan.com.cn/'

const OFFICIAL_PHOTOS = {
  giant_buddha: 'https://www.lingshan.com.cn/static/images/index_ls/daol-1.jpg',
  xiangfu_temple: 'https://www.lingshan.com.cn/static/images/index_ls/daol-2.jpg',
  sansheng_hall: 'https://www.lingshan.com.cn/static/images/index_ls/daol-3.jpg',
  fan_gong: 'https://www.lingshan.com.cn/static/images/index_ls/daol-4.jpg',
  wuyin_tancheng: 'https://www.lingshan.com.cn/static/images/index_ls/daol-5.jpg',
  jiulong_guanyu: 'https://www.lingshan.com.cn/static/images/index_ls/daol-6.jpg'
} as const

const OFFICIAL_SCENIC_REFERENCE_PHOTO = OFFICIAL_PHOTOS.giant_buddha

const officialSources = [
  {
    label: '灵山胜境官网',
    url: OFFICIAL_HOME
  }
]

const wikiSources = [
  {
    label: '维基百科：灵山大佛',
    url: 'https://zh.wikipedia.org/wiki/%E7%81%B5%E5%B1%B1%E5%A4%A7%E4%BD%9B'
  }
]

function getSpotIntro(id: string) {
  return guideSpots.find((spot) => spot.id === id)?.intro ?? ''
}

function getModel(id: string): LingshanPoiDetail['model'] {
  const overlay = lingshanMapModelOverlays.find((item) => item.poiId === id)
  if (!overlay?.modelUrl) {
    return undefined
  }

  return {
    url: overlay.modelUrl,
    label: `${overlay.name} 高清 GLB`,
    sizeLabel: overlay.fileSizeLabel,
    note: '当前原型先提供高清 GLB 入口；后续可在详情页内接入专用移动端模型预览器。'
  }
}

function officialPhoto(id: keyof typeof OFFICIAL_PHOTOS, name: string, sourceUrl = OFFICIAL_HOME) {
  return {
    url: OFFICIAL_PHOTOS[id],
    alt: `${name} 景点照片`,
    caption: `${name} 官方导览图`,
    sourceUrl
  }
}

function scenicGuidePhoto(name: string, sourceUrl = OFFICIAL_HOME) {
  return {
    url: OFFICIAL_SCENIC_REFERENCE_PHOTO,
    alt: `${name} 灵山胜境导览图`,
    caption: `${name} 官方景区参考图`,
    sourceUrl
  }
}

export const lingshanPoiDetails: LingshanPoiDetail[] = [
  {
    id: 'giant_buddha',
    name: '灵山大佛',
    shortName: '大佛',
    subtitle: '庄严佛境核心',
    category: '核心景点',
    intro: '灵山大佛是整座景区的精神和视觉核心，适合从佛像尺度、朝礼轴线、莲座平台和太湖山水关系四个角度展开讲解。',
    highlights: ['景区最核心地标', '大佛朝礼主轴终点', '适合近景模型细看莲座与台阶'],
    visitTips: ['建议在佛前广场先停留建立仰视角度', '近景浏览时优先打开高精 GLB 模型'],
    photo: officialPhoto('giant_buddha', '灵山大佛', 'https://www.lingshan.com.cn/daol-1.html'),
    model: getModel('giant_buddha'),
    sources: [...officialSources, ...wikiSources]
  },
  {
    id: 'fan_gong',
    name: '梵宫',
    shortName: '梵宫',
    subtitle: '东方佛教艺术殿堂',
    category: '核心景点',
    intro: '梵宫是灵山胜境的建筑艺术重点，导览时可突出穹顶空间、佛教艺术陈设、仪式性空间与大型文化活动承载能力。',
    highlights: ['建筑体量大', '艺术陈设密集', '适合作为室内外转换节点'],
    visitTips: ['移动端建议先看外部模型，再进入讲解文本', '近景查看时注意模型体量较大，保持网络稳定'],
    photo: officialPhoto('fan_gong', '梵宫', 'https://www.lingshan.com.cn/daol-4.html'),
    model: getModel('fan_gong'),
    sources: officialSources
  },
  {
    id: 'wuyin_tancheng',
    name: '五印坛城',
    shortName: '坛城',
    subtitle: '藏式坛城圣境',
    category: '核心景点',
    intro: '五印坛城以藏传佛教建筑语言为主要识别点，适合解释坛城格局、色彩层次和与景区主轴不同的宗教建筑气质。',
    highlights: ['藏式建筑风格', '水墨底图中识别度高', '适合做路线东侧重点节点'],
    visitTips: ['远景可先看整体轮廓', '近景进入详情后可对照高精 GLB 观察屋顶层次'],
    photo: officialPhoto('wuyin_tancheng', '五印坛城', 'https://www.lingshan.com.cn/daol-5.html'),
    model: getModel('wuyin_tancheng'),
    sources: officialSources
  },
  {
    id: 'xiangfu_temple',
    name: '祥符禅寺',
    shortName: '禅寺',
    subtitle: '古刹禅修空间',
    category: '核心景点',
    intro: '祥符禅寺承接小灵山历史语境，是从园林沙盘进入古寺叙事的重要节点。当前已配套 3D 低矮底座，强调建筑落地感。',
    highlights: ['古寺文化节点', '带 3D 场地底座', '适合讲佛教历史脉络'],
    visitTips: ['近景观看时可关注底座与寺院建筑关系', '模型较大，移动端建议保持中近景查看'],
    photo: officialPhoto('xiangfu_temple', '祥符禅寺', 'https://www.lingshan.com.cn/daol-2.html'),
    model: getModel('xiangfu_temple'),
    sources: officialSources
  },
  {
    id: 'jiulong_guanyu',
    name: '九龙灌浴',
    shortName: '九龙',
    subtitle: '佛诞圣景再现',
    category: '核心景点',
    intro: '九龙灌浴是动态演艺和佛诞故事结合的关键景点，适合在路线中作为节奏转换点，讲清仪式、音乐与水景共同营造的体验。',
    highlights: ['动态表演点位', '路线中心转折', '水景与佛诞故事结合'],
    visitTips: ['可在表演时间前后停留', '详情页模型适合观察整体广场与水景关系'],
    photo: officialPhoto('jiulong_guanyu', '九龙灌浴', 'https://www.lingshan.com.cn/daol-6.html'),
    model: getModel('jiulong_guanyu'),
    sources: officialSources
  },
  {
    id: 'lingshan_wall',
    name: '灵山大照壁',
    shortName: '照壁',
    subtitle: '入境礼序地标',
    category: '文化节点',
    intro: '灵山大照壁是入园后的礼序开场，适合用来建立景区文化门面和空间方向感。',
    highlights: ['入园第一视觉锚点', '适合讲景区文化门面', '与南门动线衔接紧密'],
    visitTips: ['适合作为移动端路线起点讲解', '近景模型用于辨认照壁和入口空间关系'],
    photo: scenicGuidePhoto('灵山大照壁'),
    model: getModel('lingshan_wall'),
    sources: officialSources
  },
  {
    id: 'foshou_square',
    name: '佛手广场',
    shortName: '佛手',
    subtitle: '祈福打卡之地',
    category: '文化节点',
    intro: getSpotIntro('foshou_square'),
    highlights: ['祈福互动节点', '连接禅寺与大佛轴线', '适合短停打卡'],
    visitTips: ['移动端可作为路线中段轻量讲解点', '模型用于看清佛手与广场尺度'],
    photo: scenicGuidePhoto('佛手广场'),
    model: getModel('foshou_square'),
    sources: officialSources
  },
  {
    id: 'foqian_square',
    name: '佛前广场',
    shortName: '佛前',
    subtitle: '瞻礼大佛前庭',
    category: '空间节点',
    intro: getSpotIntro('foqian_square'),
    highlights: ['大佛前庭空间', '朝礼路线铺垫', '适合总览与近景切换'],
    visitTips: ['进入大佛前建议先在此建立轴线感', '近景模型可观察台阶与平台关系'],
    photo: scenicGuidePhoto('佛前广场'),
    model: getModel('foqian_square'),
    sources: officialSources
  },
  {
    id: 'puti_avenue',
    name: '菩提大道',
    shortName: '菩提道',
    subtitle: '通往佛境主轴',
    category: '空间节点',
    intro: getSpotIntro('puti_avenue'),
    highlights: ['线性主轴空间', '连接多个核心景点', '适合讲路线转场'],
    visitTips: ['移动端保持中景更容易识别线性空间', '当前 GLB 为轻量 runtime 版本'],
    photo: scenicGuidePhoto('菩提大道'),
    model: getModel('puti_avenue'),
    sources: officialSources
  },
  {
    id: 'shengjing_square',
    name: '胜境广场',
    shortName: '胜境',
    subtitle: '入园开阔序厅',
    category: '空间节点',
    intro: getSpotIntro('shengjing_square'),
    highlights: ['路线汇合点', '空间过渡节点', '适合建立整体格局'],
    visitTips: ['适合作为路线说明起承点', '近景模型用于观察广场入口关系'],
    photo: scenicGuidePhoto('胜境广场'),
    model: getModel('shengjing_square'),
    sources: officialSources
  },
  {
    id: 'sansheng_hall',
    name: '三圣殿',
    shortName: '三圣殿',
    subtitle: '礼佛静心殿宇',
    category: '文化节点',
    intro: getSpotIntro('sansheng_hall'),
    highlights: ['历史文化路线收束点', '适合礼佛静心讲解', '已切 safe-v3 高精模型'],
    visitTips: ['该模型较大，建议按附近窗口加载查看', '详情页提供 safe-v3 GLB 入口'],
    photo: officialPhoto('sansheng_hall', '三圣殿', 'https://www.lingshan.com.cn/daol-3.html'),
    model: getModel('sansheng_hall'),
    sources: officialSources
  },
  {
    id: 'baizi_mile',
    name: '百子戏弥勒',
    shortName: '弥勒',
    subtitle: '欢喜弥勒景观',
    category: '文化节点',
    intro: getSpotIntro('baizi_mile'),
    highlights: ['亲子互动友好', '氛围轻松', '适合路线节奏缓冲'],
    visitTips: ['移动端详情可作为亲子线重点', '近景模型可观察人物群像关系'],
    photo: scenicGuidePhoto('百子戏弥勒'),
    model: getModel('baizi_mile'),
    sources: officialSources
  },
  {
    id: 'manfeilong_tower',
    name: '曼飞龙塔',
    shortName: '飞塔',
    subtitle: '异域佛塔景观',
    category: '文化节点',
    intro: getSpotIntro('manfeilong_tower'),
    highlights: ['佛塔造型鲜明', '东侧路线识别点', '适合与五印坛城对比建筑风格'],
    visitTips: ['远景先看塔体剪影', '近景模型用于观察塔身层级'],
    photo: scenicGuidePhoto('曼飞龙塔'),
    model: getModel('manfeilong_tower'),
    sources: officialSources
  }
]

export function getLingshanPoiDetailById(id: string | undefined) {
  if (!id) {
    return undefined
  }
  return lingshanPoiDetails.find((detail) => detail.id === id)
}

export function hasLingshanPoiDetail(id: string | undefined) {
  return Boolean(getLingshanPoiDetailById(id))
}
