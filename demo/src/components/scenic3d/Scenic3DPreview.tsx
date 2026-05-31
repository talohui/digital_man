import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import { lingshanAssetMap } from '../../data/scenic3d/lingshanAssetMap'
import ScenicModel from './ScenicModel'

type Scenic3DPreviewProps = {
  selectedPoiId?: string
  height?: number | string
}

const DEFAULT_POI_ID = 'giant_buddha'

function getAssetBinding(poiId: string) {
  return lingshanAssetMap.find((asset) => asset.poiId === poiId)
}

export function Scenic3DPreview({
  selectedPoiId,
  height = 320,
}: Scenic3DPreviewProps) {
  const activePoiId = selectedPoiId || DEFAULT_POI_ID
  const activeAsset = getAssetBinding(activePoiId)
  const transform = activeAsset?.transform ?? {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  }

  return (
    <div
      style={{
        width: '100%',
        height,
        minHeight: 240,
        overflow: 'hidden',
        borderRadius: 10,
        background: 'linear-gradient(180deg, #eef6f8 0%, #dfe9ec 62%, #d3dde0 100%)',
      }}
    >
      <Canvas camera={{ position: [4.5, 3.4, 5.2], fov: 42 }}>
        <color attach="background" args={['#eaf3f6']} />
        <fog attach="fog" args={['#eaf3f6', 8, 18]} />
        <ambientLight intensity={0.68} />
        <hemisphereLight args={['#ffffff', '#b8c7cd', 0.68]} />
        <directionalLight position={[4, 6, 3]} intensity={1.35} />
        <directionalLight position={[-3, 4, -2]} intensity={0.42} />
        <ScenicModel
          poiId={activePoiId}
          active
          modelUrl={activeAsset?.modelUrl}
          transform={transform}
        />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.035, 0]}>
          <circleGeometry args={[4.2, 64]} />
          <meshStandardMaterial color="#edf1ea" roughness={0.86} />
        </mesh>
        <gridHelper args={[7, 7, '#8fa0aa', '#d5dee3']} position={[0, -0.02, 0]} />
        <OrbitControls
          enablePan={false}
          minDistance={3}
          maxDistance={9}
          target={[0, 0.7, 0]}
        />
      </Canvas>
    </div>
  )
}

export default Scenic3DPreview
