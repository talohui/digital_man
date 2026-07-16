import { useEffect, useState, type CSSProperties } from 'react'
import '../../../styles/c-app/entrancePassScroll.css'

type EntrancePassScrollProps = {
  visitDateLabel: string
  partyCount: number
  totalLabel: string
  ticketSummary: string
  verificationCode: string
  barcodeWidths: number[]
  backgroundSrc?: string
  animated?: boolean
  className?: string
}

function EntrancePassScroll({
  visitDateLabel,
  partyCount,
  totalLabel,
  ticketSummary,
  verificationCode,
  barcodeWidths,
  backgroundSrc = '/images/ticket-v2/lingshan-entrance-pass-scroll.png',
  animated = true,
  className = ''
}: EntrancePassScrollProps) {
  const [isOpening, setIsOpening] = useState(!animated)

  useEffect(() => {
    if (!animated) return
    const frame = window.requestAnimationFrame(() => setIsOpening(true))
    return () => window.cancelAnimationFrame(frame)
  }, [animated])

  return (
    <div className={`entrance-pass-scroll ${isOpening ? 'is-opening' : ''} ${className}`.trim()}>
      <section
        className="entrance-pass-scroll__paper"
        style={{ '--entrance-pass-scroll-background': `url("${backgroundSrc}")` } as CSSProperties}
        aria-label="灵山入境票"
      >
        <div className="entrance-pass-scroll__details">
          <dl>
            <div><dt>入园日</dt><dd>{visitDateLabel}</dd></div>
            <div><dt>同行</dt><dd>{partyCount} 人</dd></div>
            <div><dt>票款</dt><dd>{totalLabel}</dd></div>
          </dl>
          <div className="entrance-pass-scroll__verify">
            <span>小灵行旅核验码</span>
            <strong>{verificationCode}</strong>
            <em>{ticketSummary}</em>
          </div>
        </div>
        <i className="entrance-pass-scroll__roller" aria-hidden="true" />
      </section>
      <div className="entrance-pass-scroll__barcode" aria-hidden="true">
        <span>{barcodeWidths.map((width, index) => <i key={index} style={{ flexGrow: width }} />)}</span>
      </div>
    </div>
  )
}

export default EntrancePassScroll
export type { EntrancePassScrollProps }
