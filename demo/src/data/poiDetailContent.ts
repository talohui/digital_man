export type PoiDetailHighlight = {
  title: string
  description: string
}

export type PoiDetailInlineImage = {
  src: string
  alt: string
  caption?: string
  afterSection: 'overview' | 'highlights'
}

/**
 * Editorial content only. POI identity, coordinates, map layers and model
 * bindings remain owned by the scenic map catalog and runtime data.
 */
export type PoiDetailContent = {
  poiId: string
  overview: string
  highlights: PoiDetailHighlight[]
  visitTips: string[]
  inlineImages?: PoiDetailInlineImage[]
  contentLevel: 'full' | 'basic'
  source?: string
}

const SOURCE = '灵山胜境景点结构化资料 / 景区公开资料'

const poiDetailContentEntries: PoiDetailContent[] = [
  {
    poiId: 'lingshan_wall',
    contentLevel: 'full',
    source: SOURCE,
    overview: '灵山大照壁位于入园动线前段，是游客进入灵山胜境后最先感受到的文化门面。大体量石雕与“灵山胜境”题字共同构成庄重的入境仪式感，也为后续的佛教建筑与朝礼主轴建立视觉开场。第一次到访可先从整体构图、题字和面向太湖的空间关系理解这一站。',
    highlights: [
      { title: '入境第一景', description: '照壁将入口、人流与景区核心方向串联，是建立游览方向感的起点。' },
      { title: '石雕细节', description: '可从远处先看整体尺度，再近看浮雕与题字的层次。' },
      { title: '太湖视野', description: '面向开阔水景，适合把照壁与入口空间一起留在画面中。' }
    ],
    visitTips: ['建议在入园后短暂停留，先确认当天路线和主要方向。', '拍照时注意避开主通行线，尽量从斜侧保留照壁完整轮廓。']
  },
  {
    poiId: 'fozu_tan',
    contentLevel: 'full',
    source: SOURCE,
    overview: '佛足坛位于景区中轴线前段，以佛足意象承接礼佛与祈福的开场。这里不是单纯的打卡点，更适合放慢脚步观察足印上的吉祥纹样，理解“以足印指向佛法行迹”的象征。它与前后的桥、门和大道共同组成由入口走向核心景观的仪式序列。',
    highlights: [
      { title: '佛足意象', description: '足印上的装饰纹样承载佛教吉祥与圆满的象征。' },
      { title: '中轴节点', description: '处在由入口进入核心朝礼区域的过渡位置，方向感清晰。' },
      { title: '礼佛开场', description: '适合把它作为认识灵山朝礼秩序的第一站。' }
    ],
    visitTips: ['人流较多时先从外圈观看，再靠近阅读纹样细节。', '如参与祈福，请保持安静并尊重现场礼仪。']
  },
  {
    poiId: 'puti_avenue',
    contentLevel: 'full',
    source: SOURCE,
    overview: '菩提大道连接核心礼佛节点与九龙灌浴，是一段以行走体验为主的中轴步道。两侧树荫、步道尺度与前方景观共同营造出由热闹转向清净的过渡感。第一次来不必匆匆通过，放慢脚步感受林荫、轴线和远近景观的变化，更容易理解灵山空间叙事的节奏。',
    highlights: [
      { title: '菩提林荫', description: '两侧绿意为步行提供连续的遮荫与安静感。' },
      { title: '朝礼轴线', description: '步道把前后核心节点自然串联，适合边走边建立方向。' },
      { title: '四季步行感', description: '不同季节的树影与光线变化，让这段路成为景区中的缓冲空间。' }
    ],
    visitTips: ['建议穿防滑、舒适的鞋，雨后注意步道湿滑。', '不要停在主通行中线拍照，可在两侧开阔处短暂停留。']
  },
  {
    poiId: 'jiulong_guanyu',
    contentLevel: 'full',
    source: SOURCE,
    overview: '九龙灌浴是灵山最具仪式感的动态景观之一，以释迦牟尼诞生传说为线索，将莲花、太子佛、九龙与水景演绎结合在同一观赏空间。它值得看的不只是喷水效果，更是“花开见佛”如何把佛诞故事转化为可感知的现场体验。第一次来可优先找好开阔视角，完整看完一轮演绎。',
    highlights: [
      { title: '花开见佛', description: '莲花开启与太子佛出现构成演绎的核心视觉节点。' },
      { title: '九龙水景', description: '喷水、音乐与广场空间共同营造佛诞故事的仪式感。' },
      { title: '可参与的停留点', description: '表演结束后可在周边继续观察雕塑细节与人群互动。' },
      { title: '路线节奏转换', description: '这里适合作为中轴游览中一次完整停留，而非匆匆路过。' }
    ],
    visitTips: ['如计划观看表演，建议提前到达并选择不遮挡他人的开阔位置；具体场次以景区当日公告为准。', '晴天水景附近可能有水雾，拍摄设备注意防水。', '亲子同行可先讲佛诞故事，再观察莲花、九龙和太子佛的对应关系。']
  },
  {
    poiId: 'baizi_mile',
    contentLevel: 'full',
    source: SOURCE,
    overview: '百子戏弥勒以笑容可掬的弥勒与孩童群像呈现欢喜、包容的生活气息，是灵山人文动线中更轻松亲切的一站。相较于庄严的佛殿与大佛，这里适合从人物姿态、群像互动和亲子视角理解佛教文化中贴近日常的一面，也适合为路线带来轻快的节奏。',
    highlights: [
      { title: '欢喜群像', description: '弥勒与孩童的互动造型让空间更具亲和力。' },
      { title: '民俗化表达', description: '用可观察的生活场景传递欢喜、包容等文化意象。' },
      { title: '亲子友好', description: '可引导孩子寻找不同孩童姿态，增加观察与交流。' }
    ],
    visitTips: ['适合停留拍照，但请避免攀爬或触摸雕塑。', '亲子游览可把“找一找不同动作”作为轻量互动。']
  },
  {
    poiId: 'xiangfu_temple',
    contentLevel: 'full',
    source: SOURCE,
    overview: '祥符禅寺是灵山胜境中承载历史脉络的古刹空间，寺院建筑、钟楼、古井和银杏共同构成安静而有层次的参观体验。这里值得重点了解的不是单一殿宇，而是古寺如何通过中轴、院落与礼佛顺序组织空间。第一次到访可先看整体格局，再根据现场秩序进入殿宇观察细节。',
    highlights: [
      { title: '古刹格局', description: '沿中轴展开的殿宇、钟鼓楼与院落，呈现清晰的礼佛空间层次。' },
      { title: '历史遗存', description: '古井、禅钟与银杏为寺院保留了可感知的时间痕迹。' },
      { title: '江南禅意', description: '红墙黛瓦、树影与钟声共同营造静谧的古寺氛围。' },
      { title: '路线承接', description: '它连接前段人文节点与大佛方向，是理解灵山历史线索的重要一站。' }
    ],
    visitTips: ['进入寺院请放低音量，遵循现场礼佛与拍摄提示。', '秋季可重点留意银杏与庭院光影；具体开放区域以现场为准。', '如要听钟声或参与相关活动，请以景区当日公告为准。']
  },
  {
    poiId: 'giant_buddha',
    contentLevel: 'full',
    source: SOURCE,
    overview: '灵山大佛位于景区核心朝礼轴线的高处，是游客认识灵山佛教文化与山水格局的重要地标。露天青铜立像的尺度、手印寓意、登临过程与太湖视野共同构成这一站的体验重点。第一次来不必急于登高，可先在前庭看整体比例，再沿动线逐步靠近，感受视角与空间的变化。',
    highlights: [
      { title: '青铜造像', description: '露天立像以庄重的体量成为景区最鲜明的视觉中心。' },
      { title: '手印寓意', description: '可结合导览了解手势所表达的安定、祝愿与慈悲意象。' },
      { title: '登云道视角', description: '登临过程不断改变仰视尺度，也是理解朝礼空间的重要体验。' },
      { title: '高处远眺', description: '天气适宜时可从平台观察景区与太湖方向的开阔视野。' }
    ],
    visitTips: ['登临前可在佛前广场先看整体，体力允许再按动线缓步上行。', '台阶与平台人流较多，请勿逆行或长时间停在通行处拍照。', '晴天逆光较强，拍摄可选择侧向角度；雨天注意防滑。']
  },
  {
    poiId: 'fan_gong',
    contentLevel: 'full',
    source: SOURCE,
    overview: '梵宫是灵山胜境中以建筑与工艺体验见长的佛教艺术空间。外部莲花圣塔与内部大空间、穹顶、木雕、琉璃等细节形成由外到内的层层展开。第一次来建议不要只在门口拍照，进入后抬头观察穹顶和装饰工艺，再按现场动线缓慢浏览，才能感受到传统艺术与现代建筑的结合。',
    highlights: [
      { title: '莲花圣塔外观', description: '外部轮廓具有很强的识别度，适合从广场和水景方向观察整体关系。' },
      { title: '星空穹顶', description: '进入中庭后抬头观看，是理解室内尺度与光影氛围的重点。' },
      { title: '传统工艺', description: '木雕、琉璃等细部把佛教艺术转化为可近距离观看的空间体验。' },
      { title: '仪式与演艺空间', description: '部分区域承接展演活动，参观节奏可结合当日安排调整。' }
    ],
    visitTips: ['室内参观请遵循动线与拍摄提示，避免停留在入口与通道中央。', '如计划观看演出，建议提前关注当天安排并预留入场时间；具体以景区当日公告为准。', '与儿童同行时可从色彩、穹顶和工艺细节开始观察，减少抽象术语。']
  },
  {
    poiId: 'wuyin_tancheng',
    contentLevel: 'full',
    source: SOURCE,
    overview: '五印坛城位于香水海周边，以白墙、红边、金顶和坛城意象形成与江南山水不同的建筑气质。它适合用来认识汉传与藏传佛教艺术在灵山的并置：先从建筑轮廓看风格差异，再进入或环绕空间观察手印、曼陀罗和转经等文化线索。',
    highlights: [
      { title: '坛城意象', description: '五印与曼陀罗的观念通过建筑、色彩和空间秩序转化为可观察的符号。' },
      { title: '藏式外观', description: '白墙、红边与金顶在湖水和绿地映衬下具有鲜明的轮廓。' },
      { title: '转经长廊', description: '可在遵循现场规则的前提下，了解顺时针绕行的礼序。' },
      { title: '湖岛视野', description: '与梵宫、香水海相互映照，适合从外部先看整体空间关系。' }
    ],
    visitTips: ['如经过转经区域，请遵循现场礼仪并保持安静。', '湖边栈道与台阶雨天可能湿滑，建议放慢脚步。', '室内展陈与体验活动以景区当日开放安排为准。']
  },
  {
    poiId: 'manfeilong_tower',
    contentLevel: 'full',
    source: SOURCE,
    overview: '曼飞龙塔以九塔组合和南传佛教建筑气质成为灵山中较具异域感的景观节点。它与梵宫、五印坛城分别呈现不同的佛教建筑语汇，适合放在同一段路线中对比观看。第一次来可先从远处辨认主塔与小塔的组合，再沿观景步道接近，感受塔身、湖景与绿地的关系。',
    highlights: [
      { title: '九塔组合', description: '主塔与八座小塔形成稳定而富有节奏的轮廓。' },
      { title: '南传风格', description: '可与周边汉传、藏传建筑对照，理解不同佛教艺术表达。' },
      { title: '园林视角', description: '塔、绿地与水景共同构成适合远望和拍照的景观层次。' }
    ],
    visitTips: ['建议先在观景步道留出完整构图，再靠近观察塔身纹饰。', '雨天石材和步道可能湿滑，拍照时注意脚下。', '如需进入特定区域，请以现场开放提示为准。']
  },
  {
    poiId: 'south_gate',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '南门入园是多条游览路线的共同起点。适合在这里确认同行人员、当天时间和想重点了解的景点，再选择自由探索或进入主题路线。它的价值在于帮助游客建立方向感，而不是长时间停留。',
    highlights: [
      { title: '路线起点', description: '多条主题路线可从这里进入，适合先确定游览节奏。' },
      { title: '方向建立', description: '入园前先看导览信息，可减少后续折返。' }
    ],
    visitTips: ['建议先确认天气、步行距离与同行者体力，再选择路线。', '高峰时段注意跟随园区指引，有序入园。']
  },
  {
    poiId: 'shengjing_square',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '胜境广场是入园后承接人流与路线的开阔空间，也是从入口景观走向核心游览区的过渡节点。适合在此短暂停留，确定大佛、寺院与梵宫等方向，再继续选择适合自己的游览节奏。',
    highlights: [
      { title: '开阔序厅', description: '空间视野较开，便于理解后续主轴和分支方向。' },
      { title: '路线分流', description: '可作为切换自由探索与主题路线的短暂停留点。' }
    ],
    visitTips: ['不要在主通行区域久留拍照，避免影响人流。', '可在这里补充饮水和整理路线，再前往下一站。']
  },
  {
    poiId: 'foshou_square',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '佛手广场以“天下第一掌”祈福体验为核心，是一处互动感较强的文化节点。它把庄重的礼佛意象转化为可近距离感受的广场空间，适合在路线中短暂停留、拍照并了解佛手所承载的祝愿与平安寓意。',
    highlights: [
      { title: '祈福意象', description: '佛手形象是这里最直观的文化符号。' },
      { title: '互动广场', description: '空间开阔，适合短暂停留与同行合影。' },
      { title: '路线衔接', description: '可连接寺院区与大佛方向的后续游览。' }
    ],
    visitTips: ['人流集中时请依次靠近体验，避免长时间占据拍照点。', '与儿童同行时注意广场人流与脚下安全。']
  },
  {
    poiId: 'xingtan_square',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '杏坛广场位于寺院区与大佛主轴之间，是调整步行节奏的空间节点。这里适合从开阔处回看寺院方向、整理后续登临动线，也适合作为同行者会合和短暂休息的位置。',
    highlights: [
      { title: '轴线过渡', description: '连接古寺人文空间与大佛方向的朝礼动线。' },
      { title: '休整节点', description: '便于在继续步行前整理队伍与游览计划。' }
    ],
    visitTips: ['如准备前往大佛，可在此确认体力和饮水情况。', '拍照时留意周边主通道，避免阻挡通行。']
  },
  {
    poiId: 'foqian_square',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '佛前广场是瞻礼灵山大佛前的重要前庭空间。它以开阔尺度承接登临前的人流与视线，适合先看佛像、台阶和广场的整体关系，再决定是否继续上行。对第一次到访的游客来说，这里也是拍摄大佛全景较容易建立构图的位置。',
    highlights: [
      { title: '大佛前庭', description: '为瞻礼和登临大佛提供开阔的停留空间。' },
      { title: '仰视角度', description: '可从不同距离观察佛像、台阶与天空形成的比例。' },
      { title: '动线起点', description: '后续可沿现场指引进入登临与参观区域。' }
    ],
    visitTips: ['建议先在广场看整体，再开始登临，避免中途频繁折返。', '人流较多时注意避开主通道拍照，并照看同行儿童。']
  },
  {
    poiId: 'fan_gong_square',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '梵宫广场是进入梵宫前后的外部过渡空间，适合从较远处观看建筑轮廓、莲花圣塔与周边水景。它更适合作为休整、集合和外观拍摄点，再根据当日开放情况进入梵宫继续参观。',
    highlights: [
      { title: '外观视角', description: '可从广场获得较完整的梵宫轮廓与空间尺度。' },
      { title: '休整过渡', description: '适合在室内参观前后调整节奏、会合同行者。' }
    ],
    visitTips: ['参观梵宫前可先查看当日开放与活动提示。', '广场日照较强时注意防晒和补水。']
  },
  {
    poiId: 'lingshan_jingshe',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '灵山精舍位于相对安静的园林环境中，是路线中适合放慢节奏的休憩节点。它不以宏大的地标感取胜，而是通过庭院、绿意与较缓的步行体验，为连续游览提供一次从热闹回到安静的转换。',
    highlights: [
      { title: '禅意园林', description: '环境较为宁静，适合感受灵山空间中更生活化的一面。' },
      { title: '节奏缓冲', description: '可作为长路线中的休整点，再继续前往周边景观。' }
    ],
    visitTips: ['需要休息时可适当放慢节奏，不必赶行程。', '进入室内或服务区域请遵循现场开放与秩序提示。']
  },
  {
    poiId: 'sansheng_hall',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '三圣殿是历史文化路线中的人文停留点，可结合殿宇空间与佛教文化线索继续理解灵山的主题。它适合在前段大佛、寺院与梵宫体验之后，作为一次相对安静的回看与收束，不需要快速通过。',
    highlights: [
      { title: '人文收束', description: '可把前段建筑、礼佛与文化线索在这里再次串联。' },
      { title: '殿宇氛围', description: '较安静的参观节奏适合细看空间与陈设。' }
    ],
    visitTips: ['殿内请保持安静，并遵循现场拍摄和参观提示。', '如在路线末段到访，可结合离园时间安排停留。']
  },
  {
    poiId: 'exit',
    contentLevel: 'basic',
    source: SOURCE,
    overview: '景区出口是本次游览的收尾节点。离园前可以回顾当天已走过的路线，确认同行人员和交通安排；若仍有未看的景点，也可根据体力和闭园时间决定是否返回补看。',
    highlights: [
      { title: '路线收尾', description: '适合回看本次游览的停留点与后续交通安排。' },
      { title: '离园提醒', description: '可在此确认同行人员、物品和返程方向。' }
    ],
    visitTips: ['离园前留意当日闭园、接驳与交通提示。', '如需再次进入景区其他区域，请先确认现场规则。']
  }
]

const poiDetailContentById = new Map(poiDetailContentEntries.map((item) => [item.poiId, item]))

export function getPoiDetailContent(poiId: string | undefined) {
  return poiId ? poiDetailContentById.get(poiId) : undefined
}

export function hasPoiDetailContent(poiId: string | undefined) {
  return Boolean(getPoiDetailContent(poiId))
}

export { poiDetailContentEntries }
