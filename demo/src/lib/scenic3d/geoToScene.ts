export type ScenePoint = {
  x: number
  y: number
  z: number
}

export type GeoPoint = {
  lat: number
  lng: number
}

export type GeoToSceneOptions = {
  center: GeoPoint
  scale?: number
  y?: number
}

const DEFAULT_SCENE_SCALE = 0.01
const METERS_PER_DEGREE_LNG_AT_EQUATOR = 111320
const METERS_PER_DEGREE_LAT = 110540

export function geoToScenePosition(point: GeoPoint, options: GeoToSceneOptions): ScenePoint {
  const scale = options.scale ?? DEFAULT_SCENE_SCALE
  const y = options.y ?? 0
  const centerLatRadians = (options.center.lat * Math.PI) / 180

  return {
    x: (point.lng - options.center.lng) * Math.cos(centerLatRadians) * METERS_PER_DEGREE_LNG_AT_EQUATOR * scale,
    y,
    z: -(point.lat - options.center.lat) * METERS_PER_DEGREE_LAT * scale
  }
}
