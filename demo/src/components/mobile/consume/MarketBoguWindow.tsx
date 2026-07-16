import '../../../styles/c-app/marketProductImageFrame.css'

type MarketBoguWindowProps = {
  src: string
  alt?: string
  className?: string
}

function MarketBoguWindow({ src, alt = '', className = '' }: MarketBoguWindowProps) {
  return (
    <div className={`market-product-image-frame market-product-image-frame--bogu ${className}`.trim()}>
      <img src={src} alt={alt} />
      <i aria-hidden="true" />
    </div>
  )
}

export default MarketBoguWindow
export type { MarketBoguWindowProps }
