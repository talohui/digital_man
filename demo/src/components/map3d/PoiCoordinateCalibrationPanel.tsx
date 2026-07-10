import { useEffect, useMemo, useState } from 'react'

import {
  getScenicPoiCatalogItem,
  scenicPoiCatalog,
  type ScenicPoiCatalogItem
} from '../../data/scenicPoiCatalog'
import {
  resolveLingshanPoiCoordinates,
  type TencentPoiCoordinateCandidate
} from '../../dev/poiCoordinateResolver'

type Props = {
  enabled: boolean
  map: any
  mapReady: boolean
  isCurrentMap: (map: any) => boolean
}

const unresolvedPois = scenicPoiCatalog.filter((item) => item.coordinateStatus === 'unresolved')

function svgDataUrl(svg: string) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

function candidateMarkerSvg(color: string, label: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="38" height="44" viewBox="0 0 38 44"><path d="M19 2C10 2 4 9 4 18c0 12 15 24 15 24s15-12 15-24C34 9 28 2 19 2Z" fill="${color}" stroke="#fff8df" stroke-width="2"/><text x="19" y="23" text-anchor="middle" font-family="Arial" font-size="11" font-weight="700" fill="#fff">${label}</text></svg>`
}

function formatCoordinate(candidate?: Pick<TencentPoiCoordinateCandidate, 'lat' | 'lng'>) {
  return candidate ? `${candidate.lat.toFixed(6)}, ${candidate.lng.toFixed(6)}` : '—'
}

export function PoiCoordinateCalibrationPanel({ enabled, map, mapReady, isCurrentMap }: Props) {
  const [poiId, setPoiId] = useState(unresolvedPois[0]?.id ?? '')
  const [candidates, setCandidates] = useState<TencentPoiCoordinateCandidate[]>([])
  const [selectedCandidateId, setSelectedCandidateId] = useState('')
  const [manualPosition, setManualPosition] = useState<TencentPoiCoordinateCandidate | undefined>()
  const [status, setStatus] = useState('选择景点后查询腾讯候选')
  const selectedPoi = getScenicPoiCatalogItem(poiId)
  const selectedCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === selectedCandidateId) ?? manualPosition,
    [candidates, manualPosition, selectedCandidateId]
  )

  useEffect(() => {
    if (!enabled || !mapReady || !map || !isCurrentMap(map) || !window.TMap || !candidates.length) {
      return
    }
    const TMap = window.TMap
    const layer = new TMap.MultiMarker({
      map,
      enableDragging: true,
      styles: {
        candidate: new TMap.MarkerStyle({
          width: 38,
          height: 44,
          anchor: { x: 19, y: 42 },
          src: svgDataUrl(candidateMarkerSvg('#2f7f69', '候'))
        }),
        selected: new TMap.MarkerStyle({
          width: 42,
          height: 48,
          anchor: { x: 21, y: 46 },
          src: svgDataUrl(candidateMarkerSvg('#b88620', '选'))
        })
      },
      geometries: candidates.map((candidate) => ({
        id: candidate.id,
        styleId: candidate.id === selectedCandidateId ? 'selected' : 'candidate',
        position: new TMap.LatLng(candidate.lat, candidate.lng),
        draggable: candidate.id === selectedCandidateId,
        properties: { title: candidate.title }
      }))
    })
    const handleClick = (event: any) => {
      const id = String(event?.geometry?.id ?? '')
      if (id) setSelectedCandidateId(id)
    }
    const handleDragEnd = (event: any) => {
      const location = event?.latLng ?? event?.geometry?.position
      const lat = typeof location?.getLat === 'function' ? Number(location.getLat()) : Number(location?.lat)
      const lng = typeof location?.getLng === 'function' ? Number(location.getLng()) : Number(location?.lng)
      if (!Number.isFinite(lat) || !Number.isFinite(lng) || !selectedCandidate) return
      setManualPosition({ ...selectedCandidate, id: `${selectedCandidate.id}:manual`, lat, lng, score: selectedCandidate.score })
      setStatus('已记录拖动后的候选坐标；复制 JSON 后由人工审核写入 catalog。')
    }
    layer.on?.('click', handleClick)
    layer.on?.('dragend', handleDragEnd)
    return () => {
      try {
        layer.off?.('click', handleClick)
        layer.off?.('dragend', handleDragEnd)
        layer.setMap?.(null)
      } catch {
        // Map may be in a context-loss recovery; the runtime owns final cleanup.
      }
    }
  }, [candidates, enabled, isCurrentMap, map, mapReady, selectedCandidate, selectedCandidateId])

  if (!enabled) return null

  const runSearch = async () => {
    if (!poiId) return
    setStatus('正在腾讯限定矩形范围内查询…')
    try {
      const nextCandidates = await resolveLingshanPoiCoordinates(poiId)
      setCandidates(nextCandidates)
      setSelectedCandidateId(nextCandidates[0]?.id ?? '')
      setManualPosition(undefined)
      setStatus(nextCandidates.length ? `已返回 ${nextCandidates.length} 个候选，请点击或拖动确认。` : '腾讯未返回景区范围内候选。')
    } catch (error) {
      setCandidates([])
      setStatus(error instanceof Error ? error.message : '腾讯地点搜索失败')
    }
  }

  const copyJson = async () => {
    if (!selectedPoi || !selectedCandidate) return
    const payload = {
      id: selectedPoi.id,
      name: selectedPoi.name,
      coordinate: { lat: Number(selectedCandidate.lat.toFixed(6)), lng: Number(selectedCandidate.lng.toFixed(6)) },
      coordinateSource: { type: 'manual-calibration', tencentPoiId: selectedCandidate.id }
    }
    await navigator.clipboard?.writeText(JSON.stringify(payload, null, 2))
    setStatus('已复制 JSON；此工具不会自动修改 catalog。')
  }

  return (
    <aside style={{ position: 'absolute', zIndex: 1005, right: 16, bottom: 16, width: 300, padding: 12, borderRadius: 8, background: 'rgba(247,244,233,.96)', color: '#19372f', boxShadow: '0 8px 24px rgba(23,50,39,.2)', fontSize: 12 }}>
      <strong>POI 坐标校准（开发态）</strong>
      <select value={poiId} onChange={(event) => setPoiId(event.target.value)} style={{ width: '100%', marginTop: 8 }}>
        {unresolvedPois.map((item: ScenicPoiCatalogItem) => <option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
      <button type="button" onClick={runSearch} style={{ width: '100%', marginTop: 8 }}>查询腾讯候选</button>
      <p style={{ margin: '8px 0', lineHeight: 1.45 }}>{status}</p>
      {candidates.slice(0, 4).map((candidate) => (
        <button key={candidate.id} type="button" onClick={() => setSelectedCandidateId(candidate.id)} style={{ display: 'block', width: '100%', textAlign: 'left', marginTop: 4, border: candidate.id === selectedCandidateId ? '1px solid #b88620' : '1px solid #d9d4c4', background: '#fffdf5' }}>
          {candidate.title} · {candidate.score} 分<br /><small>{formatCoordinate(candidate)}</small>
        </button>
      ))}
      <button type="button" disabled={!selectedCandidate} onClick={copyJson} style={{ width: '100%', marginTop: 8 }}>复制当前确认 JSON</button>
    </aside>
  )
}
