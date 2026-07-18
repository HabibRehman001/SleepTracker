import { useRef } from 'react'
import { View } from 'react-native'
import MapView, { Marker, type MapPressEvent } from 'react-native-maps'

import {
  DEFAULT_MAP_REGION,
  type HomeMapPickerProps,
} from './homeMapTypes'

/**
 * Native map picker — react-native-maps (Step 137).
 * Web resolves HomeMapPicker.web.tsx instead, so this never loads on web.
 */
export function HomeMapPicker({
  coords,
  onPick,
  initialRegion,
}: HomeMapPickerProps) {
  const mapRef = useRef<MapView>(null)
  const region = initialRegion ?? {
    ...DEFAULT_MAP_REGION,
    ...(coords
      ? { latitude: coords.latitude, longitude: coords.longitude }
      : {}),
  }

  const onPress = (e: MapPressEvent) => {
    const { latitude, longitude } = e.nativeEvent.coordinate
    onPick({ latitude, longitude })
  }

  return (
    <View
      className="flex-1 overflow-hidden rounded-lg border border-border"
      testID="home-map-native"
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        onPress={onPress}
        showsUserLocation
        showsMyLocationButton
        testID="home-map-view"
      >
        {coords ? (
          <Marker
            coordinate={coords}
            title="Home"
            description="Geofence center"
            testID="home-map-marker"
          />
        ) : null}
      </MapView>
    </View>
  )
}
