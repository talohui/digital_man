import ProfileCompanionNote from '../profile/ProfileCompanionNote'

type PoiDetailCompanionCardProps = {
  spotName: string
  onOpen: () => void
}

function PoiDetailCompanionCard({ spotName, onOpen }: PoiDetailCompanionCardProps) {
  return (
    <div className="map-poi-detail__article-companion">
      <ProfileCompanionNote latestSpotName={spotName} onOpen={onOpen} />
    </div>
  )
}

export default PoiDetailCompanionCard
export type { PoiDetailCompanionCardProps }
