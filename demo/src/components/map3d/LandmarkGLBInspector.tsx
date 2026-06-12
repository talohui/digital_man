import { useMemo, useState } from 'react'

import type {
  LandmarkCalibrationValues,
  LandmarkFootprintMaskValues,
  LandmarkInspectorItem,
  LandmarkModelInspector
} from '../../hooks/useLandmarkModelInspector'

type LandmarkGLBInspectorProps = {
  inspector: LandmarkModelInspector
}

export function LandmarkGLBInspector({ inspector }: LandmarkGLBInspectorProps) {
  const [copyStatus, setCopyStatus] = useState('')
  const activeItem = useMemo(
    () => inspector.items.find((item) => item.id === inspector.activeCalibrationId),
    [inspector.activeCalibrationId, inspector.items]
  )

  const copyItem = async (item: LandmarkInspectorItem) => {
    const ok = await copyText(JSON.stringify(item, null, 2))
    setCopyStatus(ok ? `已复制 ${item.name} 诊断 JSON` : '剪贴板不可用，复制失败')
  }

  const copyCurrentPatch = async () => {
    if (!activeItem) {
      setCopyStatus('请先选择一个地标进入校准')
      return
    }
    const patch = inspector.getCalibrationPatch(activeItem.id)
    const ok = await copyText(formatCalibrationPatch(patch))
    setCopyStatus(ok ? `已复制 ${activeItem.name} 校准 patch` : '剪贴板不可用，复制失败')
  }

  const copyAllPatches = async () => {
    const patches = inspector.getAllCalibrationPatches()
    const ok = await copyText(formatCalibrationPatchArray(patches))
    setCopyStatus(ok ? `已复制 ${patches.length} 个地标校准 patch` : '剪贴板不可用，复制失败')
  }

  const copyFootprintMaskPatch = async () => {
    if (!activeItem?.calibration.footprintMask) {
      setCopyStatus('当前地标没有 footprint mask 配置')
      return
    }
    const ok = await copyText(formatFootprintMaskPatch(activeItem))
    setCopyStatus(ok ? '已复制梵宫 footprint mask patch' : '剪贴板不可用，复制失败')
  }

  const loadedCount = inspector.items.filter((item) => item.status === 'loaded').length
  const failedCount = inspector.items.filter((item) => item.status === 'failed').length

  return (
    <section className="map-3d-guide-landmark-inspector">
      <div className="map-3d-guide-landmark-inspector__heading">
        <div>
          <h3>Landmark GLB Inspector</h3>
          <p>
            原始地标 GLB 约 1.1GB，仅用于单体加载和校准。游客端不应全量默认加载。
          </p>
          <small>
            校准草稿：{inspector.calibrationDraftCount} 个
            {inspector.usesLocalDraft ? ' · 已应用本地草稿' : ' · 暂无本地草稿'}
          </small>
        </div>
        <span>
          {loadedCount}/{inspector.items.length} loaded
          {failedCount ? ` · ${failedCount} failed` : ''}
        </span>
      </div>

      <div className="map-3d-guide-landmark-inspector__list">
        {inspector.items.map((item) => {
          const loading = item.status === 'loading'
          const loaded = item.status === 'loaded'
          const active = activeItem?.id === item.id
          const canLoad = Boolean(item.modelUrl) && !loading && !loaded
          const canUnload = loaded || item.status === 'failed' || item.status === 'loading'

          return (
            <article
              className={`map-3d-guide-landmark-inspector__item is-${item.status} ${active ? 'is-calibrating' : ''}`}
              key={item.id}
            >
              <div>
                <strong>{item.name}</strong>
                <small>
                  {statusLabel[item.status]} · {item.fileSizeLabel ?? 'size ?'} · anchor: {item.anchorId}
                  {item.hasSavedDraft ? ' · local draft' : ''}
                  {item.isDirty ? ' · unsaved' : ''}
                </small>
                <code>{item.modelUrl ?? 'modelUrl missing'}</code>
                <small>
                  scale {item.calibration.scale} · h {item.calibration.height} · rotY {item.calibration.rotationY} ·
                  offset {formatOffset(item.calibration)}
                </small>
                {item.durationMs !== undefined ? <small>耗时：{item.durationMs} ms</small> : null}
                {item.error ? <small className="is-error">{item.error}</small> : null}
                {item.poiId === 'fan_gong' ? (
                  <small className="is-warning">
                    若出现腾讯白模建筑穿插：不要全局关闭白模，也不要用异常 height/scale 硬盖。建议在
                    style1 中弱化白模视觉，并后续制作真正 3D 场地底座 / 低模场景。
                  </small>
                ) : null}
              </div>
              <div className="map-3d-guide-landmark-inspector__actions">
                <button type="button" disabled={!canLoad} onClick={() => inspector.loadLandmark(item.id)}>
                  {loading ? '加载中' : '加载'}
                </button>
                <button type="button" disabled={!canUnload} onClick={() => inspector.unloadLandmark(item.id)}>
                  卸载
                </button>
                <button type="button" onClick={() => inspector.focusLandmark(item.id)}>
                  聚焦
                </button>
                <button type="button" onClick={() => inspector.startCalibration(item.id)}>
                  校准
                </button>
                <button type="button" onClick={() => copyItem(item)}>
                  复制诊断
                </button>
              </div>
            </article>
          )
        })}
      </div>

      {activeItem ? (
        <section className="map-3d-guide-landmark-calibration">
          <div className="map-3d-guide-landmark-calibration__title">
            <div>
              <h3>地标模型校准</h3>
              <strong>{activeItem.name}</strong>
              <small>
                {activeItem.id} · {activeItem.status} · anchor {activeItem.anchorId}
              </small>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`确认重置 ${activeItem.name} 的本地校准？`)) {
                  inspector.resetCalibration(activeItem.id)
                }
              }}
            >
              重置当前模型
            </button>
          </div>
          <code>{activeItem.modelUrl ?? 'modelUrl missing'}</code>

          <div className="map-3d-guide-landmark-calibration__grid">
            <CalibrationNumberField
              label="scale"
              step={1}
              value={activeItem.calibration.scale}
              onChange={(value) => inspector.updateCalibration(activeItem.id, { scale: value })}
            />
            <CalibrationNumberField
              label="height"
              step={1}
              value={activeItem.calibration.height}
              onChange={(value) => inspector.updateCalibration(activeItem.id, { height: value })}
            />
            <CalibrationNumberField
              label="rotationY"
              step={1}
              value={activeItem.calibration.rotationY}
              onChange={(value) => inspector.updateCalibration(activeItem.id, { rotationY: value })}
            />
            <CalibrationNumberField
              label="lngOffset"
              step={0.00001}
              value={activeItem.calibration.lngOffset}
              onChange={(value) => inspector.updateCalibration(activeItem.id, { lngOffset: value })}
            />
            <CalibrationNumberField
              label="latOffset"
              step={0.00001}
              value={activeItem.calibration.latOffset}
              onChange={(value) => inspector.updateCalibration(activeItem.id, { latOffset: value })}
            />
          </div>

          <div className="map-3d-guide-landmark-calibration__quick">
            <button type="button" onClick={() => multiplyScale(inspector, activeItem, 0.5)}>
              scale × 0.5
            </button>
            <button type="button" onClick={() => multiplyScale(inspector, activeItem, 2)}>
              scale × 2
            </button>
            <button type="button" onClick={() => multiplyScale(inspector, activeItem, 5)}>
              scale × 5
            </button>
            <button type="button" onClick={() => multiplyScale(inspector, activeItem, 10)}>
              scale × 10
            </button>
            <button type="button" onClick={() => offsetCalibration(inspector, activeItem, { height: 1 })}>
              height +1
            </button>
            <button type="button" onClick={() => offsetCalibration(inspector, activeItem, { height: -1 })}>
              height -1
            </button>
            <button type="button" onClick={() => offsetCalibration(inspector, activeItem, { rotationY: 15 })}>
              rotation +15°
            </button>
            <button type="button" onClick={() => offsetCalibration(inspector, activeItem, { rotationY: -15 })}>
              rotation -15°
            </button>
          </div>

          {activeItem.poiId === 'fan_gong' && activeItem.calibration.footprintMask ? (
            <details className="map-3d-guide-landmark-calibration__section">
              <summary>高级实验：梵宫 polygon footprint mask</summary>
              <p>
                实验功能：TMap polygon footprint mask 实测容易产生贴片感，不推荐作为最终方案。梵宫白模冲突应优先通过弱化腾讯白模视觉，或后续制作真正 3D 场地底座 / 低模场景解决。
              </p>
              {activeItem.calibration.footprintMask.mode === 'solid' ? (
                <small className="is-warning">solid 是实心贴片调试模式，可能遮挡或干扰梵宫 GLB。</small>
              ) : null}
              {activeItem.calibration.footprintMask.mode === 'ring' ? (
                <small className="is-warning">ring 模式虽然避开主体，但周边 polygon 仍可能突兀，仅作为实验保留。</small>
              ) : null}
              {isInvalidRingMask(activeItem.calibration.footprintMask) ? (
                <small className="is-error">ring 参数无效：innerWidth / innerDepth 必须小于外层 width / depth。</small>
              ) : null}
              <div className="map-3d-guide-landmark-calibration__grid">
                <label>
                  <span>enabled</span>
                  <input
                    type="checkbox"
                    checked={activeItem.calibration.footprintMask.enabled}
                    onChange={(event) =>
                      inspector.updateFootprintMask(activeItem.id, { enabled: event.target.checked })}
                  />
                </label>
                <label>
                  <span>mode</span>
                  <select
                    value={activeItem.calibration.footprintMask.mode}
                    onChange={(event) =>
                      inspector.updateFootprintMask(activeItem.id, {
                        mode: event.target.value as LandmarkFootprintMaskValues['mode']
                      })}
                  >
                    <option value="none">none</option>
                    <option value="solid">solid 实验</option>
                    <option value="ring">ring 实验</option>
                  </select>
                </label>
                <CalibrationNumberField
                  label="width"
                  step={1}
                  value={activeItem.calibration.footprintMask.width}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { width: value })}
                />
                <CalibrationNumberField
                  label="depth"
                  step={1}
                  value={activeItem.calibration.footprintMask.depth}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { depth: value })}
                />
                <CalibrationNumberField
                  label="innerWidth"
                  step={1}
                  value={activeItem.calibration.footprintMask.innerWidth ?? activeItem.calibration.footprintMask.width * 0.65}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { innerWidth: value })}
                />
                <CalibrationNumberField
                  label="innerDepth"
                  step={1}
                  value={activeItem.calibration.footprintMask.innerDepth ?? activeItem.calibration.footprintMask.depth * 0.58}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { innerDepth: value })}
                />
                <CalibrationNumberField
                  label="height"
                  step={1}
                  value={activeItem.calibration.footprintMask.height}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { height: value })}
                />
                <CalibrationNumberField
                  label="mask rotationY"
                  step={1}
                  value={activeItem.calibration.footprintMask.rotationY}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { rotationY: value })}
                />
                <CalibrationNumberField
                  label="mask lngOffset"
                  step={0.00001}
                  value={activeItem.calibration.footprintMask.lngOffset}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { lngOffset: value })}
                />
                <CalibrationNumberField
                  label="mask latOffset"
                  step={0.00001}
                  value={activeItem.calibration.footprintMask.latOffset}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { latOffset: value })}
                />
                <label>
                  <span>color</span>
                  <input
                    type="text"
                    value={activeItem.calibration.footprintMask.color}
                    onChange={(event) =>
                      inspector.updateFootprintMask(activeItem.id, { color: event.target.value })}
                  />
                </label>
                <CalibrationNumberField
                  label="opacity"
                  step={0.05}
                  value={activeItem.calibration.footprintMask.opacity}
                  onChange={(value) => inspector.updateFootprintMask(activeItem.id, { opacity: value })}
                />
              </div>
              <div className="map-3d-guide-landmark-calibration__actions">
                <button type="button" onClick={() => inspector.saveCalibrationDraft(activeItem.id)}>
                  保存当前 footprint mask 到本地草稿
                </button>
                <button type="button" onClick={copyFootprintMaskPatch}>
                  复制 fan_gong footprint mask patch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('确认重置梵宫 footprint mask？')) {
                      inspector.resetFootprintMask(activeItem.id)
                    }
                  }}
                >
                  重置 fan_gong footprint mask
                </button>
              </div>
            </details>
          ) : null}

          <div className="map-3d-guide-landmark-calibration__actions">
            <button type="button" onClick={() => inspector.saveCalibrationDraft(activeItem.id)}>
              保存当前校准到本地草稿
            </button>
            <button type="button" onClick={copyCurrentPatch}>
              复制当前模型配置 patch
            </button>
            <button type="button" onClick={copyAllPatches}>
              复制全部地标校准 patch
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('确认清空全部地标校准草稿？')) {
                  inspector.clearAllCalibrationDrafts()
                }
              }}
            >
              清空全部草稿
            </button>
          </div>
          <p>
            校准仅写入 localStorage 调试草稿，不会修改源码或 POI 坐标。普通游客页不会默认应用这些草稿。
          </p>
        </section>
      ) : (
        <p className="map-3d-guide-landmark-inspector__hint">点击任一地标的“校准”进入实时调参。</p>
      )}

      {copyStatus ? <small>{copyStatus}</small> : null}
    </section>
  )
}

type CalibrationNumberFieldProps = {
  label: string
  value: number
  step: number
  onChange: (value: number) => void
}

function CalibrationNumberField({ label, value, step, onChange }: CalibrationNumberFieldProps) {
  return (
    <label>
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

const statusLabel: Record<LandmarkInspectorItem['status'], string> = {
  idle: '未加载',
  loading: '加载中',
  loaded: '已加载',
  failed: '加载失败',
  unloaded: '已卸载'
}

function multiplyScale(inspector: LandmarkModelInspector, item: LandmarkInspectorItem, factor: number) {
  inspector.updateCalibration(item.id, {
    scale: Math.max(0.01, roundCalibrationNumber(item.calibration.scale * factor))
  })
}

function offsetCalibration(
  inspector: LandmarkModelInspector,
  item: LandmarkInspectorItem,
  offset: Partial<Pick<LandmarkCalibrationValues, 'height' | 'rotationY'>>
) {
  inspector.updateCalibration(item.id, {
    height:
      offset.height !== undefined
        ? roundCalibrationNumber(item.calibration.height + offset.height)
        : item.calibration.height,
    rotationY:
      offset.rotationY !== undefined
        ? roundCalibrationNumber(item.calibration.rotationY + offset.rotationY)
        : item.calibration.rotationY
  })
}

function formatOffset(calibration: LandmarkCalibrationValues) {
  return `${calibration.lngOffset.toFixed(5)}, ${calibration.latOffset.toFixed(5)}`
}

function formatCalibrationPatch(patch: ReturnType<LandmarkModelInspector['getCalibrationPatch']>) {
  if (!patch) {
    return '// no calibration patch selected'
  }

  const footprintMask = patch.footprintMask
    ? `,
  footprintMask: {
    enabled: ${patch.footprintMask.enabled},
    mode: '${patch.footprintMask.mode}',
    width: ${patch.footprintMask.width},
    depth: ${patch.footprintMask.depth},
    innerWidth: ${patch.footprintMask.innerWidth},
    innerDepth: ${patch.footprintMask.innerDepth},
    height: ${patch.footprintMask.height},
    rotationY: ${patch.footprintMask.rotationY},
    lngOffset: ${patch.footprintMask.lngOffset},
    latOffset: ${patch.footprintMask.latOffset},
    color: '${patch.footprintMask.color}',
    opacity: ${patch.footprintMask.opacity}
  }`
    : ''

  return `{
  id: '${patch.id}',
  scale: ${patch.scale},
  height: ${patch.height},
  rotationY: ${patch.rotationY},
  lngOffset: ${patch.lngOffset},
  latOffset: ${patch.latOffset}${footprintMask}
}`
}

function formatFootprintMaskPatch(item: LandmarkInspectorItem) {
  const mask = item.calibration.footprintMask

  if (!mask) {
    return '// no footprint mask patch selected'
  }

  return `{
  id: '${item.id}',
  footprintMask: {
    enabled: ${mask.enabled},
    mode: '${mask.mode}',
    width: ${mask.width},
    depth: ${mask.depth},
    innerWidth: ${mask.innerWidth},
    innerDepth: ${mask.innerDepth},
    height: ${mask.height},
    rotationY: ${mask.rotationY},
    lngOffset: ${mask.lngOffset},
    latOffset: ${mask.latOffset},
    color: '${mask.color}',
    opacity: ${mask.opacity}
  }
}`
}

function isInvalidRingMask(mask: LandmarkFootprintMaskValues) {
  return mask.enabled && mask.mode === 'ring' && (
    (mask.innerWidth ?? 0) >= mask.width ||
    (mask.innerDepth ?? 0) >= mask.depth
  )
}

function formatCalibrationPatchArray(patches: ReturnType<LandmarkModelInspector['getAllCalibrationPatches']>) {
  if (!patches.length) {
    return '[]'
  }

  return `[
${patches.map((patch) => `  ${formatCalibrationPatch(patch).replace(/\n/g, '\n  ')}`).join(',\n')}
]`
}

function roundCalibrationNumber(value: number) {
  return Number(value.toFixed(6))
}

async function copyText(text: string) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to execCommand fallback.
  }

  try {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.setAttribute('readonly', 'true')
    textarea.style.position = 'fixed'
    textarea.style.left = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    const ok = document.execCommand('copy')
    document.body.removeChild(textarea)
    return ok
  } catch {
    return false
  }
}
