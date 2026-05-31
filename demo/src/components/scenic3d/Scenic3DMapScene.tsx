import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector3 } from 'three'

import { scenicCenter } from '../../data/guideData'
import { lingshanPois } from '../../data/lingshanMapData'
import { lingshanRouteGeometries } from '../../data/lingshanRouteGeometries'
import { lingshanAssetMap } from '../../data/scenic3d/lingshanAssetMap'
import { geoToScenePosition } from '../../lib/scenic3d/geoToScene'
import ScenicModel from './ScenicModel'

export type Scenic3DLayoutMode = 'manual' | 'projected'

type Scenic3DMapSceneProps = {
  selectedPoiId?: string
  onSelectPoi?: (poiId: string) => void
  routePoiSequence?: string[]
  routeGeometryPath?: Array<{ lat: number; lng: number }>
  layoutMode?: Scenic3DLayoutMode
}

type LandmarkNode = {
  poiId: string
  name: string
  modelUrl?: string
  position: [number, number, number]
  scale: [number, number, number]
}

type ScenicRouteNode = {
  poiId: string
  name: string
  position: [number, number, number]
  nodeType: 'culture' | 'route'
}

const landmarkFallbackLayout: Record<string, Pick<LandmarkNode, 'position' | 'scale'>> = {
  jiulong_guanyu: {
    position: [-2.8, 0, 2.35],
    scale: [0.72, 0.72, 0.72],
  },
  giant_buddha: {
    position: [0, 0, -1.2],
    scale: [0.92, 0.92, 0.92],
  },
  fan_gong: {
    position: [3.45, 0, -0.15],
    scale: [0.76, 0.76, 0.76],
  },
  wuyin_tancheng: {
    position: [-1.75, 0, -4.05],
    scale: [0.78, 0.78, 0.78],
  },
}

const fallbackName: Record<string, string> = {
  giant_buddha: '灵山大佛',
  jiulong_guanyu: '九龙灌浴',
  fan_gong: '梵宫',
  wuyin_tancheng: '五印坛城',
}

const defaultRoutePoiSequence = ['jiulong_guanyu', 'giant_buddha', 'fan_gong', 'wuyin_tancheng']
const cultureNodeIds = new Set(['xiangfu_temple', 'manfeilong_tower', 'lingshan_jingshe', 'sansheng_hall', 'baizi_mile'])

function getPoiName(poiId: string) {
  return lingshanPois.find((poi) => poi.id === poiId)?.name ?? fallbackName[poiId] ?? poiId
}

function getScenePosition(poiId: string, layoutMode: Scenic3DLayoutMode): [number, number, number] {
  const poi = lingshanPois.find((item) => item.id === poiId)

  if (layoutMode === 'projected' && poi?.displayLocation) {
    const projectedPosition = geoToScenePosition(poi.displayLocation, { center: scenicCenter })
    return [projectedPosition.x, projectedPosition.y, projectedPosition.z]
  }

  const scenePosition = poi?.scenePosition

  if (scenePosition) {
    return [scenePosition.x, scenePosition.y, scenePosition.z]
  }

  return landmarkFallbackLayout[poiId]?.position ?? [0, 0, 0]
}

function hasScenePositionForMode(poiId: string, layoutMode: Scenic3DLayoutMode) {
  const poi = lingshanPois.find((item) => item.id === poiId)

  if (layoutMode === 'projected') {
    return Boolean(poi?.displayLocation || poi?.scenePosition || landmarkFallbackLayout[poiId])
  }

  return Boolean(poi?.scenePosition || landmarkFallbackLayout[poiId])
}

function buildLandmarks(layoutMode: Scenic3DLayoutMode): LandmarkNode[] {
  return lingshanAssetMap
    .filter((asset) => asset.status !== 'disabled' && landmarkFallbackLayout[asset.poiId])
    .map((asset) => ({
      poiId: asset.poiId,
      name: getPoiName(asset.poiId),
      modelUrl: asset.modelUrl,
      position: getScenePosition(asset.poiId, layoutMode),
      scale: landmarkFallbackLayout[asset.poiId].scale,
    }))
}

function buildScenicRouteNodes(layoutMode: Scenic3DLayoutMode): ScenicRouteNode[] {
  return lingshanPois
    .filter((poi) => hasScenePositionForMode(poi.id, layoutMode) && !landmarkFallbackLayout[poi.id])
    .map((poi) => ({
      poiId: poi.id,
      name: poi.name,
      position: getScenePosition(poi.id, layoutMode),
      nodeType: cultureNodeIds.has(poi.id) ? 'culture' : 'route',
    }))
}

function getRouteSequence(routePoiSequence: string[] | undefined, layoutMode: Scenic3DLayoutMode) {
  const validSequence = routePoiSequence?.filter((poiId) => hasScenePositionForMode(poiId, layoutMode))

  return validSequence && validSequence.length >= 2 ? validSequence : defaultRoutePoiSequence
}

function buildRoutePoints(sequence: string[], layoutMode: Scenic3DLayoutMode) {
  const points: Vector3[] = []
  const firstPoiId = sequence[0]

  if (firstPoiId) {
    const [firstX, , firstZ] = getScenePosition(firstPoiId, layoutMode)
    points.push(new Vector3(firstX - 0.95, 0.1, firstZ + 0.58))
  }

  sequence.forEach((poiId, index) => {
    const [x, , z] = getScenePosition(poiId, layoutMode)
    points.push(new Vector3(x, 0.12, z))

    const nextPoiId = sequence[index + 1]
    if (nextPoiId) {
      const [nextX, , nextZ] = getScenePosition(nextPoiId, layoutMode)
      const dx = nextX - x
      const dz = nextZ - z
      const length = Math.hypot(dx, dz) || 1
      const curveDirection = index % 2 === 0 ? 1 : -1
      const curveOffset = Math.min(0.58, length * 0.14) * curveDirection
      const normalX = -dz / length
      const normalZ = dx / length

      points.push(new Vector3(x + dx * 0.34 + normalX * curveOffset, 0.14, z + dz * 0.34 + normalZ * curveOffset))
      points.push(new Vector3(x + dx * 0.68 - normalX * curveOffset * 0.45, 0.14, z + dz * 0.68 - normalZ * curveOffset * 0.45))
    }
  })

  return points
}

function buildRouteGeometryPoints(routeGeometryPath: Array<{ lat: number; lng: number }> | undefined) {
  if (!routeGeometryPath || routeGeometryPath.length < 2) {
    return null
  }

  return routeGeometryPath.map((point) => {
    const position = geoToScenePosition(point, { center: scenicCenter })
    return new Vector3(position.x, 0.13, position.z)
  })
}

function buildRoadNetworkLines() {
  return lingshanRouteGeometries
    .map((geometry) => ({
      id: geometry.id,
      points: geometry.path.map((point) => {
        const position = geoToScenePosition(point, { center: scenicCenter })
        return new Vector3(position.x, 0.095, position.z)
      }),
    }))
    .filter((line) => line.points.length >= 2)
}

function SceneContent({
  selectedPoiId,
  onSelectPoi,
  routePoiSequence,
  routeGeometryPath,
  layoutMode = 'projected',
}: Scenic3DMapSceneProps) {
  const landmarks = useMemo(() => buildLandmarks(layoutMode), [layoutMode])
  const scenicRouteNodes = useMemo(() => buildScenicRouteNodes(layoutMode), [layoutMode])
  const activePoiId = selectedPoiId || 'giant_buddha'
  const routeSequence = useMemo(() => getRouteSequence(routePoiSequence, layoutMode), [layoutMode, routePoiSequence])
  const routePoiSet = useMemo(() => new Set(routeSequence), [routeSequence])
  const routeGeometryPoints = useMemo(() => buildRouteGeometryPoints(routeGeometryPath), [routeGeometryPath])
  const roadNetworkLines = useMemo(() => buildRoadNetworkLines(), [])
  const routePoints = useMemo(
    () => routeGeometryPoints ?? buildRoutePoints(routeSequence, layoutMode),
    [layoutMode, routeGeometryPoints, routeSequence]
  )

  return (
    <>
      <color attach="background" args={['#f2efe6']} />
      <fog attach="fog" args={['#f2efe6', 7.2, 19]} />
      <ambientLight intensity={0.68} />
      <hemisphereLight args={['#fff7e8', '#a8b8ad', 0.78]} />
      <directionalLight position={[5.5, 8, 4.5]} intensity={1.05} color="#fff3d3" />
      <directionalLight position={[-4.5, 4.2, -5]} intensity={0.28} color="#c7d6d0" />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
        <circleGeometry args={[8.35, 128]} />
        <meshStandardMaterial color="#e5ddca" roughness={0.96} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0.08]} position={[0, -0.045, 0]} scale={[1, 0.86, 1]}>
        <circleGeometry args={[7.25, 128]} />
        <meshStandardMaterial color="#d9dfd0" roughness={0.94} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, -0.08]} position={[0.15, -0.028, 0.1]} scale={[0.98, 0.82, 1]}>
        <ringGeometry args={[6.55, 6.62, 128]} />
        <meshBasicMaterial color="#f7f0dc" transparent opacity={0.46} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, -0.24]} position={[-5.35, -0.024, 0.8]} scale={[2.7, 1.05, 1]}>
        <circleGeometry args={[1.72, 96]} />
        <meshStandardMaterial color="#abc7c8" roughness={0.38} metalness={0.02} transparent opacity={0.58} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0.18]} position={[-6.75, -0.018, -2.55]} scale={[3.2, 0.86, 1]}>
        <circleGeometry args={[1.24, 96]} />
        <meshStandardMaterial color="#c0d5d1" roughness={0.42} metalness={0.02} transparent opacity={0.42} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, -0.05]} position={[-3.6, -0.017, 3.65]} scale={[1.92, 0.58, 1]}>
        <circleGeometry args={[1.18, 72]} />
        <meshStandardMaterial color="#d3dfd7" roughness={0.46} metalness={0.01} transparent opacity={0.32} />
      </mesh>

      {[
        [-6.85, 0.3, -6.7, 1.15, 1.22],
        [-5.25, 0.38, -7.15, 1.48, 1.62],
        [-3.35, 0.28, -6.85, 1.05, 1.16],
        [4.85, 0.32, -6.95, 1.25, 1.38],
        [6.45, 0.25, -5.95, 0.92, 1.06],
      ].map(([x, y, z, radius, height], index) => (
        <mesh key={index} position={[x, y, z]}>
          <coneGeometry args={[radius, height, 5]} />
          <meshStandardMaterial color={index % 2 === 0 ? '#aebaaa' : '#9fae9e'} roughness={0.94} transparent opacity={0.64} />
        </mesh>
      ))}

      {roadNetworkLines.map((line) => (
        <Line key={line.id} points={line.points} color="#9f9a83" lineWidth={1.3} transparent opacity={0.42} dashed={false} />
      ))}

      {roadNetworkLines.map((line) => (
        <Line key={`${line.id}-wash`} points={line.points} color="#efe7cf" lineWidth={3.2} transparent opacity={0.18} dashed={false} />
      ))}

      <Line points={routePoints} color="#d7c08a" lineWidth={7} dashed={false} />
      <Line points={routePoints} color="#b8892e" lineWidth={3.4} dashed={false} />
      <Line points={routePoints} color="#fff0b8" lineWidth={1.2} dashed={false} />

      {routeSequence.map((poiId) => {
        const [x, , z] = getScenePosition(poiId, layoutMode)
        const active = poiId === activePoiId

        return (
          <group key={`route-node-${poiId}`} position={[x, active ? 0.18 : 0.16, z]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[active ? 0.34 : 0.24, active ? 0.026 : 0.018, 12, 48]} />
              <meshBasicMaterial color={active ? '#d09b35' : '#cfbb83'} />
            </mesh>
          </group>
        )
      })}

      {scenicRouteNodes.map((node) => {
        const active = node.poiId === activePoiId
        const onRoute = routePoiSet.has(node.poiId)
        const culture = node.nodeType === 'culture'
        const baseRadius = culture ? 0.24 : 0.16
        const activeRadius = culture ? 0.34 : 0.25
        const labelVisible = culture || active || onRoute

        return (
          <group
            key={node.poiId}
            position={node.position}
            onClick={(event) => {
              event.stopPropagation()
              onSelectPoi?.(node.poiId)
            }}
          >
            <mesh position={[0, 0.035, 0]}>
              <cylinderGeometry args={[active ? activeRadius : baseRadius, active ? activeRadius : baseRadius, culture ? 0.08 : 0.045, culture ? 40 : 28]} />
              <meshStandardMaterial
                color={active ? '#c9953b' : culture ? '#efe1bf' : '#f1ead6'}
                roughness={0.86}
                transparent
                opacity={active ? 0.96 : culture ? 0.86 : 0.72}
              />
            </mesh>

            {culture ? (
              <mesh position={[0, active ? 0.27 : 0.22, 0]}>
                <cylinderGeometry args={[active ? 0.095 : 0.075, active ? 0.12 : 0.095, active ? 0.38 : 0.3, 8]} />
                <meshStandardMaterial color={active ? '#b57e2d' : '#cdbb8f'} roughness={0.82} />
              </mesh>
            ) : null}

            {node.poiId === 'south_gate' || node.poiId === 'exit' ? (
              <mesh position={[0, 0.16, 0]}>
                <boxGeometry args={[active ? 0.34 : 0.26, active ? 0.24 : 0.18, 0.08]} />
                <meshStandardMaterial color={active ? '#a86f27' : '#c9b98e'} roughness={0.84} />
              </mesh>
            ) : null}

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.062, 0]}>
              <ringGeometry args={active ? [0.3, 0.42, 48] : [0.2, 0.26, 36]} />
              <meshBasicMaterial color={active ? '#d0a14a' : onRoute ? '#d7c08a' : '#ddd2b7'} transparent opacity={active ? 0.36 : onRoute ? 0.25 : 0.16} />
            </mesh>

            {labelVisible ? (
              <Html center position={[0, culture ? 0.78 : 0.42, 0]} distanceFactor={culture ? 8.6 : 9.8}>
                <button
                  type="button"
                  onClick={() => onSelectPoi?.(node.poiId)}
                  style={{
                    minWidth: culture ? 76 : 58,
                    padding: culture ? '4px 8px' : '3px 7px',
                    border: active ? '1px solid rgba(170, 114, 29, 0.62)' : '1px solid rgba(63, 83, 74, 0.12)',
                    borderRadius: 10,
                    background: active ? 'rgba(255, 246, 220, 0.96)' : 'rgba(255, 252, 242, 0.78)',
                    color: active ? '#7f5314' : '#405448',
                    boxShadow: active ? '0 8px 18px rgba(121, 82, 22, 0.16)' : '0 5px 12px rgba(31, 42, 51, 0.08)',
                    cursor: 'pointer',
                    fontSize: culture ? 11 : 10,
                    fontWeight: active ? 800 : 700,
                    whiteSpace: 'nowrap',
                    letterSpacing: 0,
                  }}
                >
                  {node.name}
                </button>
              </Html>
            ) : null}
          </group>
        )
      })}

      {landmarks.map((landmark) => {
        const active = landmark.poiId === activePoiId

        return (
          <group
            key={landmark.poiId}
            position={landmark.position}
            scale={active ? landmark.scale.map((value) => value * 1.12) as [number, number, number] : landmark.scale}
            onClick={(event) => {
              event.stopPropagation()
              onSelectPoi?.(landmark.poiId)
            }}
          >
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.045, 0]}>
              <ringGeometry args={active ? [0.72, 0.94, 64] : [0.5, 0.58, 48]} />
              <meshBasicMaterial color={active ? '#d0a14a' : '#d4d0ba'} transparent opacity={active ? 0.36 : 0.2} />
            </mesh>
            <ScenicModel
              poiId={landmark.poiId}
              active={active}
              modelUrl={landmark.modelUrl}
            />
            <Html center position={[0, 2.15, 0]} distanceFactor={8}>
              <button
                type="button"
                onClick={() => onSelectPoi?.(landmark.poiId)}
                style={{
                  minWidth: 84,
                  padding: '5px 10px',
                  border: active ? '1px solid rgba(170, 114, 29, 0.62)' : '1px solid rgba(63, 83, 74, 0.16)',
                  borderRadius: 12,
                  background: active ? 'rgba(255, 246, 220, 0.96)' : 'rgba(255, 252, 242, 0.88)',
                  color: active ? '#7f5314' : '#2f443b',
                  boxShadow: active ? '0 10px 24px rgba(121, 82, 22, 0.18)' : '0 8px 18px rgba(31, 42, 51, 0.1)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  letterSpacing: 0,
                }}
              >
                {landmark.name}
              </button>
            </Html>
          </group>
        )
      })}

      <OrbitControls
        makeDefault
        enablePan
        minDistance={5.2}
        maxDistance={13.2}
        minPolarAngle={Math.PI * 0.2}
        maxPolarAngle={Math.PI * 0.42}
        target={[0.05, 0.42, -0.7]}
      />
    </>
  )
}

function Scenic3DMapScene({
  selectedPoiId,
  onSelectPoi,
  routePoiSequence,
  routeGeometryPath,
  layoutMode = 'projected',
}: Scenic3DMapSceneProps) {
  return (
    <Canvas camera={{ position: [4.8, 7.8, 8.6], fov: 38 }}>
      <SceneContent
        selectedPoiId={selectedPoiId}
        onSelectPoi={onSelectPoi}
        routePoiSequence={routePoiSequence}
        routeGeometryPath={routeGeometryPath}
        layoutMode={layoutMode}
      />
    </Canvas>
  )
}

export default Scenic3DMapScene
