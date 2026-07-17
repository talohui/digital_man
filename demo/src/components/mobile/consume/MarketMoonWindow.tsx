import '../../../styles/c-app/marketProductImageFrame.css'

type MarketMoonWindowProps = {
  src: string
  alt?: string
  className?: string
}

function MarketMoonWindow({ src, alt = '', className = '' }: MarketMoonWindowProps) {
  return (
    <div className={`market-product-image-frame market-product-image-frame--moon ${className}`.trim()}>
      <img src={src} alt={alt} />
      <i aria-hidden="true" />
    </div>
  )
}

export default MarketMoonWindow
export type { MarketMoonWindowProps }
