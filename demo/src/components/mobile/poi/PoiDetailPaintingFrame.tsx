import type { ReactNode } from 'react'

type PoiDetailPaintingFrameProps = {
  spotId: string
  children: ReactNode
}

function PoiDetailPaintingFrame({ spotId, children }: PoiDetailPaintingFrameProps) {
  return <section className={`map-poi-detail__stage map-poi-detail__stage--${spotId}`}>{children}</section>
}

export default PoiDetailPaintingFrame
export type { PoiDetailPaintingFrameProps }
