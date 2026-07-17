import '../../../styles/c-app/marketCartDock.css'

type MarketCartDockProps = {
  count: number
  totalLabel: string
  onOpen?: () => void
  className?: string
}

function MarketCartDock({
  count,
  totalLabel,
  onOpen,
  className = ''
}: MarketCartDockProps) {
  return (
    <button
      className={`market-cart-dock ${className}`.trim()}
      type="button"
      onClick={onOpen}
      aria-label={`本次所选，${count}件，合计${totalLabel}，核筹`}
    >
      <span className="market-cart-dock__ornament" aria-hidden="true">
        <i /><i /><i />
      </span>

      <span className="market-cart-dock__copy">
        <small>雅集货筹</small>
        <span className="market-cart-dock__title-row">
          <strong>本次所选</strong>
          <em><b>{count}</b> 件</em>
        </span>
      </span>

      <span className="market-cart-dock__total">
        <small>合计</small>
        <strong>{totalLabel}</strong>
      </span>

      <span className="market-cart-dock__action" aria-hidden="true">
        核筹<i>›</i>
      </span>
    </button>
  )
}

export default MarketCartDock
export type { MarketCartDockProps }
