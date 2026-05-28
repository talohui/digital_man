type PlaceholderLandmarkProps = {
  poiId: string
  active?: boolean
}

const activeColor = '#f2c36b'
const inactiveColor = '#8ea4b8'
const stoneColor = '#d8d2c4'
const waterColor = '#5aa6c8'
const roofColor = '#b66a52'

export function PlaceholderLandmark({
  poiId,
  active = false,
}: PlaceholderLandmarkProps) {
  const accentColor = active ? activeColor : inactiveColor

  if (poiId === 'giant_buddha') {
    return (
      <group>
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[1.1, 1.35, 0.36, 32]} />
          <meshStandardMaterial color={stoneColor} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.78, 0]}>
          <cylinderGeometry args={[0.62, 0.82, 0.86, 24]} />
          <meshStandardMaterial color={accentColor} roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.42, 0]}>
          <sphereGeometry args={[0.42, 24, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.55} />
        </mesh>
        <mesh position={[0, 1.98, 0]} scale={[0.44, 0.92, 0.28]}>
          <sphereGeometry args={[0.5, 24, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} />
        </mesh>
      </group>
    )
  }

  if (poiId === 'jiulong_guanyu') {
    return (
      <group>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[1.35, 1.35, 0.16, 48]} />
          <meshStandardMaterial color={waterColor} roughness={0.35} metalness={0.05} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.56, 0.72, 0.28, 32]} />
          <meshStandardMaterial color={stoneColor} roughness={0.68} />
        </mesh>
        <mesh position={[0, 0.56, 0]}>
          <sphereGeometry args={[0.38, 24, 12]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} />
        </mesh>
      </group>
    )
  }

  if (poiId === 'fan_gong') {
    return (
      <group>
        <mesh position={[0, 0.36, 0]}>
          <boxGeometry args={[1.9, 0.72, 1.24]} />
          <meshStandardMaterial color={stoneColor} roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.92, 0]} scale={[1.35, 0.62, 0.92]}>
          <sphereGeometry args={[0.64, 32, 16]} />
          <meshStandardMaterial color={roofColor} roughness={0.58} />
        </mesh>
        <mesh position={[0, 1.42, 0]}>
          <cylinderGeometry args={[0.14, 0.2, 0.36, 16]} />
          <meshStandardMaterial color={accentColor} roughness={0.5} />
        </mesh>
      </group>
    )
  }

  if (poiId === 'wuyin_tancheng') {
    return (
      <group>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[1.08, 1.24, 0.24, 8]} />
          <meshStandardMaterial color={stoneColor} roughness={0.72} />
        </mesh>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.78, 0.94, 0.36, 8]} />
          <meshStandardMaterial color={roofColor} roughness={0.62} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.44, 0.56, 0.4, 8]} />
          <meshStandardMaterial color={accentColor} roughness={0.55} />
        </mesh>
      </group>
    )
  }

  return (
    <mesh position={[0, 0.35, 0]}>
      <boxGeometry args={[1, 0.7, 1]} />
      <meshStandardMaterial color={accentColor} roughness={0.65} />
    </mesh>
  )
}

export default PlaceholderLandmark
