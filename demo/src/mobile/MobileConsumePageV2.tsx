import { useEffect, useMemo, useRef, useState } from 'react'
import {
  MarketCartDock,
  MarketCartSheet,
  MarketCategoryTabs,
  MarketProductLedger,
  MarketTitle,
  XiaolingRecommendationNote,
  type MarketCartSheetItem,
  type MarketProductLedgerItem,
  type XiaolingRecommendationData,
  type XiaolingRecommendationReasonStatus
} from '../components/mobile/consume'
import CAppBottomNav from '../components/mobile/navigation/CAppBottomNav'
import { XiaolingAvatar } from '../components/guide/XiaolingAvatar'
import { getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { lingshanProducts, type Product } from '../data/shopData'
import { capturePurchase } from '../lib/analytics'
import { useGuideStore } from '../store/useGuideStore'
import { useTicketStore, type OrderRecord, type PurchaseCategory } from '../store/useTicketStore'
import PaymentSheet from './PaymentSheet'
import {
  ConsumeV2CheckoutSheet,
  ConsumeV2OrderSuccessDialog,
  ConsumeV2OrdersSheet,
  ConsumeV2ProductDetailSheet,
  type ConsumeV2Order,
  type ConsumeV2OrderLine
} from './consume-v2/ConsumeV2Overlays'
import '../styles/c-app/marketCategoryTabs.css'
import '../styles/c-app/xiaolingRecommendationNote.css'
import '../styles/c-app/marketProductLedger.css'
import '../styles/c-app/mobileConsumeV2.css'
import '../styles/c-app/consumeTypography.css'

type MobileConsumePageV2Props = {
  /** `/consume-v2` 使用本地预览；`/consume` 使用已购票后的正式状态与模拟收银台。 */
  mode?: 'preview' | 'formal'
}

const CATEGORIES: Array<{
  id: PurchaseCategory
  label: string
  icon: string
}> = [
  { id: 'food', label: '餐饮斋茶', icon: '/icons/cat-food.png' },
  { id: 'shopping', label: '文创礼品', icon: '/icons/cat-culture.png' },
  { id: 'transport', label: '园内交通', icon: '/icons/cat-transport.png' },
  { id: 'entertainment', label: '演艺秀场', icon: '/icons/cat-show.png' }
]

const CATEGORY_LABELS: Record<PurchaseCategory, string> = {
  food: '餐饮斋茶',
  shopping: '文创礼品',
  transport: '园内交通',
  entertainment: '演艺秀场'
}

const CATEGORY_ICONS: Record<PurchaseCategory, string> = {
  food: '/icons/cat-food.png',
  shopping: '/icons/cat-culture.png',
  transport: '/icons/cat-transport.png',
  entertainment: '/icons/cat-show.png'
}

const RECOMMENDATION_IDS: Record<PurchaseCategory, string> = {
  food: 'p_food_fangong_buffet',
  shopping: 'p_shop_blessing_card',
  transport: 'p_transport_sightseeing_car',
  entertainment: 'p_show_jixiang_song'
}

const RECOMMENDATION_REASONS: Record<PurchaseCategory, string> = {
  food: '梵宫素斋口味清淡、菜品丰富，适合在游览途中安排用餐',
  shopping: '万佛殿可现场领取祈福卡，写下心愿后挂于指定祈福区',
  transport: '如希望减少步行、轻松游览，可选择景区观光车',
  entertainment: '梵宫当日设有多个演出场次，可提前安排到场时间'
}

function formatMoney(value: number) {
  return `¥${Math.round(value)}`
}

function getProductPrice(product: Product) {
  return product.price ?? 0
}

function getRecommendation(category: PurchaseCategory): Product {
  return lingshanProducts.find((product) => product.id === RECOMMENDATION_IDS[category])
    ?? lingshanProducts.find((product) => product.category === category)
    ?? lingshanProducts[0]
}

function toConsumeV2Order(order: OrderRecord): ConsumeV2Order {
  const grossTotal = order.items.reduce((sum, item) => sum + item.price * item.qty, 0)
  let allocatedTotal = 0
  const createdAt = new Date(order.createdAt)
  const createdAtLabel = Number.isNaN(createdAt.getTime())
    ? '刚刚'
    : createdAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })

  return {
    id: order.id.slice(-8).toUpperCase(),
    createdAtLabel,
    totalLabel: formatMoney(order.total),
    statusLabel: '已确认',
    lines: order.items.map((item, index) => {
      const grossAmount = item.price * item.qty
      const isLastItem = index === order.items.length - 1
      const subtotalValue = isLastItem
        ? Math.round((order.total - allocatedTotal) * 100) / 100
        : Math.round((grossTotal > 0 ? grossAmount / grossTotal * order.total : 0) * 100) / 100
      allocatedTotal += subtotalValue
      return {
        id: `${order.id}-${item.productId}-${index}`,
        name: item.name,
        category: item.category,
        categoryLabel: CATEGORY_LABELS[item.category],
        specificationLabel: item.specificationLabel ?? '已选规格',
        quantity: item.qty,
        subtotalLabel: formatMoney(subtotalValue),
        subtotalValue
      }
    })
  }
}

function MobileConsumePageV2({ mode = 'preview' }: MobileConsumePageV2Props) {
  const isFormal = mode === 'formal'
  const ticket = useTicketStore((state) => state.ticketProfile)
  const persistedOrders = useTicketStore((state) => state.orders)
  const placeOrder = useTicketStore((state) => state.placeOrder)
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const [category, setCategory] = useState<PurchaseCategory>('food')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [cartSpecifications, setCartSpecifications] = useState<Record<string, string[]>>({})
  const [cartSheetOpen, setCartSheetOpen] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [ordersOpen, setOrdersOpen] = useState(false)
  const [detailProductId, setDetailProductId] = useState('')
  const [reasonStatus, setReasonStatus] = useState<XiaolingRecommendationReasonStatus>('loading')
  const [reasonOpen, setReasonOpen] = useState(false)
  const [recommendationMotion, setRecommendationMotion] = useState(0)
  const [toast, setToast] = useState('')
  const [successOrder, setSuccessOrder] = useState<ConsumeV2Order | null>(null)
  const [previewOrders, setPreviewOrders] = useState<ConsumeV2Order[]>([])
  const [showPayment, setShowPayment] = useState(false)
  const [pendingDiscount, setPendingDiscount] = useState(0)
  const [pendingPaymentAmount, setPendingPaymentAmount] = useState(0)
  const toastTimer = useRef<number | null>(null)
  const activeRoute = getGuideRouteById(activeRouteId)
  const activeSpot = selectedSpotId ? getGuideSpotById(selectedSpotId) : null

  const products = useMemo(
    () => lingshanProducts.filter((product) => product.category === category),
    [category]
  )
  const orderableProductCount = products.filter((product) => product.orderable).length
  const recommendationProduct = getRecommendation(category)
  const detailProduct = detailProductId
    ? lingshanProducts.find((product) => product.id === detailProductId) ?? null
    : null
  const recommendationQuantity = cart[recommendationProduct.id] ?? 0

  const recommendation: XiaolingRecommendationData = {
    categoryId: category,
    itemId: recommendationProduct.id,
    reason: RECOMMENDATION_REASONS[category],
    reasonSource: 'rule',
    name: recommendationProduct.name,
    description: recommendationProduct.description,
    priceLabel: recommendationProduct.priceLabel,
    availabilityLabel: recommendationProduct.availabilityLabel,
    locationLabel: recommendationProduct.locationLabel
  }

  const ledgerItems: MarketProductLedgerItem[] = products.map((product) => {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      priceLabel: product.priceLabel,
      image: CATEGORY_ICONS[product.category],
      imageFrame: product.category === 'food' || product.category === 'transport' ? 'moon' : 'bogu',
      availabilityLabel: product.availabilityLabel,
      locationLabel: product.locationLabel,
      orderable: product.orderable
    }
  })

  const cartLines = useMemo(
    () => Object.entries(cart).flatMap(([id, quantity]) => {
      const product = lingshanProducts.find((item) => item.id === id)
      return product && quantity > 0 ? [{ product, quantity }] : []
    }),
    [cart]
  )
  const cartCount = cartLines.reduce((sum, line) => sum + line.quantity, 0)
  const cartTotal = cartLines.reduce((sum, line) => sum + getProductPrice(line.product) * line.quantity, 0)
  const cartSheetItems: MarketCartSheetItem[] = cartLines.map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    categoryLabel: [CATEGORY_LABELS[product.category], ...(cartSpecifications[product.id] ?? [])].join(' · '),
    unitPriceLabel: product.priceLabel,
    subtotalLabel: formatMoney(getProductPrice(product) * quantity),
    quantity
  }))
  const checkoutLines: ConsumeV2OrderLine[] = cartLines.map(({ product, quantity }) => ({
    id: product.id,
    name: product.name,
    category: product.category,
    categoryLabel: CATEGORY_LABELS[product.category],
    specificationLabel: (cartSpecifications[product.id] ?? ['默认规格']).join(' · '),
    quantity,
    subtotalLabel: formatMoney(getProductPrice(product) * quantity),
    subtotalValue: getProductPrice(product) * quantity
  }))
  const displayOrders = useMemo(
    () => isFormal ? persistedOrders.map(toConsumeV2Order) : previewOrders,
    [isFormal, persistedOrders, previewOrders]
  )

  useEffect(() => {
    setReasonStatus('loading')
    setReasonOpen(false)
    const timer = window.setTimeout(() => setReasonStatus('ready'), 620)
    return () => window.clearTimeout(timer)
  }, [category])

  const setQuantity = (itemId: string, nextQuantity: number) => {
    if (nextQuantity <= 0) {
      setCartSpecifications((specifications) => {
        const nextSpecifications = { ...specifications }
        delete nextSpecifications[itemId]
        return nextSpecifications
      })
    }
    setCart((current) => {
      const next = { ...current }
      if (nextQuantity <= 0) delete next[itemId]
      else next[itemId] = nextQuantity
      return next
    })
  }

  const changeRecommendationQuantity = (delta: number) => {
    if (!recommendationProduct.orderable) return
    setRecommendationMotion((sequence) => sequence + 1)
    setQuantity(recommendationProduct.id, recommendationQuantity + delta)
  }

  const showPrototypeToast = (message: string) => {
    setToast(message)
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(''), 2200)
  }

  const replayRecommendation = () => {
    setReasonStatus('loading')
    window.setTimeout(() => {
      setReasonStatus('ready')
      showPrototypeToast('小灵已根据当前分类重新检查沿途选项')
    }, 760)
  }

  const completePreviewOrder = (method: string, paidTotal: number) => {
    const order: ConsumeV2Order = {
      id: `LS${String(Date.now()).slice(-8)}`,
      createdAtLabel: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      totalLabel: formatMoney(paidTotal),
      statusLabel: '已确认',
      lines: checkoutLines
    }
    setPreviewOrders((current) => [order, ...current])
    setSuccessOrder(order)
    setCart({})
    setCartSpecifications({})
    setCheckoutOpen(false)
    showPrototypeToast(`支付已完成 · ${method}`)
  }

  const requestFormalPayment = ({ amount, discount }: { amount: number; discount: number }) => {
    setPendingPaymentAmount(amount)
    setPendingDiscount(discount)
    setCheckoutOpen(false)
    setShowPayment(true)
  }

  const completeFormalOrder = (method: 'wechat' | 'alipay') => {
    if (!ticket || cartLines.length === 0) return
    const { order, records } = placeOrder(
      cartLines.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        category: product.category,
        price: getProductPrice(product),
        qty: quantity,
        specificationLabel: (cartSpecifications[product.id] ?? ['已选规格']).join(' · ')
      })),
      {
        spotId: selectedSpotId ?? undefined,
        routeId: activeRouteId,
        ticketId: ticket.ticketId,
        discount: pendingDiscount
      }
    )
    records.forEach((record) => capturePurchase(record))
    const confirmedOrder = toConsumeV2Order(order)
    setSuccessOrder(confirmedOrder)
    setCart({})
    setCartSpecifications({})
    setShowPayment(false)
    setPendingDiscount(0)
    showPrototypeToast(`支付已完成 · ${method === 'wechat' ? '微信支付' : '支付宝'}`)
  }

  const recommendationAction = !recommendationProduct.orderable ? (
    <button type="button" onClick={() => setDetailProductId(recommendationProduct.id)}>查看信息</button>
  ) : recommendationQuantity === 0 ? (
    <button type="button" onClick={() => setDetailProductId(recommendationProduct.id)}>＋ 选规格</button>
  ) : (
    <div className="xiaoling-recommendation-note__stepper" aria-label={`${recommendationProduct.name}数量`}>
      <button type="button" onClick={() => changeRecommendationQuantity(-1)} aria-label={`减少${recommendationProduct.name}`}>−</button>
      <strong>{recommendationQuantity}</strong>
      <button type="button" onClick={() => changeRecommendationQuantity(1)} aria-label={`增加${recommendationProduct.name}`}>＋</button>
    </div>
  )

  return (
    <div className="consume-v2-preview c-app-root">
      <div className="consume-v2-device">
        <main className="consume-v2-page">
          <header className="consume-v2-topbar">
            <span><strong>灵山雅集</strong><small>景区消费导览</small></span>
            <button type="button" onClick={() => setOrdersOpen(true)}>我的订单</button>
          </header>

          <div className="consume-v2-context-slip">
            <span><small>当前位置</small><strong>{isFormal ? activeSpot?.name ?? '灵山胜境' : '梵宫'}</strong></span>
            <i />
            <span><small>今日路线</small><strong>{isFormal ? activeRoute.name : '经典一日游'}</strong></span>
          </div>

          <div className="consume-v2-scenery-space" aria-hidden="true" />

          <section className="consume-v2-market" aria-labelledby="consume-v2-market-title">
            <MarketTitle
              title="景区消费"
              eyebrow="灵山四集"
              aside="按需选择"
              id="consume-v2-market-title"
              animationDelay={100}
            />

            <MarketCategoryTabs
              className="consume-v2-categories"
              items={CATEGORIES}
              value={category}
              onChange={(nextCategory) => {
                setCategory(nextCategory as PurchaseCategory)
              }}
            />

            <XiaolingRecommendationNote
              key={`consume-recommendation-${category}`}
              className="consume-v2-recommendation"
              recommendation={recommendation}
              reasonStatus={reasonStatus}
              action={recommendationAction}
              assistantVisual={<XiaolingAvatar size="small" />}
              quantityMotionSequence={recommendationMotion}
              onAssistantActivate={() => showPrototypeToast('小灵正在为你准备更贴合行程的建议')}
              onReasonActivate={() => setReasonOpen((open) => !open)}
            />

            {reasonOpen ? (
              <aside className="consume-v2-reason-detail">
                <span><small>小灵解释</small><strong>为什么推荐它？</strong></span>
                <p>{RECOMMENDATION_REASONS[category]}。小灵会结合你的当前位置、今日路线与游览节奏继续调整建议。</p>
                <button type="button" onClick={replayRecommendation}>请小灵换一条</button>
              </aside>
            ) : null}

            <MarketTitle
              key={`consume-catalog-title-${category}`}
              className="consume-v2-catalog-heading"
              title={CATEGORY_LABELS[category]}
              eyebrow="雅集目录"
              aside={orderableProductCount > 0 ? `${orderableProductCount} 项可下单` : `${products.length} 项可查看`}
              id="consume-v2-catalog-title"
              level={3}
              animationDelay={40}
            />

            <MarketProductLedger
              className="consume-v2-ledger"
              items={ledgerItems}
              quantities={cart}
              onQuantityChange={setQuantity}
              onAddRequest={setDetailProductId}
              onItemActivate={setDetailProductId}
              ariaLabel={`${CATEGORY_LABELS[category]}商品目录`}
            />
          </section>
        </main>

        <MarketCartDock
          className="consume-v2-cart-dock"
          count={cartCount}
          totalLabel={formatMoney(cartTotal)}
          onOpen={() => setCartSheetOpen(true)}
        />

        <CAppBottomNav activeKey="consume" />

        <MarketCartSheet
          open={cartSheetOpen}
          items={cartSheetItems}
          totalLabel={formatMoney(cartTotal)}
          onClose={() => setCartSheetOpen(false)}
          onQuantityChange={setQuantity}
          onConfirm={() => {
            setCartSheetOpen(false)
            if (cartCount > 0) setCheckoutOpen(true)
          }}
        />

        {detailProduct ? (
          <ConsumeV2ProductDetailSheet
            product={detailProduct}
            categoryLabel={CATEGORY_LABELS[detailProduct.category]}
            image={CATEGORY_ICONS[detailProduct.category]}
            locationLabel={detailProduct.locationLabel}
            onClose={() => setDetailProductId('')}
            onAdd={(quantity, selections) => {
              setQuantity(detailProduct.id, (cart[detailProduct.id] ?? 0) + quantity)
              setCartSpecifications((current) => ({ ...current, [detailProduct.id]: selections }))
              setDetailProductId('')
              showPrototypeToast(`已纳入 ${quantity} 件 · ${selections.join(' · ')}`)
            }}
          />
        ) : null}

        {checkoutOpen ? (
          <ConsumeV2CheckoutSheet
            lines={checkoutLines}
            total={cartTotal}
            onClose={() => setCheckoutOpen(false)}
            onPaid={completePreviewOrder}
            onRequestPayment={isFormal ? requestFormalPayment : undefined}
          />
        ) : null}

        {ordersOpen ? (
          <ConsumeV2OrdersSheet
            orders={displayOrders}
            visitDate={isFormal && ticket ? ticket.visitDate : '2026-07-15'}
            groupSize={isFormal && ticket ? ticket.groupSize : 2}
            onAskXiaoling={() => {
              setOrdersOpen(false)
              showPrototypeToast('小灵已读取本次订单，可继续为你解答')
            }}
            onClose={() => setOrdersOpen(false)}
          />
        ) : null}

        {successOrder ? (
          <ConsumeV2OrderSuccessDialog
            order={successOrder}
            onContinue={() => setSuccessOrder(null)}
            onViewOrder={() => {
              setSuccessOrder(null)
              setOrdersOpen(true)
            }}
          />
        ) : null}

        {toast ? <div className="consume-v2-toast" role="status">{toast}</div> : null}
        {isFormal && showPayment ? (
          <PaymentSheet
            amount={pendingPaymentAmount}
            onClose={() => setShowPayment(false)}
            onPaid={completeFormalOrder}
          />
        ) : null}
      </div>
    </div>
  )
}

export default MobileConsumePageV2
