import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { type KeyboardEvent, type SyntheticEvent, useEffect, useMemo, useRef, useState } from 'react'

import { getPoiArrivalSummary, getRecommendedStayLabel } from '../../../data/poiGuideMetadata'
import { getPoiMedia, getRouteMedia, SCENIC_MEDIA_FALLBACK } from '../../../data/scenicMediaCatalog'
import type { ScenicRouteConfig } from '../../../data/lingshanScenicRoutes'
import { getRouteStopTargetIndex, resolveInitialRouteStopId } from '../../../lib/planV2Interactions'
import '../../../styles/c-app/routeItineraryFolio.css'

type RouteItineraryFolioProps = {
  route: ScenicRouteConfig
  matchLabel: string
  reason: string
  assistantAvatar?: string
  initialSelectedStopId?: string
  onSelectedStopChange?: (stopId: string) => void
}

function formatDuration(minutes?: number) {
  if (!minutes) return '按行程'
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (!hours) return `${rest} 分钟`
  if (!rest) return `${hours} 小时`
  return `${hours}.${Math.round(rest / 6)} 小时`
}

function handleScenicImageError(event: SyntheticEvent<HTMLImageElement>) {
  if (!event.currentTarget.src.endsWith(SCENIC_MEDIA_FALLBACK)) {
    event.currentTarget.src = SCENIC_MEDIA_FALLBACK
  }
}

function RouteItineraryFolio({
  route,
  matchLabel,
  reason,
  assistantAvatar = '/icons/lingshan-guide-avatar.png',
  initialSelectedStopId,
  onSelectedStopChange
}: RouteItineraryFolioProps) {
  const stopIds = route.stops.map((stop) => stop.id)
  const [selectedStopId, setSelectedStopId] = useState(() => resolveInitialRouteStopId(stopIds, initialSelectedStopId))
  const stopStripRef = useRef<HTMLDivElement>(null)
  const routeMedia = getRouteMedia(route.id)
  const matchedStopIndex = route.stops.findIndex((stop) => stop.id === selectedStopId)
  const selectedStopIndex = matchedStopIndex >= 0 ? matchedStopIndex : 0
  const selectedStop = route.stops[selectedStopIndex]
  const selectedStopPosition = selectedStop ? selectedStopIndex + 1 : 0
  const selectedPoiId = selectedStop?.poiId ?? selectedStop?.id
  const selectedMedia = getPoiMedia(selectedPoiId)
  const stopDescription = useMemo(
    () => selectedStop?.narrative || getPoiArrivalSummary(selectedPoiId) || '沿路线继续前行，小灵会在到站后补充这一站的讲解与游览建议。',
    [selectedPoiId, selectedStop?.narrative]
  )

  useEffect(() => {
    const nextStopId = resolveInitialRouteStopId(route.stops.map((stop) => stop.id), initialSelectedStopId)
    setSelectedStopId(nextStopId)
    if (nextStopId && nextStopId !== initialSelectedStopId) onSelectedStopChange?.(nextStopId)
  }, [initialSelectedStopId, onSelectedStopChange, route.id, route.stops])

  useEffect(() => {
    const strip = stopStripRef.current
    const selectedButton = Array.from(strip?.querySelectorAll<HTMLButtonElement>('[data-route-stop-id]') ?? [])
      .find((button) => button.dataset.routeStopId === selectedStopId)
    if (!strip || !selectedButton) return
    strip.scrollTo({
      left: Math.max(0, selectedButton.offsetLeft - (strip.clientWidth - selectedButton.offsetWidth) / 2),
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'
    })
  }, [selectedStopId])

  const selectStopAt = (index: number, moveFocus = false) => {
    const stop = route.stops[Math.max(0, Math.min(route.stops.length - 1, index))]
    if (stop) {
      if (stop.id !== selectedStopId) {
        setSelectedStopId(stop.id)
        onSelectedStopChange?.(stop.id)
      }
      if (moveFocus) {
        window.requestAnimationFrame(() => stopStripRef.current
          ?.querySelector<HTMLButtonElement>(`[data-route-stop-id="${stop.id}"]`)
          ?.focus({ preventScroll: true }))
      }
    }
  }

  const handleStopKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    selectStopAt(getRouteStopTargetIndex(route.stops.length, index, event.key), true)
  }

  return (
    <section className="route-itinerary-folio" aria-labelledby={`route-itinerary-${route.id}-title`}>
      <header className="route-itinerary-folio__hero">
        <img
          src={routeMedia.cover}
          alt={routeMedia.alt}
          onError={handleScenicImageError}
        />
        <span className="route-itinerary-folio__veil" aria-hidden="true" />
        <div className="route-itinerary-folio__title">
          <small>小灵为你展开 · 今日行程卷</small>
          <h2 id={`route-itinerary-${route.id}-title`}>{route.name}</h2>
          <p>{route.tags.join(' · ')}</p>
        </div>
        <i className="route-itinerary-folio__match"><strong>{matchLabel}</strong><small>契合</small></i>
      </header>

      <div className="route-itinerary-folio__reason">
        <span><img src={assistantAvatar} alt="" /></span>
        <p><small>小灵为什么推荐</small><strong>{reason}</strong></p>
      </div>

      <div className="route-itinerary-folio__facts" role="group" aria-label="路线信息">
        <span><small>预计用时</small><b>{formatDuration(route.estimatedMinutes)}</b></span>
        <span><small>沿途站点</small><b>{route.stops.length} 站</b></span>
        <span><small>步行强度</small><b>{route.guideRoute.walkIntensity}</b></span>
      </div>

      <div className="route-itinerary-folio__stops-head">
        <span><small>地图路线站点</small><strong>点选景点，预览这一站</strong></span>
        <div className="route-itinerary-folio__stop-controls" role="group" aria-label="切换路线站点">
          <span aria-live="polite"><b>{selectedStopPosition}</b> / {route.stops.length}</span>
          <button type="button" aria-label="上一站" disabled={!selectedStop || selectedStopIndex === 0} onClick={() => selectStopAt(selectedStopIndex - 1)}><LeftOutlined /></button>
          <button type="button" aria-label="下一站" disabled={!selectedStop || selectedStopIndex === route.stops.length - 1} onClick={() => selectStopAt(selectedStopIndex + 1)}><RightOutlined /></button>
        </div>
      </div>
      <div ref={stopStripRef} className="route-itinerary-folio__stop-strip" role="listbox" aria-label="路线景点，可横向滑动，也可使用方向键切换" aria-orientation="horizontal">
        {route.stops.map((stop, index) => {
          const poiId = stop.poiId ?? stop.id
          const media = getPoiMedia(poiId)
          const selected = stop.id === selectedStop?.id
          return (
            <button key={`${route.id}-${stop.id}`} type="button" role="option" data-route-stop-id={stop.id} className={selected ? 'is-selected' : ''} aria-label={`第${index + 1}站 ${stop.name}`} aria-selected={selected} tabIndex={selected ? 0 : -1} onKeyDown={(event) => handleStopKeyDown(event, index)} onClick={() => selectStopAt(index)}>
              <img src={media.thumbnail ?? media.cover} alt="" onError={handleScenicImageError} />
              <span><small>{String(index + 1).padStart(2, '0')}</small><strong>{stop.name}</strong></span>
            </button>
          )
        })}
      </div>

      {selectedStop ? (
        <article className="route-itinerary-folio__stop-detail" role="status" aria-live="polite" aria-atomic="true">
          <img src={selectedMedia.cover} alt={selectedMedia.alt} onError={handleScenicImageError} />
          <div>
            <small>第 {selectedStopIndex + 1} 站 · {getRecommendedStayLabel(selectedPoiId)}</small>
            <strong>{selectedStop.name}</strong>
            <p>{stopDescription}</p>
          </div>
        </article>
      ) : null}

      <div className="route-itinerary-folio__companion">
        <span><img src={assistantAvatar} alt="" /></span>
        <p><small>小灵全程陪伴</small><strong>出发后会按站讲解、提前提醒；临时想少走或换顺序，也能随时告诉我。</strong></p>
      </div>
    </section>
  )
}

export default RouteItineraryFolio
export type { RouteItineraryFolioProps }
