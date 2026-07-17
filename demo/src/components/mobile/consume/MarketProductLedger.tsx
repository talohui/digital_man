import { useEffect, useRef, useState, type CSSProperties } from 'react'
import MarketBoguWindow from './MarketBoguWindow'
import MarketMoonWindow from './MarketMoonWindow'

type MarketProductLedgerItem = {
  id: string
  name: string
  description: string
  priceLabel: string
  image: string
  locationLabel?: string
  availabilityLabel?: string
  imageFrame?: MarketProductLedgerImageFrame
    /** false 时仅展示服务详情，不显示可加入购物车的交互。 */
  orderable?: boolean
}

type MarketProductLedgerProps = {
  items: readonly MarketProductLedgerItem[]
  quantities: Record<string, number>
  onQuantityChange: (itemId: string, nextQuantity: number) => void
  onAddRequest?: (itemId: string) => void
  onItemActivate?: (itemId: string) => void
  highlightedItemId?: string
  ariaLabel?: string
  className?: string
}

type MarketProductLedgerImageFrame = 'moon' | 'bogu'

const CHINESE_INDEX = ['壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']

function MarketProductLedger({
  items,
  quantities,
  onQuantityChange,
  onAddRequest,
  onItemActivate,
  highlightedItemId,
  ariaLabel = '雅集商品货目',
  className = ''
}: MarketProductLedgerProps) {
  const [motion, setMotion] = useState({ itemId: '', sequence: 0 })
  const previousQuantitiesRef = useRef(quantities)
  const handledQuantityChangeRef = useRef('')

  const commitQuantity = (itemId: string, nextQuantity: number) => {
    handledQuantityChangeRef.current = itemId
    setMotion((current) => ({ itemId, sequence: current.sequence + 1 }))
    onQuantityChange(itemId, nextQuantity)
  }

  const requestAdd = (itemId: string, quantity: number) => {
    if (!onAddRequest) {
      commitQuantity(itemId, quantity + 1)
      return
    }

    // 先保留玉珠按下与账页轻晃，再展开规格折页，避免“＋”像普通跳转一样失去反馈。
    setMotion((current) => ({ itemId, sequence: current.sequence + 1 }))
    window.setTimeout(() => onAddRequest(itemId), 150)
  }

  // 规格折页确认后由父级写入数量；这里补回原有玉珠加入后的账页轻晃反馈。
  useEffect(() => {
    const addedItem = items.find((item) =>
      (previousQuantitiesRef.current[item.id] ?? 0) === 0 && (quantities[item.id] ?? 0) > 0
    )

    if (addedItem && handledQuantityChangeRef.current !== addedItem.id) {
      setMotion((current) => ({ itemId: addedItem.id, sequence: current.sequence + 1 }))
    }

    previousQuantitiesRef.current = quantities
    handledQuantityChangeRef.current = ''
  }, [items, quantities])

  return (
    <section className={`market-product-ledger market-product-ledger--account ${className}`.trim()} aria-label={ariaLabel}>
      <span className="market-product-ledger__binding is-top" aria-hidden="true" />
      <span className="market-product-ledger__binding is-bottom" aria-hidden="true" />

      <div className="market-product-ledger__list" role="list">
        {items.map((item, index) => {
          const quantity = quantities[item.id] ?? 0
          const orderable = item.orderable !== false
          const motionClass = motion.itemId === item.id
            ? `is-motion-${motion.sequence % 2 === 0 ? 'even' : 'odd'}`
            : ''

          return (
            <article
              id={`consume-product-${item.id}`}
              className={`market-product-ledger__entry ${orderable && quantity > 0 ? 'is-selected' : ''} ${item.id === highlightedItemId ? 'is-xiaoling-highlighted' : ''} ${motionClass}`.trim()}
              key={item.id}
              role="listitem"
              style={{ '--market-product-order': index } as CSSProperties}
            >
              <span className="market-product-ledger__index" aria-hidden="true">
                <small>货目</small>{CHINESE_INDEX[index] ?? index + 1}
              </span>

              {item.imageFrame === 'bogu' ? (
                <MarketBoguWindow src={item.image} />
              ) : (
                <MarketMoonWindow src={item.image} />
              )}

              {onItemActivate ? (
                <button
                  className="market-product-ledger__copy market-product-ledger__detail-trigger"
                  type="button"
                  onClick={() => onItemActivate(item.id)}
                  aria-label={`查看${item.name}详情`}
                >
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <small>{[item.availabilityLabel, item.locationLabel].filter(Boolean).join(' · ')}<i aria-hidden="true">详情 ›</i></small>
                </button>
              ) : (
                <div className="market-product-ledger__copy">
                  <strong>{item.name}</strong>
                  <p>{item.description}</p>
                  <small>{[item.availabilityLabel, item.locationLabel].filter(Boolean).join(' · ')}</small>
                </div>
              )}

              <div className="market-product-ledger__trade">
                <b>{item.priceLabel}</b>
                {!orderable ? (
                  <button
                    className="market-product-ledger__add"
                    type="button"
                    onClick={() => onItemActivate?.(item.id)}
                    aria-label={`查看${item.name}信息`}
                  >
                    <span>阅</span><small>查看</small>
                  </button>
                ) : quantity === 0 ? (
                  <button
                    className="market-product-ledger__add"
                    type="button"
                    onClick={() => requestAdd(item.id, quantity)}
                    aria-label={`加入${item.name}`}
                  >
                    <span>＋</span><small>添入</small>
                  </button>
                ) : (
                  <div className="market-product-ledger__stepper" aria-label={`${item.name}数量`}>
                    <button type="button" onClick={() => commitQuantity(item.id, quantity - 1)} aria-label={`减少${item.name}`}>−</button>
                    <strong>{quantity}</strong>
                    <button
                      type="button"
                      onClick={() => requestAdd(item.id, quantity)}
                      aria-label={`继续添加${item.name}`}
                    >
                      ＋
                    </button>
                  </div>
                )}
                {orderable && quantity > 0 ? <em aria-hidden="true">已选</em> : null}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

export default MarketProductLedger
export type { MarketProductLedgerImageFrame, MarketProductLedgerItem, MarketProductLedgerProps }
