type PoiHighlightItem = {
  title: string
  description?: string
}

type PoiDetailHighlightsProps = {
  items: PoiHighlightItem[]
}

function PoiDetailHighlights({ items }: PoiDetailHighlightsProps) {
  return (
    <section className="map-poi-detail__section">
      <h2>核心看点</h2>
      <ul>
        {items.map((item) => (
          <li key={item.title}>
            <strong>{item.title}</strong>
            {item.description ? <span>{item.description}</span> : null}
          </li>
        ))}
      </ul>
    </section>
  )
}

export default PoiDetailHighlights
export type { PoiDetailHighlightsProps, PoiHighlightItem }
