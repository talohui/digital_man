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
type GardenAssetSourceMode = 'manual' | 'legacy'

type TreeCandidateType =
  | 'fluffy_bodhi_grove'
  | 'fluffy_round_tree'
  | 'fluffy_tree_mix'
  | 'bushy_canopy_tree'
  | 'dense_shrub_cluster'
  | 'soft_forest_clump'
type TreeCandidateClusterMode = 'single' | 'smallCluster' | 'mediumCluster' | 'backgroundGrove'
type TreeCandidateLabClickMode = 'idle' | 'addCluster' | 'compareSet'

type TreeCandidateLabParams = {
  count: number
  radiusMeters: number
  minDistanceMeters: number
  scaleMin: number
  scaleMax: number
  heightOffset: number
  randomSeed: number
}

type TreeCandidateLabState = {
  selectedCandidateType: TreeCandidateType
  clusterMode: TreeCandidateClusterMode
  params: TreeCandidateLabParams
  testTrees: LingshanMap3DGardenAsset[]
  defaultGardenHidden: boolean
  landmarkReferenceLoaded: boolean
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
  clearTreeCandidateDraft: () => void
  clearTreeCandidateTestTrees: () => void
  copyCompleteGardenSourceSnippet: () => void
  copyEditorAssetsConfig: () => void
  copyGardenSummary: () => void
  copyTreeCandidateAssets: () => void
  defaultGardenHidden: boolean
  deleteSelectedEditorZone: () => void
  deleteSelectedGardenAsset: () => void
  deleteSelectedKeepoutZone: () => void
  deleteSelectedTreeCandidate: () => void
  deleteSelectedTreeCandidateCluster: () => void
  editorAddAssetKind: Map3DGardenAssetKind
  filteredGardenAssets: LingshanMap3DGardenAsset[]
  finishDraftGardenPolygon: () => void
  forestPatchesVisible: boolean
  gardenAssetEditDraft: LingshanMap3DGardenAsset | null
  gardenAssetKindOptions: Map3DGardenAssetKind[]
  gardenAssetSourceMode: GardenAssetSourceMode
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
  landmarkReferenceLoaded: boolean
  liveDefaultGardenOverlayCount: number
  liveTestTreeOverlayCount: number
  loadCoreLandmarkReferences: () => void
  resetGardenEditorState: () => void
  saveGardenAssetEditDraft: () => void
  saveGardenEditorStateToLocalStorage: () => void
  saveTreeCandidateDraft: () => void
  selectedEditorZone?: GardenEditorVegetationZone
  selectedEditorZoneId: string
  selectedGardenAsset?: LingshanMap3DGardenAsset
  selectedGardenAssetDraft?: LingshanMap3DGardenAsset
  selectedGardenId: string
  selectedGardenVertexId: string
  selectedKeepoutZone?: GardenEditorKeepoutZone
  selectedKeepoutZoneId: string
  selectedTreeCandidateAsset?: LingshanMap3DGardenAsset
  selectedTreeCandidateId: string
  selectEditorZone: (zoneId: string) => void
  selectGardenAssetForEditing: (assetId: string) => void
  selectKeepoutZone: (zoneId: string) => void
  selectFirstFilteredGardenAsset: () => void
  setDefaultGardenHidden: (hidden: boolean) => void
  setEditorAddAssetKind: Dispatch<SetStateAction<Map3DGardenAssetKind>>
  setForestPatchesVisible: Dispatch<SetStateAction<boolean>>
  setGardenAssetSource: (mode: GardenAssetSourceMode) => void
  setGardenDraftPolygon: Dispatch<SetStateAction<GardenDraftPolygon>>
  setGardenEditorMode: Dispatch<SetStateAction<GardenEditorMode>>
  setGardenFilters: Dispatch<SetStateAction<GardenAssetFilterState>>
  setSelectedTreeCandidateId: Dispatch<SetStateAction<string>>
  setTreeCandidateClusterMode: (mode: TreeCandidateClusterMode) => void
  startAddTreeCandidateCluster: () => void
  startCompareTreeCandidates: () => void
  treeCandidateClusterLabels: Record<TreeCandidateClusterMode, string>
  treeCandidateDescriptions: Record<TreeCandidateType, string>
  treeCandidateLabClickMode: TreeCandidateLabClickMode
  treeCandidateLabState: TreeCandidateLabState
  treeCandidateLabels: Record<TreeCandidateType, string>
  treeCandidateLegacyTypes: TreeCandidateType[]
  treeCandidateRecommendedModes: Record<TreeCandidateType, TreeCandidateClusterMode[]>
  treeCandidateRecommendedTypes: TreeCandidateType[]
  treeCandidateTypes: TreeCandidateType[]
  unloadCoreLandmarkReferences: () => void
  updateGardenAssetEditDraft: (patch: Partial<LingshanMap3DGardenAsset>) => void
  updateGardenBatchAdjust: (patch: Partial<GardenBatchAdjustState>) => void
  updateGardenFilter: (patch: Partial<GardenAssetFilterState>) => void
  updateSelectedTreeCandidateAsset: (patch: Partial<LingshanMap3DGardenAsset>) => void
  updateTreeCandidateLab: (patch: Partial<TreeCandidateLabState>) => void
  updateTreeCandidateLabParams: (patch: Partial<TreeCandidateLabParams>) => void
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
  clearTreeCandidateDraft,
  clearTreeCandidateTestTrees,
  copyCompleteGardenSourceSnippet,
  copyEditorAssetsConfig,
  copyGardenSummary,
  copyTreeCandidateAssets,
  defaultGardenHidden,
  deleteSelectedEditorZone,
  deleteSelectedGardenAsset,
  deleteSelectedKeepoutZone,
  deleteSelectedTreeCandidate,
  deleteSelectedTreeCandidateCluster,
  editorAddAssetKind,
  filteredGardenAssets,
  finishDraftGardenPolygon,
  forestPatchesVisible,
  gardenAssetKindOptions,
  gardenAssetSourceMode,
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
  landmarkReferenceLoaded,
  liveDefaultGardenOverlayCount,
  liveTestTreeOverlayCount,
  loadCoreLandmarkReferences,
  resetGardenEditorState,
  saveGardenAssetEditDraft,
  saveGardenEditorStateToLocalStorage,
  saveTreeCandidateDraft,
  selectedEditorZone,
  selectedEditorZoneId,
  selectedGardenAssetDraft,
  selectedGardenId,
  selectedGardenVertexId,
  selectedKeepoutZone,
  selectedKeepoutZoneId,
  selectedTreeCandidateAsset,
  selectedTreeCandidateId,
  selectEditorZone,
  selectGardenAssetForEditing,
  selectFirstFilteredGardenAsset,
  selectKeepoutZone,
  setDefaultGardenHidden,
  setEditorAddAssetKind,
  setForestPatchesVisible,
  setGardenAssetSource,
  setGardenDraftPolygon,
  setGardenEditorMode,
  setGardenFilters,
  setSelectedTreeCandidateId,
  setTreeCandidateClusterMode,
  startAddTreeCandidateCluster,
  startCompareTreeCandidates,
  treeCandidateClusterLabels,
  treeCandidateDescriptions,
  treeCandidateLabClickMode,
  treeCandidateLabState,
  treeCandidateLabels,
  treeCandidateLegacyTypes,
  treeCandidateRecommendedModes,
  treeCandidateRecommendedTypes,
  treeCandidateTypes,
  unloadCoreLandmarkReferences,
  updateGardenAssetEditDraft,
  updateGardenBatchAdjust,
  updateGardenFilter,
  updateSelectedTreeCandidateAsset,
  updateTreeCandidateLab,
  updateTreeCandidateLabParams,
  updateSelectedEditorZone,
  updateSelectedKeepoutZone
}: GardenDebugWizardProps) {
  const [gardenEditorStep, setGardenEditorStep] = useState<GardenEditorStep>('keepout')
  const [gardenEditorPanelPosition, setGardenEditorPanelPosition] = useState<GardenEditorPanelPosition>({ x: 18, y: 76 })
  const [gardenEditorDragOffset, setGardenEditorDragOffset] = useState<GardenEditorPanelPosition | null>(null)
  const selectedTreeCandidateDescription = treeCandidateDescriptions[treeCandidateLabState.selectedCandidateType]
  const selectedTreeCandidateModeLabels = treeCandidateRecommendedModes[treeCandidateLabState.selectedCandidateType]
    .map((mode) => treeCandidateClusterLabels[mode])
    .join(' / ')

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
          <strong>园林试验场</strong>
          <span>
            手动摆树 · {gardenEditorUsesStoredDraft ? 'localStorage 草稿' : '默认航拍参考布局'} · preview {gardenEditorState.previewAssets.length} · GLB {gardenModelReport.createdCount}/{gardenModelReport.visibleCount}
          </span>
        </div>
      </div>

      <details className="map-3d-guide-garden-debug__advanced" open>
        <summary>树群候选试验场</summary>
        <div className="map-3d-guide-garden-debug__stat-row">
          <span>{defaultGardenHidden ? '默认树群隐藏' : '默认树群显示'}</span>
          <span>{landmarkReferenceLoaded ? '核心地标参照已加载' : '核心地标参照未加载'}</span>
          <span>测试树 {treeCandidateLabState.testTrees.length}</span>
          <span>live 默认 {liveDefaultGardenOverlayCount}</span>
          <span>live 测试 {liveTestTreeOverlayCount}</span>
          <span>{treeCandidateLabClickMode === 'addCluster' ? '点击地图添加' : `点击模式 ${treeCandidateLabClickMode}`}</span>
        </div>

        <div className="map-3d-guide-decor-debug__grid">
          <label>
            候选树种
            <select
              value={treeCandidateLabState.selectedCandidateType}
              onChange={(event) => updateTreeCandidateLab({ selectedCandidateType: event.target.value as TreeCandidateType })}
            >
              <optgroup label="推荐候选">
                {treeCandidateRecommendedTypes.map((type) => (
                  <option key={type} value={type}>
                    {treeCandidateLabels[type]}
                  </option>
                ))}
              </optgroup>
              <optgroup label="旧候选 / legacy">
                {treeCandidateLegacyTypes.map((type) => (
                  <option key={type} value={type}>
                    {treeCandidateLabels[type]}
                  </option>
                ))}
              </optgroup>
            </select>
          </label>
          <small>
            {selectedTreeCandidateDescription} · 推荐模式 {selectedTreeCandidateModeLabels}
          </small>
          <label>
            林团模式
            <select
              value={treeCandidateLabState.clusterMode}
              onChange={(event) => setTreeCandidateClusterMode(event.target.value as TreeCandidateClusterMode)}
            >
              {Object.entries(treeCandidateClusterLabels).map(([mode, label]) => (
                <option key={mode} value={mode}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            选中测试树
            <select value={selectedTreeCandidateId} onChange={(event) => setSelectedTreeCandidateId(event.target.value)}>
              <option value="">未选择</option>
              {treeCandidateLabState.testTrees.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {selectedTreeCandidateAsset ? (
          <div className="map-3d-guide-garden-debug__subsection">
            <div className="map-3d-guide-garden-debug__section-head">
              <strong>选中树编辑</strong>
              <span>{selectedTreeCandidateAsset.name}</span>
            </div>
            <div className="map-3d-guide-decor-debug__grid">
              <label>
                纬度
                <input
                  type="number"
                  step="0.000001"
                  value={selectedTreeCandidateAsset.location.lat}
                  onChange={(event) =>
                    updateSelectedTreeCandidateAsset({
                      location: {
                        ...selectedTreeCandidateAsset.location,
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
                  value={selectedTreeCandidateAsset.location.lng}
                  onChange={(event) =>
                    updateSelectedTreeCandidateAsset({
                      location: {
                        ...selectedTreeCandidateAsset.location,
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
                  min="0.1"
                  max="2000"
                  step="0.01"
                  value={selectedTreeCandidateAsset.scale}
                  onChange={(event) => updateSelectedTreeCandidateAsset({ scale: Number(event.target.value) })}
                />
              </label>
              <label>
                height
                <input
                  type="number"
                  min="-50"
                  max="300"
                  step="0.1"
                  value={selectedTreeCandidateAsset.height}
                  onChange={(event) => updateSelectedTreeCandidateAsset({ height: Number(event.target.value) })}
                />
              </label>
              <label>
                rotationY
                <input
                  type="number"
                  min="-180"
                  max="180"
                  step="1"
                  value={selectedTreeCandidateAsset.yaw}
                  onChange={(event) => updateSelectedTreeCandidateAsset({ yaw: Number(event.target.value) })}
                />
              </label>
            </div>
          </div>
        ) : null}

        <div className="map-3d-guide-decor-debug__actions">
          <button type="button" className="map-3d-guide-garden-debug__primary" onClick={startAddTreeCandidateCluster}>
            {treeCandidateLabClickMode === 'addCluster' ? '正在点击地图添加' : '点击地图添加'}
          </button>
          <button type="button" onClick={copyTreeCandidateAssets}>
            复制测试树 assets
          </button>
          <button type="button" onClick={saveTreeCandidateDraft}>
            保存测试草稿
          </button>
          <button type="button" className="map-3d-guide-garden-debug__danger" onClick={deleteSelectedTreeCandidate} disabled={!selectedTreeCandidateId}>
            删除选中测试树
          </button>
          <button type="button" className="map-3d-guide-garden-debug__danger" onClick={deleteSelectedTreeCandidateCluster} disabled={!selectedTreeCandidateId}>
            删除选中树团
          </button>
          <button type="button" className="map-3d-guide-garden-debug__danger" onClick={clearTreeCandidateTestTrees} disabled={!treeCandidateLabState.testTrees.length}>
            清空测试树
          </button>
        </div>

        <details className="map-3d-guide-garden-debug__advanced">
          <summary>高级：树团参数 / 候选对比</summary>
          <div className="map-3d-guide-decor-debug__grid">
            <label>
              默认树群来源
              <select value={gardenAssetSourceMode} onChange={(event) => setGardenAssetSource(event.target.value as GardenAssetSourceMode)}>
                <option value="manual">新手动树群 869 assets</option>
                <option value="legacy">legacy 旧 199 树群</option>
              </select>
            </label>
            <label>
              count
              <input
                type="number"
                min="1"
                max="40"
                value={treeCandidateLabState.params.count}
                onChange={(event) => updateTreeCandidateLabParams({ count: Number(event.target.value) })}
              />
            </label>
            <label>
              radiusMeters
              <input
                type="number"
                min="0"
                max="90"
                step="1"
                value={treeCandidateLabState.params.radiusMeters}
                onChange={(event) => updateTreeCandidateLabParams({ radiusMeters: Number(event.target.value) })}
              />
            </label>
            <label>
              minDistanceMeters
              <input
                type="number"
                min="0"
                max="28"
                step="1"
                value={treeCandidateLabState.params.minDistanceMeters}
                onChange={(event) => updateTreeCandidateLabParams({ minDistanceMeters: Number(event.target.value) })}
              />
            </label>
            <label>
              scaleMin
              <input
                type="number"
                min="0.1"
                max="220"
                step="0.01"
                value={treeCandidateLabState.params.scaleMin}
                onChange={(event) => updateTreeCandidateLabParams({ scaleMin: Number(event.target.value) })}
              />
            </label>
            <label>
              scaleMax
              <input
                type="number"
                min="0.1"
                max="240"
                step="0.01"
                value={treeCandidateLabState.params.scaleMax}
                onChange={(event) => updateTreeCandidateLabParams({ scaleMax: Number(event.target.value) })}
              />
            </label>
            <label>
              heightOffset
              <input
                type="number"
                min="-5"
                max="16"
                step="0.1"
                value={treeCandidateLabState.params.heightOffset}
                onChange={(event) => updateTreeCandidateLabParams({ heightOffset: Number(event.target.value) })}
              />
            </label>
            <label>
              randomSeed
              <input
                type="number"
                min="1"
                max="999999"
                step="1"
                value={treeCandidateLabState.params.randomSeed}
                onChange={(event) => updateTreeCandidateLabParams({ randomSeed: Number(event.target.value) })}
              />
            </label>
          </div>
          <div className="map-3d-guide-decor-debug__actions">
            <button type="button" className="map-3d-guide-garden-debug__primary" onClick={startCompareTreeCandidates}>
              一键生成 {treeCandidateTypes.length} 种候选对比
            </button>
            <button type="button" onClick={() => setDefaultGardenHidden(!defaultGardenHidden)}>
              {defaultGardenHidden ? '显示默认树群' : '隐藏默认树群'}
            </button>
            <button type="button" onClick={landmarkReferenceLoaded ? unloadCoreLandmarkReferences : loadCoreLandmarkReferences}>
              {landmarkReferenceLoaded ? '卸载核心地标参照' : '加载核心地标参照'}
            </button>
            <button type="button" className="map-3d-guide-garden-debug__danger" onClick={clearTreeCandidateDraft}>
              清空测试草稿
            </button>
          </div>
        </details>
      </details>

      <details className="map-3d-guide-garden-debug__advanced">
        <summary>高级：区域生成 / 禁放区 / 5 步工作台</summary>
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
      </details>

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
