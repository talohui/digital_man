import { useEffect, useRef } from 'react'

import type { LatLngPoint } from '../../data/guideData'
import type { LayerManager } from '../../lib/map/LayerManager'

export type ScenicPoiBillboardMode = 'dot' | 'titleTag' | 'activeTag'

export type ScenicPoiBillboardItem = {
  id: string
  name: string
  description: string
  position: LatLngPoint
  tier: 'core' | 'secondary'
  visualLiftPx: number
}

type ScenicPoiBillboardsProps = {
  map: any
  mapReady: boolean
  items: ScenicPoiBillboardItem[]
  mode: ScenicPoiBillboardMode
  activeId?: string
  nextId?: string
  suppressInactive?: boolean
  layerManager?: LayerManager
  onSelectPoi?: (id: string) => void
}

type BillboardDisplayState = {
  active: boolean
  next: boolean
  muted: boolean
  mode: ScenicPoiBillboardMode
}

export function ScenicPoiBillboards({
  map,
  mapReady,
  items,
  mode,
  activeId,
  nextId,
  suppressInactive = false,
  layerManager,
  onSelectPoi
}: ScenicPoiBillboardsProps) {
  const billboardLayerRef = useRef<any>(null)
  const onSelectPoiRef = useRef(onSelectPoi)

  useEffect(() => {
    onSelectPoiRef.current = onSelectPoi
  }, [onSelectPoi])

  useEffect(() => {
    if (!mapReady || !map || !window.TMap?.MultiMarker || !window.TMap?.MarkerStyle || !items.length) {
      return
    }

    const styles: Record<string, any> = {}
    const geometries = items.map((item, index) => {
      const display = getItemDisplayState(item, mode, activeId, nextId, suppressInactive)
      const styleId = `${item.id}-${display.mode}-${display.active ? 'active' : display.next ? 'next' : display.muted ? 'muted' : 'idle'}`
      const size = getBillboardSize(display.mode, display.active, display.next, display.muted)
      const liftPx = getBillboardLiftPx(item, display)
      const markerSize = {
        width: size.width,
        height: size.height + liftPx
      }

      styles[styleId] = new window.TMap.MarkerStyle({
        width: markerSize.width,
        height: markerSize.height,
        anchor: { x: markerSize.width / 2, y: markerSize.height - 6 },
        src: createSvgDataUrl(poiBillboardSvg(item, display, index + 1, liftPx))
      })

      return {
        id: item.id,
        styleId,
        rank: display.active ? 86 : display.next ? 78 : item.tier === 'core' ? 58 : 48,
        position: new window.TMap.LatLng(item.position.lat, item.position.lng),
        properties: {
          id: item.id,
          title: `${item.name} · ${item.description}`
        }
      }
    })

    const layer = new window.TMap.MultiMarker({
      map,
      styles,
      geometries
    })

    const handleClick = (event: any) => {
      const id =
        event?.geometry?.id ??
        event?.detail?.geometry?.id ??
        event?.geometries?.[0]?.id ??
        event?.geometry?.properties?.id

      if (typeof id === 'string') {
        onSelectPoiRef.current?.(id)
      }
    }

    if (typeof layer.on === 'function' && onSelectPoiRef.current) {
      layer.on('click', handleClick)
    }

    billboardLayerRef.current = layer
    layerManager?.registerLayer('poi_billboards', layer)

    return () => {
      if (typeof layer.off === 'function' && onSelectPoiRef.current) {
        layer.off('click', handleClick)
      }
      if (layerManager) {
        layerManager.removeLayer('poi_billboards')
      } else {
        layer.setMap?.(null)
      }
      if (billboardLayerRef.current === layer) {
        billboardLayerRef.current = null
      }
    }
  }, [activeId, items, layerManager, mode, map, mapReady, nextId, suppressInactive])

  return null
}

function getItemDisplayState(
  item: ScenicPoiBillboardItem,
  mode: ScenicPoiBillboardMode,
  activeId?: string,
  nextId?: string,
  suppressInactive?: boolean
): BillboardDisplayState {
  const active = item.id === activeId
  const next = Boolean(!active && nextId && item.id === nextId)
  const muted = Boolean(suppressInactive && !active && !next)

  if (active) {
    return { active, next, muted, mode: 'activeTag' }
  }

  if (next) {
    return { active, next, muted, mode: 'titleTag' }
  }

  if (muted || mode === 'dot') {
    return { active, next, muted, mode: 'dot' }
  }

  if (mode === 'titleTag' && item.tier !== 'core') {
    return { active, next, muted, mode: 'dot' }
  }

  if (mode === 'activeTag') {
    return { active, next, muted, mode: 'titleTag' }
  }

  return { active, next, muted, mode }
}

function getBillboardSize(mode: ScenicPoiBillboardMode, active: boolean, next: boolean, muted: boolean) {
  const scale = muted ? 0.72 : next ? 0.90 : 1

  if (mode === 'activeTag') {
    return {
      width: Math.round((active ? 60 : 56) * scale),
      height: Math.round((active ? 132 : 122) * scale)
    }
  }

  if (mode === 'titleTag') {
    return {
      width: Math.round((next ? 58 : 52) * scale),
      height: Math.round((next ? 126 : 112) * scale)
    }
  }

  return {
    width: Math.round((muted ? 30 : 34) * scale),
    height: Math.round((muted ? 34 : 40) * scale)
  }
}

function getBillboardLiftPx(item: ScenicPoiBillboardItem, display: BillboardDisplayState) {
  if (display.mode === 'dot') {
    return 0
  }

  const baseLift = item.visualLiftPx ?? (item.tier === 'core' ? 68 : 50)

  if (display.active) {
    return clampNumber(baseLift, 64, 92)
  }

  if (display.next) {
    return clampNumber(baseLift - 10, 52, 78)
  }

  return clampNumber(baseLift - 20, 42, 64)
}

function poiBillboardSvg(item: ScenicPoiBillboardItem, display: BillboardDisplayState, index: number, liftPx: number) {
  const size = getBillboardSize(display.mode, display.active, display.next, display.muted)
  const scale = size.width / (display.mode === 'activeTag' ? 72 : display.mode === 'titleTag' ? 54 : 34)
  const opacity = display.muted ? 0.34 : display.next ? 0.76 : 0.92
  const primaryInk = display.active ? '#a9473f' : '#1f3b31'
  const secondaryInk = display.next ? '#2d4a3e' : primaryInk
  const paper = display.active ? 'rgba(245,241,232,.90)' : 'rgba(245,241,232,.82)'
  const gold = display.active ? '#d3ad63' : '#c9a86a'
  const title = verticalSvgText(item.name, display.mode === 'activeTag' ? 7 : 6)
  const subtitle = verticalSvgText(item.description, 7)

  if (display.mode === 'dot') {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="0 0 ${size.width} ${size.height}">
      <g opacity="${opacity}">
        <ellipse cx="${size.width / 2}" cy="${size.height - 4}" rx="${9 * scale}" ry="${3.2 * scale}" fill="rgba(31,59,49,.22)"/>
        <path d="M${17 * scale} ${36 * scale}c${7 * scale}-${6 * scale} ${11 * scale}-${11 * scale} ${11 * scale}-${19 * scale}C${28 * scale} ${8 * scale} ${23 * scale} ${4 * scale} ${17 * scale} ${4 * scale}S${6 * scale} ${8 * scale} ${6 * scale} ${17 * scale}c0 ${8 * scale} ${4 * scale} ${13 * scale} ${11 * scale} ${19 * scale}Z" fill="${paper}" stroke="${gold}" stroke-width="${1.6 * scale}"/>
        <circle cx="${17 * scale}" cy="${17 * scale}" r="${5.8 * scale}" fill="${display.muted ? '#2d4a3e' : secondaryInk}" opacity=".90"/>
        <circle cx="${17 * scale}" cy="${17 * scale}" r="${2.1 * scale}" fill="#f5f1e8"/>
      </g>
    </svg>`
  }

  const active = display.mode === 'activeTag'
  const w = active ? 72 : 54
  const h = active ? 154 : 116
  const tagX = active ? 13 : 9
  const tagW = active ? 46 : 36
  const tagH = active ? 116 : 88
  const titleX = active ? 37 : 27
  const titleY = active ? 31 : 26
  const descX = active ? 21 : 17
  const tagOpacity = display.next ? 0.78 : opacity
  const canvasHeight = h + liftPx

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height + liftPx}" viewBox="0 0 ${w} ${canvasHeight}">
    <defs>
      <filter id="inkSoft" x="-18%" y="-16%" width="136%" height="150%">
        <feGaussianBlur stdDeviation="1.2"/>
      </filter>
      <filter id="goldGlow" x="-35%" y="-24%" width="170%" height="150%">
        <feGaussianBlur stdDeviation="${active ? 5 : 3.2}"/>
      </filter>
    </defs>
    <g opacity="${tagOpacity}">
      <ellipse cx="${w / 2}" cy="${h - 8}" rx="${active ? 20 : 15}" ry="${active ? 5 : 4}" fill="rgba(31,59,49,.20)"/>
      <path d="M${tagX - 1} ${19}c${8}-${7} ${tagW - 4}-${7} ${tagW + 2} 1c${3} ${14} ${2} ${tagH - 10} -1 ${tagH + 2}c-${10} ${6}-${tagW - 7} ${7}-${tagW + 2} -1c-${3}-${17}-${2}-${tagH - 11} 1-${tagH + 1}Z" fill="${display.active ? 'rgba(169,71,63,.92)' : 'rgba(31,59,49,.90)'}" filter="url(#inkSoft)"/>
      <path d="M${tagX + 2} ${14}c${9}-${4} ${tagW - 6}-${5} ${tagW + 1} 2c${2} ${20} ${2} ${tagH - 18} -1 ${tagH + 4}c-${9} ${4}-${tagW - 5} ${6}-${tagW + 2} -2c-${2}-${21}-${2}-${tagH - 21} 2-${tagH + 1}Z" fill="${paper}" stroke="${gold}" stroke-width="1.4"/>
      <path d="M${tagX + 7} ${20}c${7}-${2} ${tagW - 13}-${2} ${tagW - 7} 1c${1} ${18} ${1} ${tagH - 28} -1 ${tagH - 8}c-${8} ${3}-${tagW - 14} ${3}-${tagW - 7} 0c-${2}-${18}-${2}-${tagH - 29} 1-${tagH - 9}Z" fill="rgba(245,241,232,.28)" stroke="rgba(201,168,106,.36)" stroke-width=".8"/>
      <path d="M${w / 2} ${tagH + 18}l-${active ? 7 : 5} ${active ? 15 : 12}h${active ? 14 : 10}l-${active ? 7 : 5}-${active ? 15 : 12}Z" fill="rgba(216,208,190,.88)" stroke="${gold}" stroke-width="1.1"/>
      <rect x="${w / 2 - (active ? 13 : 10)}" y="${h - 11}" width="${active ? 26 : 20}" height="${active ? 4 : 3.4}" rx="2" fill="rgba(168,156,132,.42)"/>
      <circle cx="${w / 2}" cy="${active ? 20 : 18}" r="${active ? 18 : 14}" fill="rgba(201,168,106,${active ? '.26' : '.18'})" filter="url(#goldGlow)"/>
      ${verticalTextSvg(title, titleX, titleY, active ? 17 : 15, active ? '#1f3b31' : secondaryInk, 21)}
      ${
        active
          ? verticalTextSvg(subtitle, descX, 38, 9.5, '#6f7f70', 13)
          : display.next
            ? `<text x="${w - 8}" y="28" text-anchor="middle" font-family="Arial, Noto Sans SC, sans-serif" font-size="7" font-weight="900" fill="${gold}">NEXT</text>`
            : ''
      }
      <text x="${w / 2}" y="${h - 20}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${active ? 9 : 7}" font-weight="900" fill="${gold}" opacity=".72">${index}</text>
    </g>
  </svg>`
}

function verticalTextSvg(text: string, x: number, y: number, fontSize: number, fill: string, lineHeight: number) {
  const chars = Array.from(text)
  return chars
    .map(
      (char, index) =>
        `<text x="${x}" y="${y + index * lineHeight}" text-anchor="middle" font-family="Songti SC, STSong, Noto Serif SC, serif" font-size="${fontSize}" font-weight="900" fill="${fill}">${escapeSvgText(char)}</text>`
    )
    .join('')
}

function verticalSvgText(text: string, maxLength: number) {
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text
}

function createSvgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function escapeSvgText(text: string) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
