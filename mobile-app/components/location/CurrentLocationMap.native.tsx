import { useEffect, useRef } from 'react'
import { View } from 'react-native'
import MapView, { Circle, Marker } from 'react-native-maps'

import { HOME_GEOFENCE_RADIUS_METERS } from '../../services/geofence'
import type { CurrentLocationMapProps } from './currentLocationMapTypes'

/**
 * Step 179 — native map: you + home + geofence radius.
 */
export function CurrentLocationMap({
  current,
  home,
  region,
}: CurrentLocationMapProps) {
  const mapRef = useRef<MapView>(null)

  useEffect(() => {
    mapRef.current?.animateToRegion(region, 400)
  }, [region])

  return (
    <View
      className="flex-1 overflow-hidden rounded-lg border border-border"
      testID="current-location-map-native"
    >
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        testID="current-location-map-view"
      >
        {home ? (
          <>
            <Marker
              coordinate={home}
              title="Home"
              description="Geofence center"
              pinColor="#3d7eff"
              testID="current-location-home-marker"
            />
            <Circle
              center={home}
              radius={HOME_GEOFENCE_RADIUS_METERS}
              strokeColor="rgba(61, 126, 255, 0.55)"
              fillColor="rgba(61, 126, 255, 0.12)"
              testID="current-location-home-circle"
            />
          </>
        ) : null}
        {current ? (
          <Marker
            coordinate={current}
            title="You"
            description="Current location"
            pinColor="#e8a838"
            testID="current-location-you-marker"
          />
        ) : null}
      </MapView>
    </View>
  )
}
