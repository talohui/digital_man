import { CarOutlined, CoffeeOutlined, GiftOutlined, PlayCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getGuideRouteById, getGuideSpotById } from '../data/guideData'
import { capturePurchase } from '../lib/analytics'
import { useGuideStore } from '../store/useGuideStore'
import {
  purchaseCategoryLabels,
  useTicketStore,
  type PurchaseCategory,
} from '../store/useTicketStore'

const categoryMeta: Array<{
  id: PurchaseCategory
  icon: ReactNode
  title: string
  description: string
  amounts: number[]
}> = [
  { id: 'food', icon: <CoffeeOutlined />, title: '餐饮', description: '素食、茶饮、简餐', amounts: [28, 48, 68] },
  { id: 'shopping', icon: <GiftOutlined />, title: '文创', description: '纪念品、香囊、明信片', amounts: [58, 128, 198] },
  { id: 'transport', icon: <CarOutlined />, title: '交通', description: '观光车、接驳、停车', amounts: [20, 40, 60] },
  { id: 'entertainment', icon: <PlayCircleOutlined />, title: '演艺', description: '表演、体验、讲解', amounts: [80, 128, 168] },
]

function formatMoney(value: number) {
  return `¥${Math.round(value)}`
}

function MobileConsumePage() {
  const navigate = useNavigate()
  const ticket = useTicketStore((state) => state.ticketProfile)
  const purchases = useTicketStore((state) => state.purchases)
  const addPurchase = useTicketStore((state) => state.addPurchase)
  const totalSpend = useTicketStore((state) => state.totalSpend())
  const spendByCategory = useTicketStore((state) => state.spendByCategory())
  const activeRouteId = useGuideStore((state) => state.activeRouteId)
  const selectedSpotId = useGuideStore((state) => state.selectedSpotId)
  const [category, setCategory] = useState<PurchaseCategory>('food')
  const [amount, setAmount] = useState(48)
  const [customAmount, setCustomAmount] = useState('')
  const [submittedAt, setSubmittedAt] = useState(0)
  const activeRoute = getGuideRouteById(activeRouteId)
  const activeSpot = selectedSpotId ? getGuideSpotById(selectedSpotId) : null

  const selectedMeta = useMemo(
    () => categoryMeta.find((item) => item.id === category) ?? categoryMeta[0],
    [category]
  )
  const finalAmount = Number(customAmount) > 0 ? Number(customAmount) : amount
  const isCoolingDown = Date.now() - submittedAt < 900

  const handleSubmit = () => {
    if (!ticket || finalAmount <= 0 || isCoolingDown) return
    const record = addPurchase({
      category,
      amount: finalAmount,
      routeId: activeRouteId,
      spotId: selectedSpotId ?? undefined,
      ticketId: ticket.ticketId,
    })
    capturePurchase(record)
    setSubmittedAt(Date.now())
  }

  if (!ticket) {
    return (
      <div className="mobile-consume-page">
        <section className="mobile-ticket-hero">
          <div>
            <span className="mobile-section-kicker">消费闭环</span>
            <h2>先购票再模拟消费</h2>
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

  return (
    <div className="mobile-consume-page">
      <section className="mobile-ticket-hero">
        <div>
          <span className="mobile-section-kicker">CONSUMPTION</span>
          <h2>景区消费</h2>
          <p>{activeSpot ? `当前位置：${activeSpot.name}` : `当前路线：${activeRoute.name}`}</p>
        </div>
        <ShoppingCartOutlined />
      </section>

      <section className="mobile-consume-summary">
        <div>
          <span>累计消费</span>
          <strong>{formatMoney(totalSpend)}</strong>
        </div>
        <div>
          <span>消费笔数</span>
          <strong>{purchases.length}</strong>
        </div>
        <div>
          <span>门票</span>
          <strong>{ticket.visitDate}</strong>
        </div>
      </section>

      <section className="mobile-consume-grid">
        {categoryMeta.map((item) => (
          <button
            key={item.id}
            type="button"
            className={category === item.id ? 'is-active' : ''}
            onClick={() => {
              setCategory(item.id)
              setAmount(item.amounts[1])
              setCustomAmount('')
            }}
          >
            {item.icon}
            <strong>{item.title}</strong>
            <span>{item.description}</span>
          </button>
        ))}
      </section>

      <section className="mobile-panel mobile-consume-pay">
        <div className="mobile-panel__head">
          <div>
            <span className="mobile-section-kicker">模拟支付</span>
            <h3>{selectedMeta.title}消费</h3>
          </div>
          {selectedMeta.icon}
        </div>
        <div className="mobile-amount-list">
          {selectedMeta.amounts.map((item) => (
            <button
              key={item}
              type="button"
              className={!customAmount && amount === item ? 'is-active' : ''}
              onClick={() => {
                setAmount(item)
                setCustomAmount('')
              }}
            >
              {formatMoney(item)}
            </button>
          ))}
        </div>
        <label className="mobile-field">
          <span>自定义金额</span>
          <input
            className="mobile-money-input"
            inputMode="decimal"
            min="0"
            placeholder="输入金额"
            type="number"
            value={customAmount}
            onChange={(event) => setCustomAmount(event.target.value)}
          />
        </label>
        <button
          className="mobile-primary-action"
          type="button"
          disabled={finalAmount <= 0 || isCoolingDown}
          onClick={handleSubmit}
        >
          {isCoolingDown ? '已记录' : `确认支付 ${formatMoney(finalAmount)}`}
        </button>
      </section>

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
        <div className="mobile-purchase-list">
          {purchases.length ? purchases.slice(0, 5).map((item) => (
            <div key={item.id}>
              <span>{purchaseCategoryLabels[item.category]}</span>
              <strong>{formatMoney(item.amount)}</strong>
            </div>
          )) : <p className="mobile-muted">还没有消费记录。</p>}
        </div>
      </section>
    </div>
  )
}

export default MobileConsumePage
