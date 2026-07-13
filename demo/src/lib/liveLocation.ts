import { guideSpots, scenicCenter } from '../data/guideData'

export type CrowdSpot = {
  id: string
  name: string
  lng: number
  lat: number
}

export type CrowdAgent = {
  id: number
  lng: number
  lat: number
  targetLng: number
  targetLat: number
  weight: number
}

export type LiveUserPoint = {
  id: string
  lng: number
  lat: number
}

export type TencentHeatPoint = {
  lng: number
  lat: number
  count: number
}

const CROWD_SPOT_IDS = [
  'giant_buddha',
  'jiulong_guanyu',
  'fan_gong',
  'xiangfu_temple',
  'wuyin_tancheng',
  'puti_avenue',
]

export const LINGSHAN_CENTER = {
  lng: scenicCenter.lng,
  lat: scenicCenter.lat,
}

export const LINGSHAN_CROWD_SPOTS: CrowdSpot[] = CROWD_SPOT_IDS.map((id) => {
  const spot = guideSpots.find((candidate) => candidate.id === id)

  if (!spot) {
    throw new Error(`未在原始景点数据中找到热力锚点: ${id}`)
  }

  return {
    id: spot.id,
    name: spot.name,
    lng: spot.lng,
    lat: spot.lat,
  }
})

const POSITION_JITTER_DEGREES = 0.006
const TARGET_JITTER_DEGREES = 0.0013
const ARRIVAL_DISTANCE_DEGREES = 0.00028

export function createCrowdAgents(count = 500, random: () => number = Math.random): CrowdAgent[] {
  return Array.from({ length: count }, (_, index) => {
    const originSpot = pickSpot(random)
    const target = createTarget(originSpot, random)

    return {
      id: index + 1,
      lng: originSpot.lng + gaussianJitter(random, POSITION_JITTER_DEGREES),
      lat: originSpot.lat + gaussianJitter(random, POSITION_JITTER_DEGREES),
      targetLng: target.lng,
      targetLat: target.lat,
      weight: roundTo(0.8 + random() * 0.6, 2),
    }
  })
}

export function tickCrowdAgents(
  agents: CrowdAgent[],
  random: () => number = Math.random,
): CrowdAgent[] {
  return agents.map((agent) => {
    const dx = agent.targetLng - agent.lng
    const dy = agent.targetLat - agent.lat
    const distance = Math.hypot(dx, dy)
    const shouldRetarget = distance < ARRIVAL_DISTANCE_DEGREES && random() < 0.28
    const nextTarget = shouldRetarget ? createTarget(pickSpot(random), random) : null
    const targetLng = nextTarget?.lng ?? agent.targetLng
    const targetLat = nextTarget?.lat ?? agent.targetLat
    const nextDx = targetLng - agent.lng
    const nextDy = targetLat - agent.lat
    const pace = 0.1 + random() * 0.08

    return {
      ...agent,
      lng: roundTo(agent.lng + nextDx * pace + gaussianJitter(random, 0.00008), 7),
      lat: roundTo(agent.lat + nextDy * pace + gaussianJitter(random, 0.00008), 7),
      targetLng,
      targetLat,
      weight: roundTo(clamp(agent.weight + (random() - 0.5) * 0.08, 0.75, 1.45), 2),
    }
  })
}

export function toTencentHeatData(
  agents: CrowdAgent[],
  liveUsers: LiveUserPoint[] = [],
): TencentHeatPoint[] {
  return [
    ...agents.map((agent) => ({
      lng: agent.lng,
      lat: agent.lat,
      count: agent.weight,
    })),
    ...liveUsers.map((point) => ({
      lng: point.lng,
      lat: point.lat,
      count: 10,
    })),
  ]
}

function pickSpot(random: () => number) {
  return LINGSHAN_CROWD_SPOTS[Math.floor(random() * LINGSHAN_CROWD_SPOTS.length)] ?? LINGSHAN_CROWD_SPOTS[0]
}

function createTarget(spot: CrowdSpot, random: () => number) {
  return {
    lng: roundTo(spot.lng + gaussianJitter(random, TARGET_JITTER_DEGREES), 7),
    lat: roundTo(spot.lat + gaussianJitter(random, TARGET_JITTER_DEGREES), 7),
  }
}

function gaussianJitter(random: () => number, maxAbs: number) {
  let u = 0
  let v = 0

  while (u === 0) {
    u = random()
  }

  while (v === 0) {
    v = random()
  }

  const gaussian = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
  return clamp(gaussian * (maxAbs / 3), -maxAbs, maxAbs)
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function roundTo(value: number, precision: number) {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}
