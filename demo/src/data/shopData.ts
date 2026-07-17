import type { PurchaseCategory } from '../store/useTicketStore'

export type ProductOptionGroup = {
  label: string
  values: string[]
}

export type Product = {
  id: string
  name: string
  category: PurchaseCategory
  /** 资料包中有明确价格时填写；无明确价格时为 null。 */
  price: number | null
  priceLabel: string
  description: string
  locationLabel: string
  availabilityLabel: string
  /** 仅价格和服务边界都可确认的条目进入现有模拟支付。 */
  orderable: boolean
  detailOptions: ProductOptionGroup[]
  notice: string
  /** 在哪些景点可用或可领取；空数组表示资料仅说明“景区内”。 */
  spotIds: string[]
  source: {
    document: '景点结构化数据集' | '个性化游览指南'
    section: string
  }
}

/**
 * 灵山消费目录（公开资料包映射）。
 *
 * 约束：
 * - 不补写资料中没有的商品、价格、库存、营业状态或预约余量。
 * - 来源字段仅供内部追溯，游客端只展示可理解的价格、服务状态和使用说明。
 * - 免费领取、门票内含和未标价服务仅展示信息，不进入购物车。
 */
export const lingshanProducts: Product[] = [
  {
    id: 'p_food_fangong_buffet',
    name: '梵宫素斋自助',
    category: 'food',
    price: 50,
    priceLabel: '¥50/位',
    description: '清淡雅致，菜品丰富，适合不同口味需求',
    locationLabel: '灵山梵宫',
    availabilityLabel: '可下单',
    orderable: true,
    detailOptions: [{ label: '计价单位', values: ['按位'] }],
    notice: '菜品与供应时段可能随当日安排调整，请以下单页和门店现场说明为准。',
    spotIds: ['fan_gong'],
    source: { document: '个性化游览指南', section: '餐饮与住宿推荐' }
  },
  {
    id: 'p_food_noodle_set',
    name: '素面套餐',
    category: 'food',
    price: 35,
    priceLabel: '¥35/位',
    description: '口味清淡，适合游览途中快速用餐',
    locationLabel: '景区内多个餐厅',
    availabilityLabel: '可下单',
    orderable: true,
    detailOptions: [{ label: '计价单位', values: ['按位'] }],
    notice: '供应餐厅、餐品内容与供应时段可能调整，请以下单页和门店现场说明为准。',
    spotIds: [],
    source: { document: '个性化游览指南', section: '餐饮与住宿推荐' }
  },
  {
    id: 'p_food_jingshe_vegetarian',
    name: '灵山精舍素斋',
    category: 'food',
    price: null,
    priceLabel: '到店咨询',
    description: '禅意酒店内素斋，环境优雅，菜品精致',
    locationLabel: '灵山精舍',
    availabilityLabel: '现场服务',
    orderable: false,
    detailOptions: [],
    notice: '可前往灵山精舍咨询当日菜品、用餐时段与服务安排。',
    spotIds: ['lingshan_jingshe'],
    source: { document: '个性化游览指南', section: '餐饮与住宿推荐' }
  },
  {
    id: 'p_food_wujinyi_tea',
    name: '灵山禅茶品鉴',
    category: 'food',
    price: 0,
    priceLabel: '免费品鉴',
    description: '禅茶免费品鉴，请在现场指定区域自行取用',
    locationLabel: '无尽意斋禅意茶室',
    availabilityLabel: '现场体验',
    orderable: false,
    detailOptions: [],
    notice: '开放时间与现场安排可能调整，请以景区官方小程序、广播或工作人员说明为准。',
    spotIds: ['wujinyi_zhai'],
    source: { document: '景点结构化数据集', section: 'LS-016 无尽意斋' }
  },

  {
    id: 'p_shop_blessing_card',
    name: '万佛殿祈福卡',
    category: 'shopping',
    price: 0,
    priceLabel: '免费领取',
    description: '写下心愿后，可悬挂于指定祈福区',
    locationLabel: '佛教文化博览馆三层万佛殿',
    availabilityLabel: '现场领取',
    orderable: false,
    detailOptions: [],
    notice: '请前往万佛殿指定区域现场领取，数量与领取安排以现场为准。',
    spotIds: ['giant_buddha'],
    source: { document: '景点结构化数据集', section: 'LS-012 佛教文化博览馆' }
  },

  {
    id: 'p_transport_sightseeing_car',
    name: '观光车单独购票',
    category: 'transport',
    price: 40,
    priceLabel: '¥40/人',
    description: '景区内交通，适合体力有限或希望减少步行的游客',
    locationLabel: '灵山胜境景区内',
    availabilityLabel: '可购买',
    orderable: true,
    detailOptions: [{ label: '使用范围', values: ['景区内交通'] }],
    notice: '乘车范围、有效期与运营时间请以购票说明及现场安排为准。',
    spotIds: [],
    source: { document: '个性化游览指南', section: '门票与优惠政策' }
  },

  {
    id: 'p_show_jixiang_song',
    name: '《灵山吉祥颂》',
    category: 'entertainment',
    price: 0,
    priceLabel: '大门票内含',
    description: '梵宫圣坛演出，每场约 20 分钟',
    locationLabel: '灵山梵宫',
    availabilityLabel: '以景区公告为准',
    orderable: false,
    detailOptions: [{ label: '演出场次', values: ['10:35', '11:30', '14:00', '16:00'] }],
    notice: '凭景区大门票入场，建议提前 30 分钟排队；节假日可能加演，具体以当日公告和景区广播为准。',
    spotIds: ['fan_gong'],
    source: { document: '景点结构化数据集', section: 'LS-013 灵山梵宫' }
  }
]

export function getProductsByCategory(category: PurchaseCategory): Product[] {
  return lingshanProducts.filter((item) => item.category === category)
}
