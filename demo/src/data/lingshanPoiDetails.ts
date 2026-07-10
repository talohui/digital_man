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
    fallbackUrl?: string
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

const LOCAL_SCENIC_COVER = '/assets/lingshan/poi/scenic-cover.svg'

const POI_PHOTOS = {
  giant_buddha: '/assets/lingshan/poi/giant-buddha.jpg',
  xiangfu_temple: '/assets/lingshan/poi/xiangfu-temple.jpg',
  sansheng_hall: '/assets/lingshan/poi/sansheng-hall.jpg',
  fan_gong: '/assets/lingshan/poi/fan-gong.jpg',
  wuyin_tancheng: '/assets/lingshan/poi/wuyin-tancheng.jpg',
  jiulong_guanyu: '/assets/lingshan/poi/jiulong-guanyu.jpg'
} as const

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
    label: `${overlay.name} 3D 模型`,
    sizeLabel: overlay.fileSizeLabel,
    note: '可在详情页主舞台中切换查看景点 3D 模型。'
  }
}

function officialPhoto(id: keyof typeof POI_PHOTOS, name: string, sourceUrl = OFFICIAL_HOME) {
  return {
    url: POI_PHOTOS[id],
    fallbackUrl: LOCAL_SCENIC_COVER,
    alt: `${name} 景点照片`,
    caption: `${name} 本地景点照片`,
    sourceUrl
  }
}

function scenicGuidePhoto(name: string, sourceUrl = OFFICIAL_HOME) {
  return {
    url: '/assets/lingshan/poi/scenic-overview.jpg',
    fallbackUrl: LOCAL_SCENIC_COVER,
    alt: `${name} 灵山胜境导览图`,
    caption: `${name} 本地景区参考图`,
    sourceUrl
  }
}

export const lingshanPoiDetails: LingshanPoiDetail[] = [
  {
    id: 'giant_buddha',
    name: '灵山大佛',
    shortName: '大佛',
    subtitle: '太湖佛国地标',
    category: '核心景点',
    intro: '灵山大佛是景区最具代表性的核心地标，坐落于秦履峰南侧，沿朝礼轴线层层展开，可从佛像尺度、手印寓意与太湖山水关系理解这一站。',
    highlights: ['88 米露天青铜释迦牟尼立像', '施无畏印与施与愿印寓意鲜明', '登云道与抱佛脚是经典朝礼体验'],
    visitTips: ['建议先在佛前广场建立仰视角度，再登台近看佛像细节', '天气晴朗时适合俯瞰太湖与拍摄大佛全景'],
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
    intro: '梵宫是灵山胜境的佛教艺术殿堂，融合传统工艺、现代建筑与仪式空间，也是世界佛教论坛的重要会址。',
    highlights: ['星空穹顶、东阳木雕与琉璃艺术集中呈现', '《灵山吉祥颂》演出强化沉浸体验', '建筑外观以莲花圣塔形成强识别度'],
    visitTips: ['建议预留较完整的参观时间，室内观赏时放慢节奏', '观看演出建议提前排队，并遵循馆内动线与拍照提示'],
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
    intro: '五印坛城位于香水海湖心岛，以藏传佛教坛城意象为核心，展现汉传与藏传佛教文化交融的建筑气质。',
    highlights: ['白墙红边金顶形成鲜明藏式风格', '五方五佛手印与曼陀罗意象贯穿空间', '转经筒长廊适合体验祈福礼序'],
    visitTips: ['可顺时针绕行或转动经筒，注意保持安静与秩序', '雨天湖心栈道可能湿滑，建议放慢脚步'],
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
    intro: '祥符禅寺是灵山胜境中的千年古刹空间，承接玄奘法师、小灵山与江南禅宗文化的历史脉络。',
    highlights: ['唐代古刹格局与仿唐建筑气质', '祥符禅钟、古井与千年银杏富有历史感', '适合串联礼佛顺序与路线衔接'],
    visitTips: ['进入寺院后请放低音量，按礼佛动线有序参观', '秋季可重点留意千年银杏与古寺空间氛围'],
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
    intro: '九龙灌浴以释迦牟尼诞生传说为线索，通过莲花开启、太子佛升起与九龙喷水，形成仪式感很强的动态观赏节点。',
    highlights: ['佛诞故事与音乐水景结合', '表演时花开见佛、九龙吐水', '表演后可接取祈福圣水'],
    visitTips: ['建议提前约 10 分钟到场，选择开阔位置观看', '晴天表演时更适合拍摄水幕、阳光与佛像同框画面'],
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
    intro: '灵山大照壁是入园后的第一道文化序章，赵朴初题写的“灵山胜境”与背面诗刻共同奠定景区佛教文化基调。',
    highlights: ['华夏第一壁，入口视觉锚点鲜明', '赵朴初题字与诗刻承载文化开场', '适合拍摄照壁、太湖与入口动线'],
    visitTips: ['适合在入园第一站短暂停留，建立景区方向感', '可尝试把照壁、湖面和入园人流一起纳入画面'],
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
    intro: '佛手广场以“天下第一掌”为核心，是游客触摸祈福、衔接祥符禅寺与大佛朝礼动线的重要节点。',
    highlights: ['天下第一掌寓意沾福气、保平安', '与抱佛脚形成两大祈福体验', '适合短暂停留和互动拍照'],
    visitTips: ['人流较多时可先拍整体，再靠近触摸祈福', '注意照看同行儿童，避免在广场中久站影响通行'],
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
    intro: '佛前广场是瞻礼灵山大佛前的重要前庭空间，适合在登台前整理朝礼节奏、观看大佛与台阶的整体关系。',
    highlights: ['大佛前庭空间开阔', '承接朝礼主轴与登云道', '适合拍摄大佛仰视全景'],
    visitTips: ['建议先在广场停留片刻，再开始登台', '拍照时注意避开主通行线，保持队伍通畅'],
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
    intro: '菩提大道连接五智门与九龙灌浴，是景区中轴线上的禅意步道，两侧菩提树营造出从喧闹走向清净的过渡感。',
    highlights: ['线性朝圣步道，路线方向感强', '菩提树象征悟道与清净', '适合从入口区域过渡到核心景观'],
    visitTips: ['可放慢脚步感受林荫与中轴空间', '春季花开或夏季树荫下适合短暂停留拍照'],
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
    intro: '胜境广场是入园后承接人流与路线的开阔序厅，适合从这里建立景区整体格局和后续游览节奏。',
    highlights: ['入园后的空间过渡节点', '适合讲清景区主轴方向', '可作为路线集合与节奏调整点'],
    visitTips: ['适合在路线开始前确认同行人和游览节奏', '停留时尽量避开主入口通道'],
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
    intro: '三圣殿是佛教历史文化展示与礼佛静心的延展节点，适合在历史文化路线后段整理前面看到的信仰与艺术内容。',
    highlights: ['历史文化路线的安静收束点', '适合礼佛静心和回顾讲解', '与大佛、梵宫等核心景点形成内容延展'],
    visitTips: ['进入殿宇空间请保持安静，尊重礼佛秩序', '适合在路线后段短暂停留，整理前面听到的故事'],
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
    intro: '百子戏弥勒以欢喜弥勒和百名孩童群像传递包容、欢喜与多福的民俗寓意，是亲子游客很容易产生互动的一站。',
    highlights: ['弥勒佛与百子群像充满亲和力', '摸弥勒肚皮寄托顺遂安康', '适合亲子互动和轻松拍照'],
    visitTips: ['可引导孩子寻找不同孩童姿态', '触摸互动时注意排队礼让，避免攀爬雕塑'],
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
    intro: '曼飞龙塔展示南传佛教建筑气质，九塔组合与白色塔身、金色塔刹形成异域感鲜明的景观节点。',
    highlights: ['南传佛教白塔造型鲜明', '可与梵宫、五印坛城对比三大语系建筑', '九塔组合适合远景拍摄'],
    visitTips: ['建议先看整体九塔轮廓，再近看塔身雕刻', '雨天塔身周边路面可能湿滑，拍照时注意脚下'],
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
