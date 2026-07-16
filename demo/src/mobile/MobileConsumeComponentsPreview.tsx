import { useState } from 'react'
import MarketTitle from '../components/mobile/consume/MarketTitle'
import MarketCategoryTabs from '../components/mobile/consume/MarketCategoryTabs'
import XiaolingRecommendationNote from '../components/mobile/consume/XiaolingRecommendationNote'
import MarketProductLedger from '../components/mobile/consume/MarketProductLedger'
import MarketCartDock from '../components/mobile/consume/MarketCartDock'
import MarketCartSheet, {
  type MarketCartSheetItem
} from '../components/mobile/consume/MarketCartSheet'
import '../styles/c-app/marketCategoryTabs.css'
import '../styles/c-app/xiaolingRecommendationNote.css'
import '../styles/c-app/marketProductLedger.css'
import '../styles/c-app/consumeComponentsPreview.css'
import '../styles/c-app/consumeTypography.css'

// LOCAL CONSUME TITLE PREVIEW - REMOVE BEFORE COMMIT

const services = [
  { id: 'food', label: '餐饮斋茶', icon: '/icons/cat-food.png' },
  { id: 'culture', label: '文创礼品', icon: '/icons/cat-culture.png' },
  { id: 'transport', label: '园内交通', icon: '/icons/cat-transport.png' },
  { id: 'show', label: '演艺秀场', icon: '/icons/cat-show.png' }
]

const recommendations = {
  food: { categoryId: 'food', itemId: 'p_food_zhai', reason: '距梵宫出口约 120 米', reasonSource: 'demo', name: '灵山素斋套餐', description: '清爽素食与暖茶，适合游览途中稍作休息', priceLabel: '¥58', availabilityLabel: '可取', locationLabel: '梵宫出口' },
  culture: { categoryId: 'culture', itemId: 'p_culture_sachet', reason: '沿当前路线顺路可取', reasonSource: 'demo', name: '灵山莲韵香囊', description: '淡雅莲香随行，也适合作为旅途纪念', priceLabel: '¥39', availabilityLabel: '有货', locationLabel: '文创雅集' },
  transport: { categoryId: 'transport', itemId: 'p_transport_shuttle', reason: '下一站步行约 18 分钟', reasonSource: 'demo', name: '园内观光车票', description: '覆盖主要景点接驳站，可减少长距离步行', priceLabel: '¥30', availabilityLabel: '可用', locationLabel: '全园站点' },
  show: { categoryId: 'show', itemId: 'p_show_jixiang', reason: '最近场次还有余位', reasonSource: 'demo', name: '吉祥颂演出', description: '沉浸感受灵山文化演艺，建议提前入场', priceLabel: '¥80', availabilityLabel: '有余位', locationLabel: '梵宫剧场' }
} as const

const catalogByCategory = {
  food: [
    { id: 'food-1', name: '灵山素斋套餐', description: '时蔬、菌菇与暖茶搭配，清爽不腻', priceLabel: '¥58', image: '/icons/cat-food.png', imageFrame: 'moon', availabilityLabel: '可取', locationLabel: '梵宫出口' },
    { id: 'food-2', name: '禅意茶歇', description: '莲子酥配清香绿茶，适合短暂停留', priceLabel: '¥28', image: '/icons/cat-food.png', imageFrame: 'moon', availabilityLabel: '现制', locationLabel: '禅茶空间' },
    { id: 'food-3', name: '罗汉素面', description: '温热汤面与山珍时蔬，补充游览体力', priceLabel: '¥36', image: '/icons/cat-food.png', imageFrame: 'moon', availabilityLabel: '可堂食', locationLabel: '五观堂' }
  ],
  culture: [
    { id: 'culture-1', name: '灵山莲韵香囊', description: '淡雅莲香随行，适合作为旅途纪念', priceLabel: '¥39', image: '/icons/cat-culture.png', imageFrame: 'bogu', availabilityLabel: '有货', locationLabel: '文创雅集' },
    { id: 'culture-2', name: '大佛祈福书签', description: '金属镂刻与暖金流苏，轻巧便携', priceLabel: '¥26', image: '/icons/cat-culture.png', imageFrame: 'bogu', availabilityLabel: '有货', locationLabel: '出口商店' },
    { id: 'culture-3', name: '梵宫纹样手账', description: '取材梵宫穹顶纹样的旅行手账册', priceLabel: '¥49', image: '/icons/cat-culture.png', imageFrame: 'bogu', availabilityLabel: '少量', locationLabel: '梵宫文创' }
  ],
  transport: [
    { id: 'transport-1', name: '园内观光车票', description: '覆盖主要景点接驳站，减少长距离步行', priceLabel: '¥30', image: '/icons/cat-transport.png', imageFrame: 'moon', availabilityLabel: '可用', locationLabel: '全园站点' },
    { id: 'transport-2', name: '单程接驳票', description: '适合前往下一处较远景点', priceLabel: '¥12', image: '/icons/cat-transport.png', imageFrame: 'moon', availabilityLabel: '即买即用', locationLabel: '就近站点' },
    { id: 'transport-3', name: '家庭同行票', description: '适合两位成人与一名儿童同行', priceLabel: '¥68', image: '/icons/cat-transport.png', imageFrame: 'moon', availabilityLabel: '可用', locationLabel: '游客中心' }
  ],
  show: [
    { id: 'show-1', name: '吉祥颂演出', description: '沉浸感受灵山文化演艺，建议提前入场', priceLabel: '¥80', image: '/icons/cat-show.png', imageFrame: 'bogu', availabilityLabel: '有余位', locationLabel: '梵宫剧场' },
    { id: 'show-2', name: '九龙灌浴', description: '大型音乐动态群雕演出', priceLabel: '免费', image: '/icons/cat-show.png', imageFrame: 'bogu', availabilityLabel: '下一场', locationLabel: '九龙灌浴广场' },
    { id: 'show-3', name: '灯影禅境', description: '暮色中的光影与音乐体验', priceLabel: '¥60', image: '/icons/cat-show.png', imageFrame: 'bogu', availabilityLabel: '可预约', locationLabel: '梵宫外苑' }
  ]
} as const

const allCatalogItems = Object.values(catalogByCategory).flat()

function parsePriceLabel(priceLabel: string) {
  return Number(priceLabel.replace(/[^\d.]/g, '')) || 0
}

function MobileConsumeComponentsPreview() {
  const [replay, setReplay] = useState(0)
  const [category, setCategory] = useState('food')
  const [recommendationQuantities, setRecommendationQuantities] = useState<Record<string, number>>({})
  const [recommendationMotion, setRecommendationMotion] = useState({ categoryId: '', sequence: 0 })
  const [assistantHint, setAssistantHint] = useState('')
  const [productQuantities, setProductQuantities] = useState<Record<string, number>>({})
  const [cartHint, setCartHint] = useState('')
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const recommendation = recommendations[category as keyof typeof recommendations]
  const catalog = catalogByCategory[category as keyof typeof catalogByCategory]
  const recommendationQuantity = recommendationQuantities[category] ?? 0
  const cartCount = Object.values(recommendationQuantities).reduce((sum, quantity) => sum + quantity, 0)
    + Object.values(productQuantities).reduce((sum, quantity) => sum + quantity, 0)
  const recommendationTotal = Object.entries(recommendationQuantities).reduce((sum, [categoryId, quantity]) => {
    const item = recommendations[categoryId as keyof typeof recommendations]
    return sum + (item ? parsePriceLabel(item.priceLabel) * quantity : 0)
  }, 0)
  const productTotal = Object.entries(productQuantities).reduce((sum, [itemId, quantity]) => {
    const item = allCatalogItems.find((candidate) => candidate.id === itemId)
    return sum + (item ? parsePriceLabel(item.priceLabel) * quantity : 0)
  }, 0)
  const cartTotal = recommendationTotal + productTotal
  const cartSheetItems: MarketCartSheetItem[] = [
    ...Object.entries(recommendationQuantities).flatMap(([categoryId, quantity]) => {
      const item = recommendations[categoryId as keyof typeof recommendations]
      if (!item || quantity <= 0) return []
      return [{
        id: `recommendation:${categoryId}`,
        name: item.name,
        categoryLabel: `小灵推荐 · ${services.find((service) => service.id === categoryId)?.label ?? '景区消费'}`,
        unitPriceLabel: item.priceLabel,
        subtotalLabel: `¥${parsePriceLabel(item.priceLabel) * quantity}`,
        quantity
      }]
    }),
    ...Object.entries(productQuantities).flatMap(([itemId, quantity]) => {
      const item = allCatalogItems.find((candidate) => candidate.id === itemId)
      if (!item || quantity <= 0) return []
      const categoryId = itemId.split('-')[0]
      return [{
        id: `catalog:${itemId}`,
        name: item.name,
        categoryLabel: services.find((service) => service.id === categoryId)?.label ?? '雅集货目',
        unitPriceLabel: item.priceLabel,
        subtotalLabel: `¥${parsePriceLabel(item.priceLabel) * quantity}`,
        quantity
      }]
    })
  ]

  const changeRecommendationQuantity = (delta: number) => {
    setRecommendationMotion((current) => ({ categoryId: category, sequence: current.sequence + 1 }))
    setRecommendationQuantities((current) => ({
      ...current,
      [category]: Math.max(0, (current[category] ?? 0) + delta)
    }))
  }

  const recommendationAction = recommendationQuantity === 0 ? (
    <button type="button" onClick={() => changeRecommendationQuantity(1)}>＋ 加入</button>
  ) : (
    <div className="xiaoling-recommendation-note__stepper" aria-label={`${recommendation.name}数量`}>
      <button type="button" onClick={() => changeRecommendationQuantity(-1)} aria-label="减少数量">−</button>
      <strong>{recommendationQuantity}</strong>
      <button type="button" onClick={() => changeRecommendationQuantity(1)} aria-label="增加数量">＋</button>
    </div>
  )

  const changeProductQuantity = (itemId: string, nextQuantity: number) => {
    setProductQuantities((current) => ({ ...current, [itemId]: Math.max(0, nextQuantity) }))
  }

  const changeCartSheetQuantity = (lineId: string, nextQuantity: number) => {
    const [source, itemId] = lineId.split(':')
    if (source === 'recommendation') {
      setRecommendationQuantities((current) => ({ ...current, [itemId]: Math.max(0, nextQuantity) }))
      return
    }
    setProductQuantities((current) => ({ ...current, [itemId]: Math.max(0, nextQuantity) }))
  }

  const openCartSheet = () => {
    setCartHint('')
    setCartSheetOpen(true)
  }

  const loadDemoSelection = () => {
    setProductQuantities((current) => ({
      ...current,
      'food-1': Math.max(1, current['food-1'] ?? 0),
      'culture-1': Math.max(1, current['culture-1'] ?? 0)
    }))
    setCartHint('已装入两件演示商品，可打开货筹册观察数量联动。')
  }

  return (
    <div className="scroll-title-preview c-app-root">
      <main className="scroll-title-device">
        <header className="scroll-title-topbar">
          <span><small>消费组件实验室</small><strong>06 · 核筹面板</strong></span>
          <button type="button" onClick={() => setReplay((value) => value + 1)}>重播展开</button>
        </header>

        <section className="scroll-title-scene" aria-labelledby="scroll-title-main">
          <div className="scroll-title-scene__space" aria-hidden="true" />
          <div className="scroll-title-scene__content" key={`main-${replay}`}>
            <MarketTitle
              eyebrow="灵山四集"
              title="景区消费"
              aside="按需选择"
              id="scroll-title-main"
              animationDelay={100}
            />

            <MarketCategoryTabs
              className="scroll-title-category-preview"
              items={services}
              value={category}
              onChange={setCategory}
            />
            <p className="scroll-title-category-state">
              当前选择：<strong>{services.find((item) => item.id === category)?.label}</strong>
            </p>

            <XiaolingRecommendationNote
              key={`recommendation-${category}`}
              className="scroll-title-recommendation-preview"
              recommendation={recommendation}
              action={recommendationAction}
              quantityMotionSequence={recommendationMotion.categoryId === category ? recommendationMotion.sequence : 0}
              onAssistantActivate={() => setAssistantHint('接口演示：正式迁移时将在这里唤起 Fay 小灵会话')}
              onReasonActivate={() => setAssistantHint(`接口演示：将向 Fay 追问“为什么推荐${recommendation.name}”`)}
            />
            {assistantHint ? <p className="scroll-title-assistant-hint" role="status">{assistantHint}</p> : null}

            <MarketProductLedger
              className="scroll-title-product-preview"
              items={catalog.slice(0, 2)}
              quantities={productQuantities}
              onQuantityChange={changeProductQuantity}
            />

            <MarketCartDock
              className="scroll-title-cart-preview"
              count={cartCount}
              totalLabel={`¥${cartTotal}`}
              onOpen={openCartSheet}
            />

            <section className="scroll-title-sheet-lab" aria-labelledby="cart-sheet-lab-title">
              <header>
                <div>
                  <span>消费组件 06 · 设计已确认</span>
                  <h2 id="cart-sheet-lab-title">经折成册，彩筹出匣</h2>
                  <p>以 B「经折账册」建立清晰层级，融合 C「开匣验筹」的货筹升起与回落动效。</p>
                </div>
                <button type="button" onClick={loadDemoSelection}>装入演示所选</button>
              </header>

              <div className="scroll-title-sheet-options">
                <button
                  className="scroll-title-sheet-option scroll-title-sheet-option--folio-tally"
                  type="button"
                  onClick={openCartSheet}
                >
                  <span className="scroll-title-sheet-option__index">B+C</span>
                  <span className="scroll-title-sheet-option__copy">
                    <small>经折主体 · 货筹交互</small>
                    <strong>经折货筹册</strong>
                    <em>账页舒展，彩筹依次入册</em>
                    <p>保留经折账册的清晰核对结构，商品行使用彩绘货筹签首，并从深绿筹匣中错峰升起。</p>
                  </span>
                  <span className="scroll-title-sheet-option__mini" aria-hidden="true"><i /><i /><i /></span>
                  <b>查看货筹册<span>›</span></b>
                </button>
              </div>
            </section>

            {cartHint ? <p className="scroll-title-cart-hint" role="status">{cartHint}</p> : null}
          </div>
        </section>

        <footer className="scroll-title-footer">本页联动验证消费组件 01—06，消费页 V2 未修改。</footer>

        <MarketCartSheet
          open={cartSheetOpen}
          items={cartSheetItems}
          totalLabel={`¥${cartTotal}`}
          onClose={() => setCartSheetOpen(false)}
          onQuantityChange={changeCartSheetQuantity}
          onConfirm={() => {
            setCartSheetOpen(false)
            setCartHint(cartCount > 0
              ? `原型确认：共 ${cartCount} 件，合计 ¥${cartTotal}；未接入真实支付。`
              : '筹册尚空，请先选择商品。')
          }}
        />
      </main>
    </div>
  )
}

export default MobileConsumeComponentsPreview
