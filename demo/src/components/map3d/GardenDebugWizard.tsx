import { useEffect, useState, type Dispatch, type SetStateAction } from 'react'

import type { LatLngPoint } from '../../data/guideData'
import {
  lingshanMap3DGardenVegetationZones,
  type LingshanMap3DGardenAsset,
  type Map3DGardenAssetKind,
  type Map3DGardenAssetPriority
} from '../../data/lingshanMap3DGardenAssets'
import type { GardenModelReport } from '../../hooks/useGardenAssetOverlays'

export type GardenEditorZoneKind = 'forest' | 'axis_grove' | 'water_edge' | 'node_green'
export type GardenKeepoutReason = string
export type GardenEditorMode = 'inspect' | 'drawVegetation' | 'drawKeepout' | 'addAsset'
export type GardenEditorStep = 'keepout' | 'vegetation' | 'preview' | 'apply' | 'export'
export type GardenAssetRatios = Partial<Record<Map3DGardenAssetKind, number>>

export type GardenEditorVegetationZone = {
  id: string
  name: string
  kind: GardenEditorZoneKind
  vertices: LatLngPoint[]
  density: number
  assetPool: Map3DGardenAssetKind[]
  assetRatios: GardenAssetRatios
  minScale: number
  maxScale: number
  minHeight: number
  maxHeight: number
  opacity: number
  priority: Map3DGardenAssetPriority
  visible: boolean
}

export type GardenEditorKeepoutZone = {
  id: string
  name: string
  reason: GardenKeepoutReason
  vertices: LatLngPoint[]
  visible: boolean
}

export type GardenEditorState = {
  zones: GardenEditorVegetationZone[]
  keepouts: GardenEditorKeepoutZone[]
  previewAssets: LingshanMap3DGardenAsset[]
  appliedAssets: LingshanMap3DGardenAsset[]
}

export type GardenDraftPolygon = {
  mode: 'vegetation' | 'keepout'
  vertices: LatLngPoint[]
} | null

type GardenAssetFilterState = {
  zoneId: string
  kind: string
  priority: string
  visible: string
}

type GardenBatchAdjustState = {
  scaleMultiplier: number
  heightDelta: number
  opacityDelta: number
  latOffset: number
  lngOffset: number
}

type GardenEditorPanelPosition = {
  x: number
  y: number
}

type GardenDebugWizardProps = {
  applyFilteredGardenHeight: () => void
  applyFilteredGardenOffset: () => void
  applyFilteredGardenOpacity: () => void
  applyFilteredGardenScale: () => void
  applyFilteredGardenVisibility: (visible: boolean) => void
  applyGardenPreviewAsGlb: () => void
  beginKeepoutZoneDrawing: () => void
  beginVegetationZoneDrawing: () => void
  cancelDraftGardenPolygon: () => void
  clearGardenLocalDraft: () => void
  clearGardenPreviewAssets: () => void
  copyCompleteGardenSourceSnippet: () => void
  copyEditorAssetsConfig: () => void
  copyGardenSummary: () => void
  deleteSelectedEditorZone: () => void
  deleteSelectedGardenAsset: () => void
  deleteSelectedKeepoutZone: () => void
  editorAddAssetKind: Map3DGardenAssetKind
  filteredGardenAssets: LingshanMap3DGardenAsset[]
  finishDraftGardenPolygon: () => void
  forestPatchesVisible: boolean
  gardenAssetEditDraft: LingshanMap3DGardenAsset | null
  gardenAssetKindOptions: Map3DGardenAssetKind[]
  gardenAssets: LingshanMap3DGardenAsset[]
  gardenBatchAdjust: GardenBatchAdjustState
  gardenCopyStatus: string
  gardenDraftPolygon: GardenDraftPolygon
  gardenEditorMode: GardenEditorMode
  gardenEditorState: GardenEditorState
  gardenEditorUsesStoredDraft: boolean
  gardenFilters: GardenAssetFilterState
  gardenModelReport: GardenModelReport
  generateGardenPreviewAssets: () => void
  resetGardenEditorState: () => void
  saveGardenAssetEditDraft: () => void
  saveGardenEditorStateToLocalStorage: () => void
  selectedEditorZone?: GardenEditorVegetationZone
  selectedEditorZoneId: string
  selectedGardenAsset?: LingshanMap3DGardenAsset
  selectedGardenAssetDraft?: LingshanMap3DGardenAsset
  selectedGardenId: string
  selectedGardenVertexId: string
  selectedKeepoutZone?: GardenEditorKeepoutZone
  selectedKeepoutZoneId: string
  selectEditorZone: (zoneId: string) => void
  selectGardenAssetForEditing: (assetId: string) => void
  selectKeepoutZone: (zoneId: string) => void
  selectFirstFilteredGardenAsset: () => void
  setEditorAddAssetKind: Dispatch<SetStateAction<Map3DGardenAssetKind>>
  setForestPatchesVisible: Dispatch<SetStateAction<boolean>>
  setGardenDraftPolygon: Dispatch<SetStateAction<GardenDraftPolygon>>
  setGardenEditorMode: Dispatch<SetStateAction<GardenEditorMode>>
  setGardenFilters: Dispatch<SetStateAction<GardenAssetFilterState>>
  updateGardenAssetEditDraft: (patch: Partial<LingshanMap3DGardenAsset>) => void
  updateGardenBatchAdjust: (patch: Partial<GardenBatchAdjustState>) => void
  updateGardenFilter: (patch: Partial<GardenAssetFilterState>) => void
  updateSelectedEditorZone: (patch: Partial<GardenEditorVegetationZone>) => void
  updateSelectedKeepoutZone: (patch: Partial<GardenEditorKeepoutZone>) => void
}

const gardenEditorSteps: Array<{ id: GardenEditorStep; label: string }> = [
  { id: 'keepout', label: '1 禁放区' },
  { id: 'vegetation', label: '2 放树区' },
  { id: 'preview', label: '3 预览' },
  { id: 'apply', label: '4 应用' },
  { id: 'export', label: '5 导出' }
]

function GardenDebugWizard({
  applyFilteredGardenHeight,
  applyFilteredGardenOffset,
  applyFilteredGardenOpacity,
  applyFilteredGardenScale,
  applyFilteredGardenVisibility,
  applyGardenPreviewAsGlb,
  beginKeepoutZoneDrawing,
  beginVegetationZoneDrawing,
  cancelDraftGardenPolygon,
  clearGardenLocalDraft,
  clearGardenPreviewAssets,
  copyCompleteGardenSourceSnippet,
  copyEditorAssetsConfig,
  copyGardenSummary,
  deleteSelectedEditorZone,
  deleteSelectedGardenAsset,
  deleteSelectedKeepoutZone,
  editorAddAssetKind,
  filteredGardenAssets,
  finishDraftGardenPolygon,
  forestPatchesVisible,
  gardenAssetKindOptions,
  gardenAssets,
  gardenBatchAdjust,
  gardenCopyStatus,
  gardenDraftPolygon,
  gardenEditorMode,
  gardenEditorState,
  gardenEditorUsesStoredDraft,
  gardenFilters,
  gardenModelReport,
  generateGardenPreviewAssets,
  resetGardenEditorState,
  saveGardenAssetEditDraft,
  saveGardenEditorStateToLocalStorage,
  selectedEditorZone,
  selectedEditorZoneId,
  selectedGardenAssetDraft,
  selectedGardenId,
  selectedGardenVertexId,
  selectedKeepoutZone,
  selectedKeepoutZoneId,
  selectEditorZone,
  selectGardenAssetForEditing,
  selectFirstFilteredGardenAsset,
  selectKeepoutZone,
  setEditorAddAssetKind,
  setForestPatchesVisible,
  setGardenDraftPolygon,
  setGardenEditorMode,
  setGardenFilters,
  updateGardenAssetEditDraft,
  updateGardenBatchAdjust,
  updateGardenFilter,
  updateSelectedEditorZone,
  updateSelectedKeepoutZone
}: GardenDebugWizardProps) {
  const [gardenEditorStep, setGardenEditorStep] = useState<GardenEditorStep>('keepout')
  const [gardenEditorPanelPosition, setGardenEditorPanelPosition] = useState<GardenEditorPanelPosition>({ x: 18, y: 76 })
  const [gardenEditorDragOffset, setGardenEditorDragOffset] = useState<GardenEditorPanelPosition | null>(null)

  useEffect(() => {
    if (!gardenEditorDragOffset) {
      return
    }

    const handleMouseMove = (event: MouseEvent) => {
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      setGardenEditorPanelPosition({
        x: clampNumber(event.clientX - gardenEditorDragOffset.x, 8, Math.max(8, viewportWidth - 360)),
        y: clampNumber(event.clientY - gardenEditorDragOffset.y, 8, Math.max(8, viewportHeight - 120))
      })
    }
    const handleMouseUp = () => setGardenEditorDragOffset(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [gardenEditorDragOffset])

  const renderGardenObjectLists = () => (
    <div className="map-3d-guide-garden-debug__object-lists">
      <div className="map-3d-guide-garden-debug__list-group">
        <div className="map-3d-guide-garden-debug__list-heading">
          <strong>放树区</strong>
          <span>{gardenEditorState.zones.length}</span>
        </div>
        <div className="map-3d-guide-garden-debug__list-scroll">
          {gardenEditorState.zones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={zone.id === selectedEditorZoneId ? 'is-active' : ''}
              onClick={() => {
                setGardenEditorStep('vegetation')
                selectEditorZone(zone.id)
              }}
            >
              <span>{zone.name}</span>
              <small>{zone.kind} · density {zone.density}</small>
            </button>
          ))}
        </div>
      </div>

      <div className="map-3d-guide-garden-debug__list-group">
        <div className="map-3d-guide-garden-debug__list-heading">
          <strong>禁放区</strong>
          <span>{gardenEditorState.keepouts.length}</span>
        </div>
        <div className="map-3d-guide-garden-debug__list-scroll">
          {gardenEditorState.keepouts.map((zone) => (
            <button
              key={zone.id}
              type="button"
              className={zone.id === selectedKeepoutZoneId ? 'is-active' : ''}
              onClick={() => {
                setGardenEditorStep('keepout')
                selectKeepoutZone(zone.id)
              }}
            >
              <span>{zone.name}</span>
              <small>{zone.reason} · {zone.vertices.length} 点</small>
            </button>
          ))}
        </div>
      </div>

      <div className="map-3d-guide-garden-debug__list-group">
        <div className="map-3d-guide-garden-debug__list-heading">
          <strong>资产点</strong>
          <span>{gardenAssets.length}</span>
        </div>
        <div className="map-3d-guide-garden-debug__list-scroll map-3d-guide-garden-debug__list-scroll--assets">
          {gardenAssets.map((asset) => (
            <button
              key={asset.id}
              type="button"
              className={asset.id === selectedGardenId ? 'is-active' : ''}
              onClick={() => {
                setGardenEditorStep('apply')
                selectGardenAssetForEditing(asset.id)
              }}
            >
              <span>{asset.name}</span>
              <small>{asset.kind} · {getGardenAssetZoneId(asset)}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  )

  const renderGardenStepContent = () => {
    if (gardenEditorStep === 'keepout') {
      return (
        <div className="map-3d-guide-garden-debug__subsection">
          <div className="map-3d-guide-garden-debug__section-head">
            <strong>第 1 步：禁放区</strong>
            <button type="button" className="map-3d-guide-garden-debug__primary" onClick={beginKeepoutZoneDrawing}>
              新建禁放区
            </button>
          </div>

          {gardenDraftPolygon?.mode === 'keepout' ? (
            <div className="map-3d-guide-garden-debug__draft-state">
              <span>绘制中 · {gardenDraftPolygon.vertices.length} 个顶点 · 双击地图完成</span>
              <button type="button" onClick={cancelDraftGardenPolygon}>
                取消
              </button>
            </div>
          ) : null}

          {selectedKeepoutZone ? (
            <>
              <div className="map-3d-guide-decor-debug__grid">
                <label>
                  名称
                  <input value={selectedKeepoutZone.name} onChange={(event) => updateSelectedKeepoutZone({ name: event.target.value })} />
                </label>
                <label>
                  禁放原因
                  <input value={selectedKeepoutZone.reason} onChange={(event) => updateSelectedKeepoutZone({ reason: event.target.value })} />
                </label>
                <label>
                  顶点数
                  <input value={selectedKeepoutZone.vertices.length} readOnly />
                </label>
              </div>
              <details className="map-3d-guide-garden-debug__advanced">
                <summary>高级设置</summary>
                <div className="map-3d-guide-decor-debug__grid">
                  <label>
                    visible
                    <select
                      value={selectedKeepoutZone.visible ? 'true' : 'false'}
                      onChange={(event) => updateSelectedKeepoutZone({ visible: event.target.value === 'true' })}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </label>
                  <label>
                    选中顶点
                    <input value={selectedGardenVertexId || 'none'} readOnly />
                  </label>
                </div>
                <div className="map-3d-guide-decor-debug__actions">
                  <button type="button" onClick={finishDraftGardenPolygon}>
                    手动完成当前草稿
                  </button>
                </div>
              </details>
              <div className="map-3d-guide-decor-debug__actions">
                <button type="button" className="map-3d-guide-garden-debug__danger" onClick={deleteSelectedKeepoutZone}>
                  删除禁放区
                </button>
              </div>
            </>
          ) : (
            <p>未选中禁放区。</p>
          )}
        </div>
      )
    }

    if (gardenEditorStep === 'vegetation') {
      return (
        <div className="map-3d-guide-garden-debug__subsection">
          <div className="map-3d-guide-garden-debug__section-head">
            <strong>第 2 步：放树区</strong>
            <button type="button" className="map-3d-guide-garden-debug__primary" onClick={beginVegetationZoneDrawing}>
              新建放树区
            </button>
          </div>

          {gardenDraftPolygon?.mode === 'vegetation' ? (
            <div className="map-3d-guide-garden-debug__draft-state">
              <span>绘制中 · {gardenDraftPolygon.vertices.length} 个顶点 · 双击地图完成</span>
              <button type="button" onClick={cancelDraftGardenPolygon}>
                取消
              </button>
            </div>
          ) : null}

          {selectedEditorZone ? (
            <>
              <div className="map-3d-guide-decor-debug__grid">
                <label>
                  区域名称
                  <input value={selectedEditorZone.name} onChange={(event) => updateSelectedEditorZone({ name: event.target.value })} />
                </label>
                <label>
                  树群类型
                  <select
                    value={selectedEditorZone.kind}
                    onChange={(event) => updateSelectedEditorZone({ kind: event.target.value as GardenEditorZoneKind })}
                  >
                    <option value="forest">forest</option>
                    <option value="axis_grove">axis_grove</option>
                    <option value="water_edge">water_edge</option>
                    <option value="node_green">node_green</option>
                  </select>
                </label>
                <label>
                  密度
                  <input
                    type="number"
                    min="0"
                    max="160"
                    value={selectedEditorZone.density}
                    onChange={(event) => updateSelectedEditorZone({ density: Number(event.target.value) })}
                  />
                </label>
                <label>
                  资产组合
                  <input
                    value={selectedEditorZone.assetPool.join(', ')}
                    onChange={(event) => {
                      const pool = event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter((item): item is Map3DGardenAssetKind => gardenAssetKindOptions.includes(item as Map3DGardenAssetKind))
                      updateSelectedEditorZone({ assetPool: pool })
                    }}
                  />
                </label>
              </div>

              <details className="map-3d-guide-garden-debug__advanced">
                <summary>高级设置</summary>
                <div className="map-3d-guide-decor-debug__grid">
                  <label>
                    assetRatios
                    <input
                      value={formatGardenAssetRatios(selectedEditorZone.assetRatios)}
                      onChange={(event) => updateSelectedEditorZone({ assetRatios: parseGardenAssetRatios(event.target.value, gardenAssetKindOptions) })}
                    />
                  </label>
                  <label>
                    minScale
                    <input
                      type="number"
                      value={selectedEditorZone.minScale}
                      onChange={(event) => updateSelectedEditorZone({ minScale: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    maxScale
                    <input
                      type="number"
                      value={selectedEditorZone.maxScale}
                      onChange={(event) => updateSelectedEditorZone({ maxScale: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    minHeight
                    <input
                      type="number"
                      step="0.1"
                      value={selectedEditorZone.minHeight}
                      onChange={(event) => updateSelectedEditorZone({ minHeight: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    maxHeight
                    <input
                      type="number"
                      step="0.1"
                      value={selectedEditorZone.maxHeight}
                      onChange={(event) => updateSelectedEditorZone({ maxHeight: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    opacity
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={selectedEditorZone.opacity}
                      onChange={(event) => updateSelectedEditorZone({ opacity: Number(event.target.value) })}
                    />
                  </label>
                  <label>
                    priority
                    <select
                      value={selectedEditorZone.priority}
                      onChange={(event) => updateSelectedEditorZone({ priority: event.target.value as Map3DGardenAssetPriority })}
                    >
                      <option value="high">high</option>
                      <option value="medium">medium</option>
                      <option value="low">low</option>
                    </select>
                  </label>
                  <label>
                    visible
                    <select
                      value={selectedEditorZone.visible ? 'true' : 'false'}
                      onChange={(event) => updateSelectedEditorZone({ visible: event.target.value === 'true' })}
                    >
                      <option value="true">true</option>
                      <option value="false">false</option>
                    </select>
                  </label>
                  <label>
                    顶点数
                    <input value={selectedEditorZone.vertices.length} readOnly />
                  </label>
                  <label>
                    选中顶点
                    <input value={selectedGardenVertexId || 'none'} readOnly />
                  </label>
                </div>
                <div className="map-3d-guide-decor-debug__actions">
                  <button type="button" onClick={finishDraftGardenPolygon}>
                    手动完成当前草稿
                  </button>
                </div>
              </details>

              <div className="map-3d-guide-decor-debug__actions">
                <button type="button" className="map-3d-guide-garden-debug__danger" onClick={deleteSelectedEditorZone}>
                  删除放树区
                </button>
              </div>
            </>
          ) : (
            <p>未选中放树区。</p>
          )}
        </div>
      )
    }

    if (gardenEditorStep === 'preview') {
      return (
        <div className="map-3d-guide-garden-debug__subsection">
          <div className="map-3d-guide-garden-debug__section-head">
            <strong>第 3 步：生成预览</strong>
            <button type="button" className="map-3d-guide-garden-debug__primary" onClick={generateGardenPreviewAssets}>
              生成预览点
            </button>
          </div>
          <div className="map-3d-guide-garden-debug__stat-row">
            <span>preview {gardenEditorState.previewAssets.length}</span>
            <span>zones {gardenEditorState.zones.length}</span>
            <span>keepouts {gardenEditorState.keepouts.length}</span>
          </div>
          <div className="map-3d-guide-decor-debug__actions">
            <button type="button" onClick={clearGardenPreviewAssets}>
              清空预览
            </button>
          </div>
          <details className="map-3d-guide-garden-debug__advanced">
            <summary>高级设置</summary>
            <div className="map-3d-guide-decor-debug__grid">
              <label>
                单点资产类型
                <select
                  value={editorAddAssetKind}
                  onChange={(event) => setEditorAddAssetKind(event.target.value as Map3DGardenAssetKind)}
                >
                  {gardenAssetKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                当前模式
                <input value={gardenEditorMode} readOnly />
              </label>
            </div>
            <div className="map-3d-guide-decor-debug__actions">
              <button type="button" className={gardenEditorMode === 'addAsset' ? 'is-active' : ''} onClick={() => setGardenEditorMode('addAsset')}>
                添加单个资产
              </button>
              <button
                type="button"
                onClick={() => {
                  setGardenEditorMode('inspect')
                  setGardenDraftPolygon(null)
                }}
              >
                返回查看
              </button>
            </div>
          </details>
        </div>
      )
    }

    if (gardenEditorStep === 'apply') {
      return (
        <div className="map-3d-guide-garden-debug__subsection">
          <div className="map-3d-guide-garden-debug__section-head">
            <strong>第 4 步：应用 GLB</strong>
            <button type="button" className="map-3d-guide-garden-debug__primary" onClick={applyGardenPreviewAsGlb}>
              应用为 GLB 树群
            </button>
          </div>

          <label>
            资产点
            <select
              value={selectedGardenAssetDraft?.id ?? ''}
              onChange={(event) => selectGardenAssetForEditing(event.target.value)}
            >
              <option value="">未选中</option>
              {gardenAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} · {asset.kind} · {getGardenAssetZoneId(asset)}
                </option>
              ))}
            </select>
          </label>

          {selectedGardenAssetDraft ? (
            <>
              <div className="map-3d-guide-decor-debug__grid">
                <label>
                  纬度
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedGardenAssetDraft.location.lat}
                    onChange={(event) =>
                      updateGardenAssetEditDraft({
                        location: {
                          ...selectedGardenAssetDraft.location,
                          lat: Number(event.target.value)
                        }
                      })
                    }
                  />
                </label>
                <label>
                  经度
                  <input
                    type="number"
                    step="0.000001"
                    value={selectedGardenAssetDraft.location.lng}
                    onChange={(event) =>
                      updateGardenAssetEditDraft({
                        location: {
                          ...selectedGardenAssetDraft.location,
                          lng: Number(event.target.value)
                        }
                      })
                    }
                  />
                </label>
                <label>
                  scale
                  <input
                    type="number"
                    min="1"
                    max="2000"
                    value={selectedGardenAssetDraft.scale}
                    onChange={(event) => updateGardenAssetEditDraft({ scale: Number(event.target.value) })}
                  />
                </label>
                <label>
                  height
                  <input
                    type="number"
                    min="-50"
                    max="300"
                    value={selectedGardenAssetDraft.height}
                    onChange={(event) => updateGardenAssetEditDraft({ height: Number(event.target.value) })}
                  />
                </label>
                <label>
                  rotation
                  <input
                    type="number"
                    min="-180"
                    max="180"
                    value={selectedGardenAssetDraft.yaw}
                    onChange={(event) => updateGardenAssetEditDraft({ yaw: Number(event.target.value) })}
                  />
                </label>
                <label>
                  opacity
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedGardenAssetDraft.opacity}
                    onChange={(event) => updateGardenAssetEditDraft({ opacity: Number(event.target.value) })}
                  />
                </label>
              </div>
              <div className="map-3d-guide-decor-debug__actions">
                <button type="button" className="map-3d-guide-garden-debug__primary" onClick={saveGardenAssetEditDraft}>
                  保存当前资产修改
                </button>
                <button type="button" className="map-3d-guide-garden-debug__danger" onClick={deleteSelectedGardenAsset}>
                  删除资产点
                </button>
              </div>
            </>
          ) : (
            <p>未选中资产点。</p>
          )}

          <details className="map-3d-guide-garden-debug__advanced">
            <summary>高级设置</summary>
            <div className="map-3d-guide-decor-debug__grid">
              <label>
                zone
                <select
                  value={gardenFilters.zoneId}
                  onChange={(event) => updateGardenFilter({ zoneId: event.target.value })}
                >
                  <option value="all">全部 zone</option>
                  {lingshanMap3DGardenVegetationZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                kind
                <select
                  value={gardenFilters.kind}
                  onChange={(event) => updateGardenFilter({ kind: event.target.value })}
                >
                  <option value="all">全部 kind</option>
                  {gardenAssetKindOptions.map((kind) => (
                    <option key={kind} value={kind}>
                      {kind}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                priority
                <select
                  value={gardenFilters.priority}
                  onChange={(event) => updateGardenFilter({ priority: event.target.value })}
                >
                  <option value="all">全部 priority</option>
                  <option value="high">high</option>
                  <option value="medium">medium</option>
                  <option value="low">low</option>
                </select>
              </label>
              <label>
                visible
                <select
                  value={gardenFilters.visible}
                  onChange={(event) => updateGardenFilter({ visible: event.target.value })}
                >
                  <option value="all">全部 visible</option>
                  <option value="true">visible=true</option>
                  <option value="false">visible=false</option>
                </select>
              </label>
              <label>
                scale 乘数
                <input
                  type="number"
                  min="0.1"
                  max="5"
                  step="0.01"
                  value={gardenBatchAdjust.scaleMultiplier}
                  onChange={(event) => updateGardenBatchAdjust({ scaleMultiplier: Number(event.target.value) })}
                />
              </label>
              <label>
                height 增量
                <input
                  type="number"
                  min="-100"
                  max="100"
                  step="0.1"
                  value={gardenBatchAdjust.heightDelta}
                  onChange={(event) => updateGardenBatchAdjust({ heightDelta: Number(event.target.value) })}
                />
              </label>
              <label>
                opacity 增量
                <input
                  type="number"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={gardenBatchAdjust.opacityDelta}
                  onChange={(event) => updateGardenBatchAdjust({ opacityDelta: Number(event.target.value) })}
                />
              </label>
              <label>
                lat 偏移
                <input
                  type="number"
                  step="0.000001"
                  value={gardenBatchAdjust.latOffset}
                  onChange={(event) => updateGardenBatchAdjust({ latOffset: Number(event.target.value) })}
                />
              </label>
              <label>
                lng 偏移
                <input
                  type="number"
                  step="0.000001"
                  value={gardenBatchAdjust.lngOffset}
                  onChange={(event) => updateGardenBatchAdjust({ lngOffset: Number(event.target.value) })}
                />
              </label>
            </div>
            <div className="map-3d-guide-decor-debug__actions">
              <button type="button" onClick={selectFirstFilteredGardenAsset}>
                选中筛选首项
              </button>
              <button type="button" onClick={() => setGardenFilters({ zoneId: 'all', kind: 'all', priority: 'all', visible: 'all' })}>
                清空筛选
              </button>
              <button type="button" onClick={applyFilteredGardenScale}>
                应用缩放
              </button>
              <button type="button" onClick={applyFilteredGardenHeight}>
                应用 height
              </button>
              <button type="button" onClick={applyFilteredGardenOpacity}>
                应用 opacity
              </button>
              <button type="button" onClick={applyFilteredGardenOffset}>
                应用经纬度偏移
              </button>
              <button type="button" onClick={() => applyFilteredGardenVisibility(true)}>
                显示筛选资产
              </button>
              <button type="button" onClick={() => applyFilteredGardenVisibility(false)}>
                隐藏筛选资产
              </button>
              <button type="button" onClick={() => setForestPatchesVisible((visible) => !visible)}>
                {forestPatchesVisible ? '隐藏林地 patch' : '显示林地 patch'}
              </button>
            </div>
          </details>
        </div>
      )
    }

    return (
      <div className="map-3d-guide-garden-debug__subsection">
        <div className="map-3d-guide-garden-debug__section-head">
          <strong>第 5 步：导出配置</strong>
          <button type="button" className="map-3d-guide-garden-debug__primary" onClick={copyCompleteGardenSourceSnippet}>
            复制完整配置
          </button>
        </div>
        <div className="map-3d-guide-decor-debug__actions">
          <button type="button" onClick={copyEditorAssetsConfig}>
            仅复制 assets
          </button>
        </div>
        <div className="map-3d-guide-garden-debug__stat-row">
          <span>assets {gardenAssets.length}</span>
          <span>zones {gardenEditorState.zones.length}</span>
          <span>keepouts {gardenEditorState.keepouts.length}</span>
        </div>
        <details className="map-3d-guide-garden-debug__advanced">
          <summary>高级设置</summary>
          <div className="map-3d-guide-decor-debug__actions">
            <button type="button" onClick={saveGardenEditorStateToLocalStorage}>
              保存到本地
            </button>
            <button type="button" onClick={clearGardenLocalDraft}>
              清空本地草稿
            </button>
            <button type="button" onClick={resetGardenEditorState}>
              重置为默认航拍参考布局
            </button>
            <button type="button" onClick={copyGardenSummary}>
              复制调试摘要
            </button>
          </div>
        </details>
      </div>
    )
  }

  return (
    <section
      className="map-3d-guide-garden-debug map-3d-guide-garden-debug--editor"
      style={{
        left: gardenEditorPanelPosition.x,
        top: gardenEditorPanelPosition.y
      }}
    >
      <div
        className="map-3d-guide-decor-debug__header map-3d-guide-garden-debug__drag-handle"
        onMouseDown={(event) => {
          const target = event.target as HTMLElement
          if (target.closest('button, input, select, textarea, label, summary')) {
            return
          }
          setGardenEditorDragOffset({
            x: event.clientX - gardenEditorPanelPosition.x,
            y: event.clientY - gardenEditorPanelPosition.y
          })
        }}
      >
        <div>
          <strong>5 步园林配置工作台</strong>
          <span>
            {gardenEditorUsesStoredDraft ? 'localStorage 草稿' : '默认航拍参考布局'} · preview {gardenEditorState.previewAssets.length} · GLB {gardenModelReport.createdCount}/{gardenModelReport.visibleCount}
          </span>
        </div>
      </div>

      <div className="map-3d-guide-garden-debug__steps" aria-label="debugGarden 配置步骤">
        {gardenEditorSteps.map((step) => (
          <button
            key={step.id}
            type="button"
            className={gardenEditorStep === step.id ? 'is-active' : ''}
            onClick={() => {
              setGardenEditorStep(step.id)
              setGardenEditorMode('inspect')
              setGardenDraftPolygon(null)
            }}
          >
            {step.label}
          </button>
        ))}
      </div>

      {renderGardenObjectLists()}
      {renderGardenStepContent()}

      <small className="map-3d-guide-garden-debug__status">{gardenCopyStatus}</small>
    </section>
  )
}

function formatGardenAssetRatios(ratios: GardenAssetRatios) {
  return Object.entries(ratios)
    .map(([kind, value]) => `${kind}:${value}`)
    .join(', ')
}

function parseGardenAssetRatios(value: string, gardenAssetKindOptions: Map3DGardenAssetKind[]): GardenAssetRatios {
  return value.split(',').reduce<GardenAssetRatios>((ratios, item) => {
    const [kind, rawValue] = item.split(':').map((part) => part.trim())
    const numericValue = Number(rawValue)

    if (gardenAssetKindOptions.includes(kind as Map3DGardenAssetKind) && Number.isFinite(numericValue)) {
      ratios[kind as Map3DGardenAssetKind] = Math.max(0, numericValue)
    }

    return ratios
  }, {})
}

function getGardenAssetZoneId(asset: LingshanMap3DGardenAsset) {
  if (asset.zoneId) {
    return asset.zoneId
  }

  const match = asset.id.match(/^c-zone-(.*)-\d+$/)
  return match?.[1] ?? 'manual'
}

function clampNumber(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

export default GardenDebugWizard
