type PoiDetailVisitTipsProps = {
  tips: string[]
}

function PoiDetailVisitTips({ tips }: PoiDetailVisitTipsProps) {
  return (
    <section className="map-poi-detail__section">
      <h2>游览建议</h2>
      <ul>{tips.map((tip) => <li key={tip}>{tip}</li>)}</ul>
    </section>
  )
}

export default PoiDetailVisitTips
export type { PoiDetailVisitTipsProps }
