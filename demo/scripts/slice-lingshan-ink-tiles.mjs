import { spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const sourceName = readSourceName()
const tilesRoot = path.join(projectRoot, 'public/map/ink/tiles')
const sourceConfigs = {
  v3: {
    sourcePath: path.join(projectRoot, 'public/map/ink/lingshan-ink-map-v3.png'),
    sourceUrl: '/map/ink/lingshan-ink-map-v3.png'
  }
}
const variantName = readVariantName(sourceName)
const transformOptions = readTransformOptions()
const sourceConfig = sourceConfigs[sourceName]
const sourcePath = sourceConfig.sourcePath
const outputDir = path.join(tilesRoot, variantName)
const emptyTilePath = path.join(tilesRoot, 'empty.png')
const tileUrlTemplate = `/map/ink/tiles/${variantName}/{z}/{x}/{y}.png`
const blankTileUrl = '/map/ink/tiles/empty.png'
const boundsPath = path.join(projectRoot, 'src/data/lingshanInkMapBounds.ts')
const zoomLevels = [15, 16, 17, 18, 19, 20]
const tileSize = 256
const expectedSize = 4096

if (!existsSync(sourcePath)) {
  console.error(`[slice:ink-map] Missing source image: ${sourcePath}`)
  process.exit(1)
}

const bounds = readInkBounds(boundsPath)
const tempDir = mkdtempSync(path.join(tmpdir(), 'lingshan-ink-tiles-'))
const swiftPath = path.join(tempDir, 'slice-lingshan-ink-tiles.swift')
const configPath = path.join(tempDir, 'config.json')

rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

writeFileSync(
  configPath,
  JSON.stringify(
    {
      sourcePath,
      sourceUrl: sourceConfig.sourceUrl,
      sourceName,
      variantName,
      outputDir,
      emptyTilePath,
      tileUrlTemplate,
      blankTileUrl,
      sourceTransform: formatTransformLabel(transformOptions),
      ...transformOptions,
      bounds,
      zoomLevels,
      tileSize,
      expectedSize
    },
    null,
    2
  )
)

writeFileSync(swiftPath, swiftTileSlicerSource())

const swiftArgs = getSwiftArgs(swiftPath, configPath)
const result = spawnSync('/usr/bin/swift', swiftArgs, {
  cwd: projectRoot,
  stdio: 'inherit',
  env: {
    ...process.env,
    SWIFT_MODULE_CACHE_PATH: path.join(tempDir, 'swift-module-cache'),
    CLANG_MODULE_CACHE_PATH: path.join(tempDir, 'clang-module-cache')
  }
})

rmSync(tempDir, { recursive: true, force: true })

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

function readInkBounds(filePath) {
  const source = readFileSync(filePath, 'utf8')
  const corners = ['northWest', 'northEast', 'southEast', 'southWest']
  const bounds = {}

  for (const corner of corners) {
    const pattern = new RegExp(`${corner}:\\s*\\{\\s*lat:\\s*([-0-9.]+),\\s*lng:\\s*([-0-9.]+)\\s*\\}`)
    const match = source.match(pattern)

    if (!match) {
      throw new Error(`[slice:ink-map] Unable to read ${corner} from ${filePath}`)
    }

    bounds[corner] = {
      lat: Number(match[1]),
      lng: Number(match[2])
    }
  }

  return bounds
}

function readSourceName() {
  const rawSource = process.argv.find((arg) => arg.startsWith('--source='))?.split('=')[1] ?? 'v3'

  if (rawSource === 'v3') {
    return rawSource
  }

  console.error(`[slice:ink-map] Unknown source "${rawSource}". Use --source=v3.`)
  process.exit(1)
}

function readVariantName(sourceName) {
  const rawVariant = process.argv.find((arg) => arg.startsWith('--variant='))?.split('=')[1] ?? sourceName

  if (/^[a-z0-9-]+$/.test(rawVariant)) {
    return rawVariant
  }

  console.error(`[slice:ink-map] Invalid variant "${rawVariant}". Use lowercase kebab-case, for example --variant=v3-rotate-90.`)
  process.exit(1)
}

function readTransformOptions() {
  const rotateRaw = process.argv.find((arg) => arg.startsWith('--rotate='))?.split('=')[1] ?? '0'
  const rotate = Number(rotateRaw)

  if (![0, 90, 180, 270].includes(rotate)) {
    console.error(`[slice:ink-map] Invalid rotate "${rotateRaw}". Use --rotate=0, 90, 180, or 270.`)
    process.exit(1)
  }

  return {
    flipX: process.argv.includes('--flipX'),
    flipY: process.argv.includes('--flipY'),
    rotate
  }
}

function formatTransformLabel({ flipX, flipY, rotate }) {
  const parts = []

  if (rotate) {
    parts.push(`rotate-${rotate}`)
  }
  if (flipX) {
    parts.push('flipX')
  }
  if (flipY) {
    parts.push('flipY')
  }

  return parts.length ? parts.join('+') : 'identity'
}

function getSwiftArgs(swiftPath, configPath) {
  const sdkCandidates = [
    '/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk',
    '/Library/Developer/CommandLineTools/SDKs/MacOSX15.sdk'
  ]
  const sdkPath = sdkCandidates.find((candidate) => existsSync(candidate))

  return sdkPath ? ['-sdk', sdkPath, swiftPath, configPath] : [swiftPath, configPath]
}

function swiftTileSlicerSource() {
  return String.raw`
import Foundation
import CoreGraphics
import ImageIO

struct LatLng: Codable {
  let lat: Double
  let lng: Double
}

struct InkBounds: Codable {
  let northWest: LatLng
  let northEast: LatLng
  let southEast: LatLng
  let southWest: LatLng
}

struct Config: Codable {
  let sourcePath: String
  let sourceUrl: String
  let sourceName: String
  let variantName: String
  let outputDir: String
  let emptyTilePath: String
  let tileUrlTemplate: String
  let blankTileUrl: String
  let sourceTransform: String
  let flipX: Bool
  let flipY: Bool
  let rotate: Int
  let bounds: InkBounds
  let zoomLevels: [Int]
  let tileSize: Int
  let expectedSize: Int
}

struct WorldPoint {
  let x: Double
  let y: Double
}

struct TileStats {
  let zoom: Int
  var count: Int
  let xRange: ClosedRange<Int>
  let yRange: ClosedRange<Int>
}

let configUrl = URL(fileURLWithPath: CommandLine.arguments[1])
let configData = try Data(contentsOf: configUrl)
let config = try JSONDecoder().decode(Config.self, from: configData)

guard let imageSource = CGImageSourceCreateWithURL(URL(fileURLWithPath: config.sourcePath) as CFURL, nil),
      let sourceImage = CGImageSourceCreateImageAtIndex(imageSource, 0, nil) else {
  fputs("[slice:ink-map] Failed to read source image: \(config.sourcePath)\n", stderr)
  exit(1)
}

let imageWidth = sourceImage.width
let imageHeight = sourceImage.height

if imageWidth != imageHeight {
  fputs("[slice:ink-map] Source image must be square. Actual: \(imageWidth)x\(imageHeight)\n", stderr)
  exit(1)
}

if imageWidth != config.expectedSize || imageHeight != config.expectedSize {
  print("[slice:ink-map] WARNING: source image is \(imageWidth)x\(imageHeight), not \(config.expectedSize)x\(config.expectedSize). Continue for v3 engineering validation; close zoom may be softer.")
}

let fileManager = FileManager.default
try fileManager.createDirectory(atPath: config.outputDir, withIntermediateDirectories: true)

let colorSpace = CGColorSpaceCreateDeviceRGB()
let pngType = "public.png" as CFString
let tileSize = config.tileSize
try fileManager.createDirectory(atPath: URL(fileURLWithPath: config.emptyTilePath).deletingLastPathComponent().path, withIntermediateDirectories: true)
try writeTransparentTile(to: config.emptyTilePath, tileSize: tileSize, colorSpace: colorSpace, pngType: pngType)
let sourcePixels = try readSourcePixels(sourceImage, width: imageWidth, height: imageHeight, colorSpace: colorSpace)

var allStats: [TileStats] = []

for zoom in config.zoomLevels {
  let worldBounds = mercatorWorldBounds(config.bounds, zoom: zoom, tileSize: tileSize)
  let xMin = Int(floor(worldBounds.minX / Double(tileSize)))
  let xMax = Int(floor((worldBounds.maxX - 0.000001) / Double(tileSize)))
  let yMin = Int(floor(worldBounds.minY / Double(tileSize)))
  let yMax = Int(floor((worldBounds.maxY - 0.000001) / Double(tileSize)))
  let xRange = xMin...xMax
  let yRange = yMin...yMax
  var count = 0

  for x in xRange {
    for y in yRange {
      let tilePath = URL(fileURLWithPath: config.outputDir)
        .appendingPathComponent(String(zoom))
        .appendingPathComponent(String(x))
        .appendingPathComponent("\(y).png")
        .path
      try fileManager.createDirectory(atPath: URL(fileURLWithPath: tilePath).deletingLastPathComponent().path, withIntermediateDirectories: true)
      try renderTile(
        sourcePixels: sourcePixels,
        sourceWidth: imageWidth,
        sourceHeight: imageHeight,
        worldBounds: worldBounds,
        zoom: zoom,
        x: x,
        y: y,
        tileSize: tileSize,
        colorSpace: colorSpace,
        pngType: pngType,
        flipX: config.flipX,
        flipY: config.flipY,
        rotate: config.rotate,
        outputPath: tilePath
      )
      count += 1
    }
  }

  allStats.append(TileStats(zoom: zoom, count: count, xRange: xRange, yRange: yRange))
}

let manifest: [String: Any] = [
  "source": config.sourceUrl,
  "sourceName": config.sourceName,
  "variant": config.variantName,
  "tileUrlTemplate": config.tileUrlTemplate,
  "blankTileUrl": config.blankTileUrl,
  "sourceTransform": config.sourceTransform,
  "flipX": config.flipX,
  "flipY": config.flipY,
  "rotate": config.rotate,
  "tileSize": tileSize,
  "sourceWidth": imageWidth,
  "sourceHeight": imageHeight,
  "zoomLevels": config.zoomLevels,
  "bounds": [
    "northWest": ["lat": config.bounds.northWest.lat, "lng": config.bounds.northWest.lng],
    "northEast": ["lat": config.bounds.northEast.lat, "lng": config.bounds.northEast.lng],
    "southEast": ["lat": config.bounds.southEast.lat, "lng": config.bounds.southEast.lng],
    "southWest": ["lat": config.bounds.southWest.lat, "lng": config.bounds.southWest.lng]
  ],
  "ranges": allStats.reduce(into: [String: Any]()) { result, stat in
    result[String(stat.zoom)] = [
      "xMin": stat.xRange.lowerBound,
      "xMax": stat.xRange.upperBound,
      "yMin": stat.yRange.lowerBound,
      "yMax": stat.yRange.upperBound,
      "count": stat.count
    ]
  }
]
let manifestData = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try manifestData.write(to: URL(fileURLWithPath: config.outputDir).appendingPathComponent("manifest.json"))

print("[slice:ink-map] Wrote tiles to \(config.outputDir)")
print("[slice:ink-map] Source transform: \(config.sourceTransform)")
for stat in allStats {
  print("[slice:ink-map] z\(stat.zoom): \(stat.count) tiles, x \(stat.xRange.lowerBound)-\(stat.xRange.upperBound), y \(stat.yRange.lowerBound)-\(stat.yRange.upperBound)")
}
print("[slice:ink-map] Wrote transparent fallback tile and manifest.json")

func renderTile(
  sourcePixels: [UInt8],
  sourceWidth: Int,
  sourceHeight: Int,
  worldBounds: (minX: Double, minY: Double, maxX: Double, maxY: Double),
  zoom: Int,
  x: Int,
  y: Int,
  tileSize: Int,
  colorSpace: CGColorSpace,
  pngType: CFString,
  flipX: Bool,
  flipY: Bool,
  rotate: Int,
  outputPath: String
) throws {
  let boundsWidth = worldBounds.maxX - worldBounds.minX
  let boundsHeight = worldBounds.maxY - worldBounds.minY
  let tileWorldMinX = Double(x * tileSize)
  let tileWorldMinY = Double(y * tileSize)
  var tilePixels = [UInt8](repeating: 0, count: tileSize * tileSize * 4)

  if boundsWidth > 0 && boundsHeight > 0 {
    for py in 0..<tileSize {
      for px in 0..<tileSize {
        let worldX = tileWorldMinX + Double(px) + 0.5
        let worldY = tileWorldMinY + Double(py) + 0.5

        if worldX < worldBounds.minX || worldX >= worldBounds.maxX || worldY < worldBounds.minY || worldY >= worldBounds.maxY {
          continue
        }

        let sourceX = (worldX - worldBounds.minX) / boundsWidth * Double(sourceWidth)
        let sourceY = (worldY - worldBounds.minY) / boundsHeight * Double(sourceHeight)
        let transformedSource = transformSourceCoord(
          x: sourceX,
          y: sourceY,
          width: sourceWidth,
          height: sourceHeight,
          flipX: flipX,
          flipY: flipY,
          rotate: rotate
        )
        let color = sampleBilinear(
          sourcePixels,
          width: sourceWidth,
          height: sourceHeight,
          x: transformedSource.x,
          y: transformedSource.y
        )
        let offset = (py * tileSize + px) * 4
        tilePixels[offset] = color.0
        tilePixels[offset + 1] = color.1
        tilePixels[offset + 2] = color.2
        tilePixels[offset + 3] = color.3
      }
    }
  }

  try writeRgbaPng(tilePixels, width: tileSize, height: tileSize, colorSpace: colorSpace, pngType: pngType, outputPath: outputPath)
}

func transformSourceCoord(
  x: Double,
  y: Double,
  width: Int,
  height: Int,
  flipX: Bool,
  flipY: Bool,
  rotate: Int
) -> (x: Double, y: Double) {
  let maxX = Double(width - 1)
  let maxY = Double(height - 1)
  var tx = x
  var ty = y

  if flipX {
    tx = maxX - tx
  }
  if flipY {
    ty = maxY - ty
  }

  if rotate == 180 {
    tx = maxX - tx
    ty = maxY - ty
  } else if rotate == 90 {
    let oldX = tx
    tx = maxX - ty
    ty = oldX
  } else if rotate == 270 {
    let oldX = tx
    tx = ty
    ty = maxY - oldX
  }

  return (x: tx, y: ty)
}

func writeTransparentTile(to path: String, tileSize: Int, colorSpace: CGColorSpace, pngType: CFString) throws {
  let pixels = [UInt8](repeating: 0, count: tileSize * tileSize * 4)
  try writeRgbaPng(pixels, width: tileSize, height: tileSize, colorSpace: colorSpace, pngType: pngType, outputPath: path)
}

func readSourcePixels(_ sourceImage: CGImage, width: Int, height: Int, colorSpace: CGColorSpace) throws -> [UInt8] {
  var pixels = [UInt8](repeating: 0, count: width * height * 4)
  guard let context = CGContext(
    data: &pixels,
    width: width,
    height: height,
    bitsPerComponent: 8,
    bytesPerRow: width * 4,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue
  ) else {
    throw NSError(domain: "InkTileSlicer", code: 30, userInfo: [NSLocalizedDescriptionKey: "Unable to create source CGContext"])
  }

  context.clear(CGRect(x: 0, y: 0, width: width, height: height))
  context.translateBy(x: 0, y: CGFloat(height))
  context.scaleBy(x: 1, y: -1)
  context.draw(sourceImage, in: CGRect(x: 0, y: 0, width: width, height: height))

  return pixels
}

func sampleBilinear(_ pixels: [UInt8], width: Int, height: Int, x: Double, y: Double) -> (UInt8, UInt8, UInt8, UInt8) {
  let clampedX = min(Double(width - 1), max(0, x))
  let clampedY = min(Double(height - 1), max(0, y))
  let x0 = Int(floor(clampedX))
  let y0 = Int(floor(clampedY))
  let x1 = min(width - 1, x0 + 1)
  let y1 = min(height - 1, y0 + 1)
  let tx = clampedX - Double(x0)
  let ty = clampedY - Double(y0)

  func channel(_ px: Int, _ py: Int, _ channel: Int) -> Double {
    return Double(pixels[(py * width + px) * 4 + channel])
  }

  func mix(_ channelIndex: Int) -> UInt8 {
    let top = channel(x0, y0, channelIndex) * (1 - tx) + channel(x1, y0, channelIndex) * tx
    let bottom = channel(x0, y1, channelIndex) * (1 - tx) + channel(x1, y1, channelIndex) * tx
    let value = top * (1 - ty) + bottom * ty
    return UInt8(min(255, max(0, round(value))))
  }

  return (mix(0), mix(1), mix(2), mix(3))
}

func writeRgbaPng(_ pixels: [UInt8], width: Int, height: Int, colorSpace: CGColorSpace, pngType: CFString, outputPath: String) throws {
  let data = Data(pixels)
  guard let provider = CGDataProvider(data: data as CFData),
        let image = CGImage(
          width: width,
          height: height,
          bitsPerComponent: 8,
          bitsPerPixel: 32,
          bytesPerRow: width * 4,
          space: colorSpace,
          bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue),
          provider: provider,
          decode: nil,
          shouldInterpolate: true,
          intent: .defaultIntent
        ),
        let destination = CGImageDestinationCreateWithURL(URL(fileURLWithPath: outputPath) as CFURL, pngType, 1, nil) else {
    throw NSError(domain: "InkTileSlicer", code: 40, userInfo: [NSLocalizedDescriptionKey: "Unable to create PNG image"])
  }

  CGImageDestinationAddImage(destination, image, nil)
  if !CGImageDestinationFinalize(destination) {
    throw NSError(domain: "InkTileSlicer", code: 41, userInfo: [NSLocalizedDescriptionKey: "Unable to write \(outputPath)"])
  }
}

func mercatorWorldBounds(_ bounds: InkBounds, zoom: Int, tileSize: Int) -> (minX: Double, minY: Double, maxX: Double, maxY: Double) {
  let points = [
    mercatorWorldPoint(bounds.northWest, zoom: zoom, tileSize: tileSize),
    mercatorWorldPoint(bounds.northEast, zoom: zoom, tileSize: tileSize),
    mercatorWorldPoint(bounds.southEast, zoom: zoom, tileSize: tileSize),
    mercatorWorldPoint(bounds.southWest, zoom: zoom, tileSize: tileSize)
  ]
  return (
    minX: points.map { $0.x }.min()!,
    minY: points.map { $0.y }.min()!,
    maxX: points.map { $0.x }.max()!,
    maxY: points.map { $0.y }.max()!
  )
}

func mercatorWorldPoint(_ point: LatLng, zoom: Int, tileSize: Int) -> WorldPoint {
  let sinLat = min(0.9999, max(-0.9999, sin(point.lat * Double.pi / 180)))
  let scale = Double(tileSize) * pow(2, Double(zoom))
  return WorldPoint(
    x: ((point.lng + 180) / 360) * scale,
    y: (0.5 - log((1 + sinLat) / (1 - sinLat)) / (4 * Double.pi)) * scale
  )
}
`
}
