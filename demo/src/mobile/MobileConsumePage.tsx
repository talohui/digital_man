import {
  CheckCircleFilled,
  CreditCardOutlined,
  EnvironmentOutlined,
  MinusOutlined,
  PlusOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { lingshanProducts, type Product } from '../data/shopData'
import { capturePurchase } from '../lib/analytics'
import { useGuideStore } from '../store/useGuideStore'
import {
  purchaseCategoryLabels,
  useTicketStore,
  type OrderItem,
  type PurchaseCategory,
} from '../store/useTicketStore'
import PaymentSheet from './PaymentSheet'

const catIcon = (name: string) => (
  <img src={`/icons/${name}.png`} className="mobile-consume-cat-icon" alt="" />
)

const categoryMeta: Array<{ id: PurchaseCategory; icon: ReactNode; title: string }> = [
  { id: 'food', icon: catIcon('cat-food'), title: '餐饮' },
  { id: 'shopping', icon: catIcon('cat-culture'), title: '文创' },
  { id: 'transport', icon: catIcon('cat-transport'), title: '交通' },
  { id: 'entertainment', icon: catIcon('cat-show'), title: '演艺' },
]

function formatMoney(value: number) {
  return `¥${Math.round(value)}`
}

function formatOrderTime(iso: string) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => `${n}`.padStart(2, '0')
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function MobileConsumePage() {
  const navigate = useNavigate()
  const ticket = useTicketStore((state) => state.ticketProfile)
  const purchases = useTicketStore((state) => state.purchases)
  const orders = useTicketStore((state) => state.orders)
  const placeOrder = useTicketStore((state) => state.placeOrder)
  // selector 不能返回新对象（zustand v5 / useSyncExternalStore 会无限循环白屏），
  // 改为只订阅 purchases，再用 useMemo 派生汇总。
  const totalSpend = useMemo(
    () => purchases.reduce((sum, item) => sum + item.amount, 0),
    [purchases]
  )
  const spendByCategory = useMemo(
    () =>
      purchases.reduce<Record<PurchaseCategory, number>>(
        (acc, item) => {
          acc[item.category] += item.amount
          return acc
        },
        { food: 0, shopping: 0, transport: 0, entertainment: 0 }
      ),
    [purchases]
  )
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const [category, setCategory] = useState<PurchaseCategory>('food')
  // 购物车为临时态：{ productId: 数量 }，结算后清空。
  const [cart, setCart] = useState<Record<string, number>>({})
  const [lastOrderId, setLastOrderId] = useState('')
  const [showPay, setShowPay] = useState(false)
  const activeRoute = getGuideRouteById(activeRouteId)
  const activeSpot = selectedSpotId ? getGuideSpotById(selectedSpotId) : null

  const nearbyProducts = useMemo(
    () => (selectedSpotId ? lingshanProducts.filter((item) => item.spotIds.includes(selectedSpotId)) : []),
    [selectedSpotId]
  )
  const categoryProducts = useMemo(
    () => lingshanProducts.filter((item) => item.category === category),
    [category]
  )

  const cartLines = useMemo(
    () =>
      Object.entries(cart)
        .map(([id, qty]) => {
          const product = lingshanProducts.find((item) => item.id === id)
          return product ? { product, qty } : null
        })
        .filter((line): line is { product: Product; qty: number } => Boolean(line) && line!.qty > 0),
    [cart]
  )
  const cartTotal = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.product.price * line.qty, 0),
    [cartLines]
  )
  const cartCount = useMemo(
    () => cartLines.reduce((sum, line) => sum + line.qty, 0),
    [cartLines]
  )

  const addToCart = (product: Product) => {
    setLastOrderId('')
    setCart((current) => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 }))
  }
  const decFromCart = (productId: string) => {
    setCart((current) => {
      const next = { ...current }
      const qty = (next[productId] ?? 0) - 1
      if (qty <= 0) delete next[productId]
      else next[productId] = qty
      return next
    })
  }

  const handleCheckout = () => {
    if (!ticket || cartLines.length === 0) return
    setShowPay(true)
  }

  // 支付成功后才真正下单记账
  const handlePaid = () => {
    if (!ticket) return
    const items: OrderItem[] = cartLines.map((line) => ({
      productId: line.product.id,
      name: line.product.name,
      category: line.product.category,
      price: line.product.price,
      qty: line.qty,
    }))
    const { order, records } = placeOrder(items, {
      spotId: selectedSpotId ?? undefined,
      routeId: activeRouteId,
      ticketId: ticket.ticketId,
    })
    records.forEach((record) => capturePurchase(record))
    setCart({})
    setLastOrderId(order.id)
    setShowPay(false)
  }

  if (!ticket) {
    return (
      <div className="mobile-consume-page">
        <section className="mobile-ticket-hero">
          <div>
            <span className="mobile-section-kicker">景区商城</span>
            <h2>先购票再开始点单</h2>
            <p>购票后系统才能把消费行为和本次游览画像关联起来。</p>
          </div>
          <ShoppingCartOutlined />
        </section>
        <button className="mobile-primary-action" type="button" onClick={() => navigate('/ticket')}>
          去购票入园
        </button>
      </div>
    )
  }

  const renderProductCard = (product: Product, highlight = false) => {
    const qty = cart[product.id] ?? 0
    return (
      <div key={product.id} className={`mobile-shop-item ${highlight ? 'is-nearby' : ''}`}>
        <div className="mobile-shop-item__info">
          <strong>{product.name}</strong>
          <span>{product.description}</span>
          <b>{formatMoney(product.price)}</b>
        </div>
        {qty > 0 ? (
          <div className="mobile-shop-stepper">
            <button type="button" aria-label="减少" onClick={() => decFromCart(product.id)}>
              <MinusOutlined />
            </button>
            <strong>{qty}</strong>
            <button type="button" aria-label="增加" onClick={() => addToCart(product)}>
              <PlusOutlined />
            </button>
          </div>
        ) : (
          <button type="button" className="mobile-shop-add" onClick={() => addToCart(product)}>
            <PlusOutlined /> 加入
          </button>
        )}
      </div>
    )
  }

  const lastOrder = lastOrderId ? orders.find((item) => item.id === lastOrderId) : null

  return (
    <div className="mobile-consume-page">
      <section className="mobile-ticket-hero">
        <div>
          <span className="mobile-section-kicker">灵山景区商城</span>
          <h2>边逛边点单</h2>
          <p>{activeSpot ? `当前位置：${activeSpot.name}` : `当前路线：${activeRoute.name}`}</p>
        </div>
        <img className="mobile-illus mobile-illus--hero" src="/icons/icon-cart.png" alt="" />
      </section>

      <section className="mobile-ticket-entry">
        <img className="mobile-illus mobile-illus--entry" src="/icons/icon-ticket.png" alt="" />
        <div>
          <span className="mobile-section-kicker">本次票务</span>
          <h3>{ticket.visitDate} · {ticket.groupSize} 人入园</h3>
          <p>票务已锁定，消费会自动计入本次游览画像。</p>
        </div>
      </section>

      <section className="mobile-consume-summary">
        <div>
          <span>累计消费</span>
          <strong>{formatMoney(totalSpend)}</strong>
        </div>
        <div>
          <span>订单数</span>
          <strong>{orders.length}</strong>
        </div>
        <div>
          <span>门票</span>
          <strong>{ticket.visitDate}</strong>
        </div>
      </section>

      {lastOrder ? (
        <section className="mobile-shop-success">
          <CheckCircleFilled />
          <div>
            <strong>下单成功 · {formatMoney(lastOrder.total)}</strong>
            <span>订单号 {lastOrder.id.slice(-8).toUpperCase()} · 共 {lastOrder.items.reduce((s, i) => s + i.qty, 0)} 件，已记入本次游览消费</span>
          </div>
        </section>
      ) : null}

      {nearbyProducts.length > 0 ? (
        <section className="mobile-panel mobile-shop-nearby">
          <div className="mobile-panel__head">
            <div>
              <span className="mobile-section-kicker">附近可购</span>
              <h3>{activeSpot?.name} 周边</h3>
            </div>
            <EnvironmentOutlined />
          </div>
          <div className="mobile-shop-list">
            {nearbyProducts.map((product) => renderProductCard(product, true))}
          </div>
        </section>
      ) : null}

      <section className="mobile-consume-grid">
        {categoryMeta.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'is-active' : ''}
            onClick={() => setCategory(item.id)}
          >
            {item.icon}
            <strong>{item.title}</strong>
            <span>{lingshanProducts.filter((p) => p.category === item.id).length} 件</span>
          </button>
        ))}
      </section>

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">商品目录</span>
            <h3>{purchaseCategoryLabels[category]}</h3>
          </div>
          {categoryMeta.find((item) => item.id === category)?.icon}
        </div>
        <div className="mobile-shop-list">
          {categoryProducts.map((product) => renderProductCard(product, selectedSpotId ? product.spotIds.includes(selectedSpotId) : false))}
        </div>
      </section>

      {cartLines.length > 0 ? (
        <section className="mobile-panel mobile-shop-cart">
          <div className="mobile-panel__head">
            <div>
              <span className="mobile-section-kicker">购物车</span>
              <h3>{cartCount} 件商品</h3>
            </div>
            <ShoppingCartOutlined />
          </div>
          <div className="mobile-shop-cart__list">
            {cartLines.map((line) => (
              <div key={line.product.id} className="mobile-shop-cart__line">
                <div>
                  <strong>{line.product.name}</strong>
                  <span>{formatMoney(line.product.price)} × {line.qty}</span>
                </div>
                <div className="mobile-shop-stepper">
                  <button type="button" aria-label="减少" onClick={() => decFromCart(line.product.id)}>
                    <MinusOutlined />
                  </button>
                  <strong>{line.qty}</strong>
                  <button type="button" aria-label="增加" onClick={() => addToCart(line.product)}>
                    <PlusOutlined />
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="mobile-primary-action" type="button" onClick={handleCheckout}>
            结算 · 合计 {formatMoney(cartTotal)}
          </button>
          <p className="mobile-muted">演示版不接真实支付，下单即模拟完成，仅记录消费品类与金额。</p>
        </section>
      ) : null}

      {orders.length > 0 ? (
        <section className="mobile-panel">
          <div className="mobile-panel__head">
            <div>
              <span className="mobile-section-kicker">订单记录</span>
              <h3>本次游览订单</h3>
            </div>
            <ShoppingCartOutlined />
          </div>
          <div className="mobile-shop-orders">
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="mobile-shop-order">
                <div className="mobile-shop-order__head">
                  <span>订单 {order.id.slice(-8).toUpperCase()}</span>
                  <strong>{formatMoney(order.total)}</strong>
                </div>
                <p className="mobile-shop-order__items">
                  {order.items.map((item) => `${item.name}×${item.qty}`).join('、')}
                </p>
                <span className="mobile-shop-order__time">{formatOrderTime(order.createdAt)}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mobile-panel">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">消费结构</span>
            <h3>本次游览消费</h3>
          </div>
          <ShoppingCartOutlined />
        </div>
        <div className="mobile-consume-breakdown">
          {categoryMeta.map((item) => (
            <div key={item.id}>
              <span>{purchaseCategoryLabels[item.id]}</span>
              <strong>{formatMoney(spendByCategory[item.id])}</strong>
            </div>
          ))}
        </div>
      </section>

      {showPay && (
        <PaymentSheet amount={cartTotal} onClose={() => setShowPay(false)} onPaid={handlePaid} />
      )}
    </div>
  )
}

export default MobileConsumePage
