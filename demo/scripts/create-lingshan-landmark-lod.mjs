#!/usr/bin/env node
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const DEFAULT_RATIO = '0.45'
const DEFAULT_ERROR = '0.001'
const DEFAULT_TEXTURE_SIZE = '768'

const args = parseArgs(process.argv.slice(2))

if (!args.input || !args.output) {
  printUsage()
  process.exit(1)
}

const inputPath = path.resolve(args.input)
const outputPath = path.resolve(args.output)
const ratio = args.ratio ?? DEFAULT_RATIO
const error = args.error ?? DEFAULT_ERROR
const textureSize = args.textureSize ?? DEFAULT_TEXTURE_SIZE

if (!fs.existsSync(inputPath)) {
  console.error(`[lod:landmark] Missing input: ${inputPath}`)
  process.exit(1)
}

fs.mkdirSync(path.dirname(outputPath), { recursive: true })

const command = [
  '--yes',
  '@gltf-transform/cli',
  'optimize',
  inputPath,
  outputPath,
  '--compress',
  'false',
  '--texture-compress',
  'false',
  '--texture-size',
  textureSize,
  '--simplify',
  'true',
  '--simplify-ratio',
  ratio,
  '--simplify-error',
  error,
  '--simplify-lock-border',
  'true'
]

console.log('[lod:landmark] Creating non-Draco LOD GLB')
console.log(`[lod:landmark] input=${inputPath}`)
console.log(`[lod:landmark] output=${outputPath}`)
console.log(`[lod:landmark] ratio=${ratio} error=${error} textureSize=${textureSize}`)

const result = spawnSync('npx', command, {
  stdio: 'inherit'
})

if (result.status !== 0) {
  console.error('[lod:landmark] gltf-transform failed')
  process.exit(result.status ?? 1)
}

const inputSize = fs.statSync(inputPath).size
const outputSize = fs.statSync(outputPath).size
const saved = inputSize > 0 ? (1 - outputSize / inputSize) * 100 : 0

console.log(`[lod:landmark] Wrote ${outputPath}`)
console.log(`[lod:landmark] size ${formatBytes(inputSize)} -> ${formatBytes(outputSize)} (${saved.toFixed(1)}% smaller)`)
console.log('[lod:landmark] Draco/Meshopt/KTX2/WebP/AVIF runtime extensions were not requested.')

function parseArgs(rawArgs) {
  const parsed = {}
  for (const arg of rawArgs) {
    if (!arg.startsWith('--')) {
      continue
    }
    const [key, value = 'true'] = arg.slice(2).split('=')
    parsed[key] = value
  }

  return {
    input: parsed.input,
    output: parsed.output,
    ratio: parsed.ratio,
    error: parsed.error,
    textureSize: parsed['texture-size'] ?? parsed.textureSize
  }
}

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`
  }
  const mib = bytes / 1024 / 1024
  return `${mib.toFixed(2)} MiB`
}

function printUsage() {
  console.log(`Usage:
  npm run lod:landmark -- --input=public/models/lingshan/optimized/fan-gong.safe-v2.glb --output=public/models/lingshan/optimized/fan-gong.lod-far-v1.glb

Options:
  --ratio=0.45          Mesh simplification ratio. Lower is lighter.
  --error=0.001         Simplification error tolerance.
  --texture-size=768    Texture resize target.

Notes:
  This script intentionally disables Draco, Meshopt and texture runtime extensions.
  It prepares far-view LOD candidates only; runtime references must be switched after visual QA.`)
}
