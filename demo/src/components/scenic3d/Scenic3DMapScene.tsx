import { Html, Line, OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { useMemo } from 'react'
import { Vector3 } from 'three'

import { lingshanPois } from '../../data/lingshanMapData'
import { lingshanAssetMap } from '../../data/scenic3d/lingshanAssetMap'
import PlaceholderLandmark from './PlaceholderLandmark'

type Scenic3DMapSceneProps = {
  selectedPoiId?: string
  onSelectPoi?: (poiId: string) => void
}

type LandmarkNode = {
  poiId: string
  name: string
  position: [number, number, number]
  scale: [number, number, number]
}

const landmarkLayout: Record<string, Pick<LandmarkNode, 'position' | 'scale'>> = {
  jiulong_guanyu: {
    position: [-3.4, 0, 1.75],
    scale: [0.72, 0.72, 0.72],
  },
  giant_buddha: {
    position: [0, 0, -1.45],
    scale: [0.92, 0.92, 0.92],
  },
  fan_gong: {
    position: [3.4, 0, 1.1],
    scale: [0.76, 0.76, 0.76],
  },
  wuyin_tancheng: {
    position: [1.45, 0, -4.0],
    scale: [0.78, 0.78, 0.78],
  },
}

const fallbackName: Record<string, string> = {
  giant_buddha: '灵山大佛',
  jiulong_guanyu: '九龙灌浴',
  fan_gong: '梵宫',
  wuyin_tancheng: '五印坛城',
}

function getPoiName(poiId: string) {
  return lingshanPois.find((poi) => poi.id === poiId)?.name ?? fallbackName[poiId] ?? poiId
}

function buildLandmarks(): LandmarkNode[] {
  return lingshanAssetMap
    .filter((asset) => asset.status !== 'disabled' && landmarkLayout[asset.poiId])
    .map((asset) => ({
      poiId: asset.poiId,
      name: getPoiName(asset.poiId),
      position: landmarkLayout[asset.poiId].position,
      scale: landmarkLayout[asset.poiId].scale,
    }))
}

function SceneContent({ selectedPoiId, onSelectPoi }: Scenic3DMapSceneProps) {
  const landmarks = useMemo(() => buildLandmarks(), [])
  const activePoiId = selectedPoiId || 'giant_buddha'
  const routePoints = useMemo(
    () =>
      [
        [-4.2, 0.08, 2.35],
        [-3.35, 0.1, 1.75],
        [-1.35, 0.12, 0.2],
        [0, 0.12, -1.45],
        [1.55, 0.12, -2.65],
        [1.45, 0.12, -4],
        [2.55, 0.12, -1.2],
        [3.4, 0.12, 1.1],
      ].map((point) => new Vector3(point[0], point[1], point[2])),
    []
  )

  return (
    <>
      <color attach="background" args={['#e9f0ef']} />
      <fog attach="fog" args={['#e9f0ef', 8, 18]} />
      <ambientLight intensity={0.58} />
      <hemisphereLight args={['#ffffff', '#a9bbb6', 0.72]} />
      <directionalLight position={[5, 8, 4]} intensity={1.35} />
      <directionalLight position={[-4, 5, -5]} intensity={0.35} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <circleGeometry args={[7.4, 96]} />
        <meshStandardMaterial color="#dfe8de" roughness={0.9} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, -0.18]} position={[-4.25, -0.025, 0.65]} scale={[1.85, 0.78, 1]}>
        <circleGeometry args={[1.55, 64]} />
        <meshStandardMaterial color="#a8ccd3" roughness={0.42} metalness={0.03} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0.26]} position={[-5.25, -0.02, -2.45]} scale={[2.5, 0.84, 1]}>
        <circleGeometry args={[1.2, 64]} />
        <meshStandardMaterial color="#b7d5d9" roughness={0.46} metalness={0.02} />
      </mesh>

      {[
        [-5.8, 0.35, -5.8, 1.2, 1.5],
        [-4.25, 0.48, -6.3, 1.55, 2.1],
        [-2.35, 0.32, -6.05, 1.1, 1.4],
        [4.85, 0.4, -5.75, 1.4, 1.8],
        [6.15, 0.3, -4.6, 0.95, 1.25],
      ].map(([x, y, z, radius, height], index) => (
        <mesh key={index} position={[x, y, z]}>
          <coneGeometry args={[radius, height, 5]} />
          <meshStandardMaterial color="#b7c3b6" roughness={0.88} />
        </mesh>
      ))}

      <Line points={routePoints} color="#c79a3b" lineWidth={4} dashed={false} />
      <Line points={routePoints} color="#f6e6ae" lineWidth={1.5} dashed={false} />

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
            <PlaceholderLandmark poiId={landmark.poiId} active={active} />
            <Html center position={[0, 2.15, 0]} distanceFactor={8}>
              <button
                type="button"
                onClick={() => onSelectPoi?.(landmark.poiId)}
                style={{
                  minWidth: 84,
                  padding: '5px 9px',
                  border: active ? '1px solid rgba(178, 118, 24, 0.65)' : '1px solid rgba(55, 73, 84, 0.18)',
                  borderRadius: 999,
                  background: active ? 'rgba(255, 247, 221, 0.94)' : 'rgba(255, 255, 255, 0.84)',
                  color: active ? '#8a5b12' : '#364852',
                  boxShadow: '0 8px 20px rgba(31, 42, 51, 0.14)',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
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
        minDistance={4.6}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 0.6, -0.8]}
      />
    </>
  )
}

function Scenic3DMapScene({ selectedPoiId, onSelectPoi }: Scenic3DMapSceneProps) {
  return (
    <Canvas camera={{ position: [6.4, 5.6, 7.6], fov: 43 }}>
      <SceneContent selectedPoiId={selectedPoiId} onSelectPoi={onSelectPoi} />
    </Canvas>
  )
}

export default Scenic3DMapScene
