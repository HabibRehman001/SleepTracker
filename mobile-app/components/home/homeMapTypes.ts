export type MapRegion = {
  latitude: number
  longitude: number
  latitudeDelta: number
  longitudeDelta: number
}

export type HomeMapCoords = { latitude: number; longitude: number }

export type HomeMapPickerProps = {
  coords: HomeMapCoords | null
  onPick: (coords: HomeMapCoords) => void
  initialRegion?: MapRegion
}

export const DEFAULT_MAP_REGION: MapRegion = {
  latitude: 31.5204,
  longitude: 74.3587,
  latitudeDelta: 0.04,
  longitudeDelta: 0.04,
}
