import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

import { lingshanAssetMap } from '../../data/scenic3d/lingshanAssetMap'
import { PlaceholderLandmark } from './PlaceholderLandmark'

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
        borderRadius: 8,
        background: '#eef3f6',
      }}
    >
      <Canvas camera={{ position: [4.5, 3.4, 5.2], fov: 42 }}>
        <color attach="background" args={['#eef3f6']} />
        <ambientLight intensity={0.78} />
        <directionalLight position={[4, 6, 3]} intensity={1.2} />
        <group
          position={transform.position}
          rotation={transform.rotation}
          scale={transform.scale}
        >
          <PlaceholderLandmark poiId={activePoiId} active />
        </group>
        <gridHelper args={[7, 7, '#9aa8b4', '#d2dbe2']} position={[0, -0.02, 0]} />
        <OrbitControls enablePan={false} minDistance={3} maxDistance={9} />
      </Canvas>
    </div>
  )
}

export default Scenic3DPreview
