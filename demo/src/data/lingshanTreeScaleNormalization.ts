import type { LingshanMap3DGardenAsset, Map3DGardenAssetKind } from './lingshanMap3DGardenAssets'

type TreeScaleNormalizationRule = {
  assetUrl?: string
  heightOffsetByScale?: number
  minHeight?: number
  previousMaxScale?: number
  previousMinScale?: number
  scaleMultiplier: number
  rawScaleMax: number
  minScale: number
  maxScale: number
  note: string
}

const treeScaleNormalizationRules: Partial<Record<Map3DGardenAssetKind, TreeScaleNormalizationRule>> = {
  fluffy_bodhi_grove: {
    assetUrl: '/models/lingshan/tree-candidates/fluffy-bodhi-grove.runtime-v2.glb',
    heightOffsetByScale: 0.04,
    minHeight: 1.8,
    previousMaxScale: 62,
    previousMinScale: 40,
    scaleMultiplier: 62.4,
    rawScaleMax: 4,
    minScale: 48,
    maxScale: 74.4,
    note: 'fluffy_bodhi_grove Meshy runtime-v2 scale enlarged 1.2x with low grounded height normalization'
  }
}

export function normalizeLingshanTreeAssetScale<T extends LingshanMap3DGardenAsset>(asset: T): T {
  const rule = treeScaleNormalizationRules[asset.kind]

  if (!rule) {
    return asset
  }

  const normalizedScale = getNormalizedTreeScale(asset, rule)
  const normalizedHeight = getNormalizedTreeHeight(asset.height, normalizedScale, rule)
  const normalizedAssetUrl = rule.assetUrl ?? asset.assetUrl

  if (normalizedScale === asset.scale && normalizedHeight === asset.height && normalizedAssetUrl === asset.assetUrl) {
    return asset
  }

  return {
    ...asset,
    assetUrl: normalizedAssetUrl,
    height: normalizedHeight,
    scale: normalizedScale,
    note: appendScaleNormalizationNote(asset.note, rule.note, asset.scale, normalizedScale, asset.height, normalizedHeight)
  }
}

export function normalizeLingshanTreeScaleRange(
  kind: Map3DGardenAssetKind,
  scaleMin: number,
  scaleMax: number
): { scaleMin: number; scaleMax: number } {
  const rule = treeScaleNormalizationRules[kind]

  if (!rule || Math.max(scaleMin, scaleMax) > rule.rawScaleMax) {
    return { scaleMin, scaleMax }
  }

  const normalizedMin = clampTreeScale(scaleMin * rule.scaleMultiplier, rule.minScale, rule.maxScale)
  const normalizedMax = clampTreeScale(scaleMax * rule.scaleMultiplier, rule.minScale, rule.maxScale)

  return {
    scaleMin: roundTreeScale(Math.min(normalizedMin, normalizedMax)),
    scaleMax: roundTreeScale(Math.max(normalizedMin, normalizedMax))
  }
}

function getNormalizedTreeScale(asset: LingshanMap3DGardenAsset, rule: TreeScaleNormalizationRule) {
  if (asset.scale <= rule.rawScaleMax) {
    return roundTreeScale(clampTreeScale(asset.scale * rule.scaleMultiplier, rule.minScale, rule.maxScale))
  }

  const shouldMigratePreviousScale =
    !asset.note?.includes('scaleNormalizedV3=') &&
    rule.previousMinScale !== undefined &&
    rule.previousMaxScale !== undefined &&
    asset.scale >= rule.previousMinScale &&
    asset.scale <= rule.previousMaxScale

  if (shouldMigratePreviousScale) {
    return roundTreeScale(clampTreeScale(asset.scale * 1.2, rule.minScale, rule.maxScale))
  }

  return roundTreeScale(asset.scale)
}

function getNormalizedTreeHeight(height: number, normalizedScale: number, rule: TreeScaleNormalizationRule) {
  if (!rule.heightOffsetByScale) {
    return roundTreeScale(height)
  }

  const targetHeight = normalizedScale * rule.heightOffsetByScale

  if (height >= targetHeight * 0.85 && height <= targetHeight * 1.35) {
    return roundTreeScale(height)
  }

  return roundTreeScale(targetHeight)
}

function appendScaleNormalizationNote(
  note: string | undefined,
  ruleNote: string,
  fromScale: number,
  toScale: number,
  fromHeight: number,
  toHeight: number
) {
  const parts: string[] = []

  if (!note?.includes('scaleNormalizedV3=') && fromScale !== toScale) {
    parts.push(`scaleNormalizedV3=${roundTreeScale(fromScale)}->${roundTreeScale(toScale)}`)
  }

  if (!note?.includes('heightNormalizedV4=') && fromHeight !== toHeight) {
    parts.push(`heightNormalizedV4=${roundTreeScale(fromHeight)}->${roundTreeScale(toHeight)}`)
  }

  if (!parts.length) {
    return note
  }

  const suffix = `${parts.join('; ')}; ${ruleNote}.`
  return note ? `${note} ${suffix}` : suffix
}

function clampTreeScale(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}

function roundTreeScale(value: number) {
  return Number(value.toFixed(2))
}
