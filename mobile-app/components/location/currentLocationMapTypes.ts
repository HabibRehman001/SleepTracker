import type { LatLng } from '../../services/geofence'
import type { MapRegion } from '../home/homeMapTypes'

export type CurrentLocationMapProps = {
  current: LatLng | null
  home: LatLng | null
  region: MapRegion
}
