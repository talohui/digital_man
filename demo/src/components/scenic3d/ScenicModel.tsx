import { useGLTF } from '@react-three/drei'
import { Component, Suspense, type ReactNode } from 'react'

import { PlaceholderLandmark } from './PlaceholderLandmark'

type ScenicModelTransform = {
  position: [number, number, number]
  rotation: [number, number, number]
  scale: [number, number, number]
}

type ScenicModelProps = {
  poiId: string
  active?: boolean
  modelUrl?: string
  transform?: ScenicModelTransform
}

type ModelErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  resetKey?: string
}

type ModelErrorBoundaryState = {
  hasError: boolean
}

const defaultTransform: ScenicModelTransform = {
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1],
}

class ModelErrorBoundary extends Component<ModelErrorBoundaryProps, ModelErrorBoundaryState> {
  state: ModelErrorBoundaryState = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidUpdate(previousProps: ModelErrorBoundaryProps) {
    if (previousProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.setState({ hasError: false })
    }
  }

  componentDidCatch(error: unknown) {
    console.warn('[ScenicModel] GLB model load failed, fallback to placeholder.', error)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}

function LoadedGlbModel({ modelUrl }: { modelUrl: string }) {
  const gltf = useGLTF(modelUrl)

  return <primitive object={gltf.scene} />
}

export function ScenicModel({
  poiId,
  active = false,
  modelUrl,
  transform = defaultTransform,
}: ScenicModelProps) {
  const fallback = <PlaceholderLandmark poiId={poiId} active={active} />
  const safeModelUrl = modelUrl?.trim()

  return (
    <group
      position={transform.position}
      rotation={transform.rotation}
      scale={transform.scale}
    >
      {active ? (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[0.62, 0.84, 64]} />
          <meshBasicMaterial color="#d0a14a" transparent opacity={0.28} />
        </mesh>
      ) : null}
      {safeModelUrl ? (
        <ModelErrorBoundary fallback={fallback} resetKey={safeModelUrl}>
          <Suspense fallback={fallback}>
            <LoadedGlbModel modelUrl={safeModelUrl} />
          </Suspense>
        </ModelErrorBoundary>
      ) : (
        fallback
      )}
    </group>
  )
}

export default ScenicModel
