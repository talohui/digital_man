// 灵山景区商城商品目录：模拟点单闭环用的真实 SKU。
// category 复用 useTicketStore 的 4 个分析品类（food/shopping/transport/entertainment），
// 保证下单后每个行项仍能映射成现有 capturePurchase 契约，大屏「消费结构」零改动。
// spotIds 表示该商品在哪些景点可购（用于「附近可购」高亮）；为空数组表示全园通用。
import type { PurchaseCategory } from '../store/useTicketStore'

export type Product = {
  id: string
  name: string
  category: PurchaseCategory
  price: number
  description: string
  /** 在哪些景点可购；空数组=全园通用 */
  spotIds: string[]
}

export const lingshanProducts: Product[] = [
  // 餐饮
  { id: 'p_food_noodle', name: '灵山素面', category: 'food', price: 38, description: '祥符禅寺素斋馆 · 经典菌菇汤底', spotIds: ['xiangfu_temple'] },
  { id: 'p_food_tea', name: '禅意茶歇套餐', category: 'food', price: 48, description: '菩提大道茶舍 · 一茶一点', spotIds: ['puti_avenue'] },
  { id: 'p_food_zhai', name: '梵宫素斋简餐', category: 'food', price: 88, description: '梵宫素斋馆 · 时令素食套餐', spotIds: ['fan_gong'] },
  { id: 'p_food_congee', name: '五谷养生粥', category: 'food', price: 28, description: '全园便民餐点 · 暖胃首选', spotIds: [] },

  // 文创
  { id: 'p_shop_sachet', name: '吉祥香囊', category: 'shopping', price: 58, description: '灵山大佛文创铺 · 手作祈福香囊', spotIds: ['giant_buddha', 'xiangfu_temple'] },
  { id: 'p_shop_postcard', name: '大佛主题明信片', category: 'shopping', price: 28, description: '灵山大佛文创铺 · 一套六张', spotIds: ['giant_buddha'] },
  { id: 'p_shop_magnet', name: '五印坛城冰箱贴', category: 'shopping', price: 36, description: '五印坛城文创点 · 金属浮雕款', spotIds: ['wuyin_tancheng'] },
  { id: 'p_shop_medal', name: '九龙灌浴纪念铜章', category: 'shopping', price: 98, description: '九龙灌浴纪念品店 · 限量编号', spotIds: ['jiulong_guanyu'] },
  { id: 'p_shop_map', name: '灵山手绘游览图', category: 'shopping', price: 18, description: '南门服务点 · 文艺收藏版', spotIds: ['south_gate'] },

  // 交通
  { id: 'p_trans_single', name: '观光电瓶车单程', category: 'transport', price: 20, description: '园内接驳 · 单程一站', spotIds: [] },
  { id: 'p_trans_pass', name: '电瓶车全程通票', category: 'transport', price: 60, description: '园内接驳 · 当日不限次', spotIds: ['south_gate'] },
  { id: 'p_trans_park', name: '停车券', category: 'transport', price: 15, description: '南门生态停车场 · 当日有效', spotIds: ['south_gate'] },

  // 演艺
  { id: 'p_show_jixiang', name: '《灵山吉祥颂》演出票', category: 'entertainment', price: 120, description: '梵宫剧场 · 大型室内仪式展演', spotIds: ['fan_gong'] },
  { id: 'p_show_tancheng', name: '五印坛城演艺体验', category: 'entertainment', price: 80, description: '五印坛城 · 沉浸式光影体验', spotIds: ['wuyin_tancheng'] },
  { id: 'p_show_blessing', name: '礼佛祈福仪式体验', category: 'entertainment', price: 168, description: '祥符禅寺 · 引导式祈福仪式', spotIds: ['xiangfu_temple'] },
]

export function getProductsByCategory(category: PurchaseCategory): Product[] {
  return lingshanProducts.filter((item) => item.category === category)
}
