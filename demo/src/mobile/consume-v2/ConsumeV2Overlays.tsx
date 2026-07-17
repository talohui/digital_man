import { useEffect, useState, type ReactNode } from 'react'
import MarketBoguWindow from '../../components/mobile/consume/MarketBoguWindow'
import MarketMoonWindow from '../../components/mobile/consume/MarketMoonWindow'
import type { Product } from '../../data/shopData'
import type { PurchaseCategory } from '../../store/useTicketStore'
import '../../styles/c-app/mobileConsumeV2Overlays.css'

type ConsumeV2OrderLine = {
  id: string
  name: string
  category: PurchaseCategory
  categoryLabel: string
  specificationLabel: string
  quantity: number
  subtotalLabel: string
  subtotalValue: number
}

type ConsumeV2Order = {
  id: string
  createdAtLabel: string
  totalLabel: string
  statusLabel: string
  lines: ConsumeV2OrderLine[]
}

function formatMoney(value: number) {
  return `¥${Math.round(value)}`
}

function SheetLayer({
  title,
  eyebrow,
  onClose,
  children,
  className = ''
}: {
  title: string
  eyebrow: string
  onClose: () => void
  children: ReactNode
  className?: string
}) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return (
    <div className="consume-v2-overlay-layer" role="presentation" onClick={onClose}>
      <section
        className={`consume-v2-overlay ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="consume-v2-overlay__header">
          <span><small>{eyebrow}</small><strong>{title}</strong></span>
          <button type="button" onClick={onClose}>合卷</button>
        </header>
        {children}
      </section>
    </div>
  )
}

function ConsumeV2ProductDetailSheet({
  product,
  categoryLabel,
  image,
  locationLabel,
  onClose,
  onAdd
}: {
  product: Product
  categoryLabel: string
  image: string
  locationLabel: string
  onClose: () => void
  onAdd: (quantity: number, selections: string[]) => void
}) {
  const groups = product.detailOptions
  const [selected, setSelected] = useState(() => groups.map(() => 0))
  const [quantity, setQuantity] = useState(1)
  const ImageFrame = product.category === 'food' || product.category === 'transport'
    ? MarketMoonWindow
    : MarketBoguWindow

  return (
    <SheetLayer title={product.name} eyebrow={`${categoryLabel} · ${product.orderable ? '商品详情' : '现场信息'}`} onClose={onClose} className="consume-v2-detail-sheet">
      <div className="consume-v2-detail-sheet__intro">
        <ImageFrame src={image} />
        <span>
          <small>{locationLabel}</small>
          <p>{product.description}</p>
          <strong>{product.priceLabel}</strong>
        </span>
      </div>

      {groups.length > 0 ? (
        <div className="consume-v2-detail-sheet__options">
          {groups.map((group, groupIndex) => (
          <fieldset key={group.label}>
            <legend>{group.label}</legend>
            <div>
              {group.values.map((value, valueIndex) => (
                <button
                  key={value}
                  type="button"
                  className={product.orderable && selected[groupIndex] === valueIndex ? 'is-active' : ''}
                  disabled={!product.orderable}
                  onClick={() => {
                    if (product.orderable) {
                      setSelected((current) => current.map((item, index) => index === groupIndex ? valueIndex : item))
                    }
                  }}
                >
                  {value}
                </button>
              ))}
            </div>
          </fieldset>
          ))}
        </div>
      ) : null}

      <div className="consume-v2-detail-sheet__notice">
        <span>服务说明</span>
        <p>{product.notice}</p>
      </div>

      <footer className="consume-v2-detail-sheet__footer">
        {product.orderable && product.price !== null ? (
          <>
            <div className="consume-v2-detail-sheet__stepper" aria-label="商品数量">
              <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button>
              <strong>{quantity}</strong>
              <button type="button" onClick={() => setQuantity((value) => value + 1)}>＋</button>
            </div>
            <button
              type="button"
              onClick={() => onAdd(quantity, groups.map((group, index) => `${group.label}：${group.values[selected[index]]}`))}
            >
              纳入货筹 · {formatMoney(product.price * quantity)}
            </button>
          </>
        ) : (
          <button type="button" onClick={onClose}>已阅，合卷</button>
        )}
      </footer>
    </SheetLayer>
  )
}

function ConsumeV2CheckoutSheet({
  lines,
  total,
  onClose,
  onPaid,
  onRequestPayment
}: {
  lines: ConsumeV2OrderLine[]
  total: number
  onClose: () => void
  onPaid: (method: string, paidTotal: number) => void
  onRequestPayment?: (payment: { amount: number; discount: number }) => void
}) {
  const [method, setMethod] = useState('微信支付')
  const couponEligible = total >= 88
  const [coupon, setCoupon] = useState(couponEligible)
  const [stage, setStage] = useState<'confirm' | 'paying' | 'success'>('confirm')
  const payable = Math.max(0, total - (coupon && couponEligible ? 10 : 0))

  const confirm = () => {
    if (onRequestPayment) {
      onRequestPayment({ amount: payable, discount: coupon && couponEligible ? 10 : 0 })
      return
    }
    setStage('paying')
    window.setTimeout(() => {
      setStage('success')
      window.setTimeout(() => onPaid(method, payable), 900)
    }, 900)
  }

  return (
    <SheetLayer title="确认所选" eyebrow="灵山雅集 · 订单确认" onClose={stage === 'paying' ? () => undefined : onClose} className="consume-v2-checkout-sheet">
      {stage === 'confirm' ? (
        <>
          <div className="consume-v2-checkout-sheet__summary">
            <span><small>共 {lines.reduce((sum, line) => sum + line.quantity, 0)} 件</small><strong>{formatMoney(total)}</strong></span>
            <div className="consume-v2-checkout-sheet__lines">
              {lines.map((line) => (
                <p key={line.id}>
                  <span><strong>{line.name}×{line.quantity}</strong><small>{line.specificationLabel}</small></span>
                  <b>{line.subtotalLabel}</b>
                </p>
              ))}
            </div>
          </div>

          <dl className="consume-v2-checkout-sheet__ledger">
            <div><dt>游客信息</dt><dd>游客 01 · 138****2026</dd></div>
            <div><dt>使用日期</dt><dd>今日 · 当次游览</dd></div>
            <div><dt>领取提示</dt><dd>下单后按商品说明前往指定地点</dd></div>
          </dl>

          <button
            className={`consume-v2-checkout-sheet__coupon ${coupon ? 'is-active' : ''}`}
            type="button"
            disabled={!couponEligible}
            onClick={() => setCoupon((value) => !value)}
          >
            <span><small>雅集礼签</small><strong>满 88 减 10</strong></span>
            <em>{!couponEligible ? '未达门槛' : coupon ? '已使用' : '使用'}</em>
          </button>

          <div className="consume-v2-checkout-sheet__methods" role="group" aria-label="支付方式">
            {['微信支付', '支付宝'].map((item) => (
              <button key={item} type="button" className={method === item ? 'is-active' : ''} onClick={() => setMethod(item)}>
                <i aria-hidden="true">{item.slice(0, 1)}</i>{item}<span />
              </button>
            ))}
          </div>

          <footer className="consume-v2-checkout-sheet__footer">
            <span><small>应付</small><strong>{formatMoney(payable)}</strong></span>
            <button type="button" onClick={confirm}>确认支付</button>
          </footer>
        </>
      ) : (
        <div className={`consume-v2-checkout-sheet__status is-${stage}`}>
          <i aria-hidden="true">{stage === 'success' ? '✓' : '筹'}</i>
          <strong>{stage === 'success' ? '支付完成' : '正在核对货筹…'}</strong>
          <p>{stage === 'success' ? `${formatMoney(payable)} · ${method}` : '请稍候，卷册正在合订'}</p>
        </div>
      )}
    </SheetLayer>
  )
}

function ConsumeV2OrdersSheet({
  orders,
  visitDate,
  groupSize,
  onClose
}: {
  orders: ConsumeV2Order[]
  visitDate: string
  groupSize: number
  onClose: () => void
}) {
  const totalSpend = orders.reduce((sum, order) => sum + order.lines.reduce((lineSum, line) => lineSum + line.subtotalValue, 0), 0)
  const spendByCategory = (['food', 'shopping', 'transport', 'entertainment'] as const).map((category) => ({
    category,
    label: { food: '餐饮', shopping: '文创', transport: '交通', entertainment: '演艺' }[category],
    value: orders.reduce((sum, order) => sum + order.lines.filter((line) => line.category === category).reduce((lineSum, line) => lineSum + line.subtotalValue, 0), 0)
  }))

  return (
    <SheetLayer title="我的雅集单" eyebrow="当次游览 · 订单记录" onClose={onClose} className="consume-v2-orders-sheet">
      <section className="consume-v2-orders-sheet__ticket">
        <img src="/icons/tab-home.png" alt="" />
        <span><small>本次票务</small><strong>{visitDate} · {groupSize} 人入园</strong><p>本次票务与消费记录将汇总在这里。</p></span>
      </section>

      <section className="consume-v2-orders-sheet__stats" aria-label="本次游览消费统计">
        <span><small>累计消费</small><strong>{formatMoney(totalSpend)}</strong></span>
        <span><small>订单数</small><strong>{orders.length}</strong></span>
        <span><small>门票</small><strong>{visitDate}</strong></span>
      </section>

      <div className="consume-v2-orders-sheet__list">
        {orders.length > 0 ? orders.map((order) => (
          <article key={order.id}>
            <header><span><small>{order.createdAtLabel}</small><strong>{order.id}</strong></span><em>{order.statusLabel}</em></header>
            <div className="consume-v2-orders-sheet__lines">
              {order.lines.map((line) => (
                <p key={line.id}><span><strong>{line.name}×{line.quantity}</strong><small>{line.specificationLabel}</small></span><b>{line.subtotalLabel}</b></p>
              ))}
            </div>
            <footer><small>共 {order.lines.reduce((sum, line) => sum + line.quantity, 0)} 件</small><strong>{order.totalLabel}</strong></footer>
          </article>
        )) : (
          <div className="consume-v2-orders-sheet__empty"><i>单</i><strong>尚无雅集单</strong><p>完成结算后，雅集单会收在这里。</p></div>
        )}
      </div>

      <section className="consume-v2-orders-sheet__breakdown">
        <header><span><small>消费结构</small><strong>本次游览消费</strong></span></header>
        <div>{spendByCategory.map((item) => <span key={item.category}><small>{item.label}</small><strong>{formatMoney(item.value)}</strong></span>)}</div>
      </section>
    </SheetLayer>
  )
}

function ConsumeV2OrderSuccessDialog({
  order,
  onContinue,
  onViewOrder
}: {
  order: ConsumeV2Order
  onContinue: () => void
  onViewOrder: () => void
}) {
  return (
    <div className="consume-v2-success-layer" role="presentation">
      <section className="consume-v2-success-dialog" role="alertdialog" aria-modal="true" aria-label="雅集单已确认">
        <i aria-hidden="true">✓</i>
        <small>支付已完成</small>
        <strong>雅集单已确认</strong>
        <p>{order.id} · {order.totalLabel}<br />{order.lines.map((line) => `${line.name}×${line.quantity}`).join('、')}</p>
        <div><button type="button" onClick={onContinue}>继续逛雅集</button><button type="button" onClick={onViewOrder}>查看订单</button></div>
      </section>
    </div>
  )
}

export {
  ConsumeV2CheckoutSheet,
  ConsumeV2OrderSuccessDialog,
  ConsumeV2OrdersSheet,
  ConsumeV2ProductDetailSheet
}
export type { ConsumeV2Order, ConsumeV2OrderLine }
