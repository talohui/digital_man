import { useEffect, useRef, type CSSProperties, type MouseEvent } from 'react'
import '../../../styles/c-app/marketCartSheet.css'

type MarketCartSheetItem = {
  id: string
  name: string
  categoryLabel: string
  unitPriceLabel: string
  subtotalLabel: string
  quantity: number
}

type MarketCartSheetProps = {
  open: boolean
  items: readonly MarketCartSheetItem[]
  totalLabel: string
  onClose: () => void
  onQuantityChange: (itemId: string, nextQuantity: number) => void
  onConfirm: () => void
  confirmLabel?: string
  className?: string
}

function MarketCartSheet({
  open,
  items,
  totalLabel,
  onClose,
  onQuantityChange,
  onConfirm,
  confirmLabel = '确认所选',
  className = ''
}: MarketCartSheetProps) {
  const dialogRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => dialogRef.current?.focus())
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current()
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
      previousFocus?.focus()
    }
  }, [open])

  if (!open) return null

  const stopPropagation = (event: MouseEvent<HTMLElement>) => event.stopPropagation()

  return (
    <div className="market-cart-sheet-layer" role="presentation" onClick={onClose}>
      <section
        ref={dialogRef}
        className={`market-cart-sheet ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="market-cart-sheet-title"
        tabIndex={-1}
        onClick={stopPropagation}
      >
        <div className="market-cart-sheet__surface">
          <div className="market-cart-sheet__spine" aria-hidden="true" />

          <header className="market-cart-sheet__header">
            <div>
              <small>经折成册 · 彩筹出匣</small>
              <h2 id="market-cart-sheet-title">经折货筹册</h2>
              <p>账页清晰核对，每件所选如货筹般依次入册。</p>
            </div>
            <button type="button" onClick={onClose} aria-label="关闭核筹面板">合卷</button>
          </header>

          <div className="market-cart-sheet__list" aria-label="已选商品">
            {items.length > 0 ? items.map((item, index) => (
              <article
                className="market-cart-sheet__item"
                key={`${item.id}-${item.quantity}`}
                style={{ '--cart-sheet-row-index': index } as CSSProperties}
              >
                <span className="market-cart-sheet__number" aria-hidden="true">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="market-cart-sheet__copy">
                  <strong>{item.name}</strong>
                  <small>{item.categoryLabel} · {item.unitPriceLabel} × {item.quantity}</small>
                </span>
                <span className="market-cart-sheet__price">{item.subtotalLabel}</span>
                <span className="market-cart-sheet__stepper" aria-label={`${item.name}数量`}>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.id, Math.max(0, item.quantity - 1))}
                    aria-label={`减少${item.name}`}
                  >−</button>
                  <b>{item.quantity}</b>
                  <button
                    type="button"
                    onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                    aria-label={`增加${item.name}`}
                  >＋</button>
                </span>
              </article>
            )) : (
              <div className="market-cart-sheet__empty">
                <i aria-hidden="true">筹</i>
                <strong>筹册尚空</strong>
                <p>先从上方小灵推荐或雅集货目册中添入商品。</p>
              </div>
            )}
          </div>

          <div className="market-cart-sheet__tally-rail" aria-hidden="true">
            <i /><i /><i /><i /><i /><i /><i /><i />
          </div>

          <footer className="market-cart-sheet__footer">
            <span><small>本次合计</small><strong>{totalLabel}</strong></span>
            <button type="button" disabled={items.length === 0} onClick={onConfirm}>
              {confirmLabel}<i aria-hidden="true">›</i>
            </button>
          </footer>
        </div>
      </section>
    </div>
  )
}

export default MarketCartSheet
export type {
  MarketCartSheetItem,
  MarketCartSheetProps
}
