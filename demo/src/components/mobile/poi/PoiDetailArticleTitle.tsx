import MarketTitle from '../consume/MarketTitle'

type PoiDetailArticleTitleProps = {
  title: string
  eyebrow?: string
  aside?: string
  summary?: string
}

function PoiDetailArticleTitle({
  title,
  eyebrow = '景点图志',
  aside = '图文导览',
  summary = '一眼看懂 · 核心看点 · 游览建议'
}: PoiDetailArticleTitleProps) {
  return (
    <header className="map-poi-detail__article-heading">
      <MarketTitle
        title={title}
        eyebrow={eyebrow}
        aside={aside}
        level={2}
        animated={false}
        className="map-poi-detail__article-market-title"
      />
      <p>{summary}</p>
    </header>
  )
}

export default PoiDetailArticleTitle
export type { PoiDetailArticleTitleProps }
