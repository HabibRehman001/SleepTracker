import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Link } from 'expo-router'
import * as Location from 'expo-location'

import { CurrentLocationMap } from '../components/location/CurrentLocationMap'
import { DEFAULT_MAP_REGION } from '../components/home/homeMapTypes'
import {
  regionFittingPoints,
  summarizeCurrentVsHome,
} from '../services/currentLocationMath'
import { useHomeLocationStore } from '../store/homeLocationStore'

/**
 * Step 179 — current position + home marker + distance from home.
 * One-shot location (not continuous GPS) to stay battery-friendly (Step 178).
 */
export default function CurrentLocationScreen() {
  const insets = useSafeAreaInsets()
  const homeLat = useHomeLocationStore((s) => s.latitude)
  const homeLng = useHomeLocationStore((s) => s.longitude)
  const hydrateFromBackend = useHomeLocationStore((s) => s.hydrateFromBackend)

  const [current, setCurrent] = useState<{
    latitude: number
    longitude: number
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const home =
    homeLat != null && homeLng != null
      ? { latitude: homeLat, longitude: homeLng }
      : null

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const fg = await Location.getForegroundPermissionsAsync()
      if (fg.status !== 'granted') {
        const req = await Location.requestForegroundPermissionsAsync()
        if (req.status !== 'granted') {
          setError('Location permission is required to show where you are.')
          setLoading(false)
          return
        }
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      })
      setCurrent({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Could not read current location'
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void hydrateFromBackend()
  }, [hydrateFromBackend])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const summary =
    current && home ? summarizeCurrentVsHome(current, home) : null

  const region = useMemo(() => {
    if (current && home) return regionFittingPoints(current, home)
    if (current) {
      return {
        ...DEFAULT_MAP_REGION,
        latitude: current.latitude,
        longitude: current.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    }
    if (home) {
      return {
        ...DEFAULT_MAP_REGION,
        latitude: home.latitude,
        longitude: home.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      }
    }
    return DEFAULT_MAP_REGION
  }, [current, home])

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="current-location-screen"
    >
      <View className="px-6 pt-4 pb-3">
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-2">
          Location
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-2">
          Current location
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6">
          Your position relative to the home geofence pin.
        </Text>
      </View>

      <View className="flex-1 px-4 pb-3">
        {loading && !current ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#fafafa" />
          </View>
        ) : (
          <CurrentLocationMap current={current} home={home} region={region} />
        )}
      </View>

      <View className="px-6 pb-6">
        {summary ? (
          <Text
            className="text-foreground text-center text-lg font-semibold mb-1"
            testID="current-location-distance"
          >
            {summary.distanceLabel}
          </Text>
        ) : (
          <Text
            className="text-muted-foreground text-center text-sm mb-1"
            testID="current-location-distance-pending"
          >
            {!home
              ? 'Set a home pin to measure distance.'
              : loading
                ? 'Getting your position…'
                : 'Distance unavailable'}
          </Text>
        )}
        {summary ? (
          <Text
            className="text-muted-foreground text-center text-sm mb-3"
            testID="current-location-inside-flag"
          >
            {summary.insideHomeGeofence
              ? 'Inside the 150 m home geofence'
              : 'Outside the 150 m home geofence'}
          </Text>
        ) : (
          <View className="mb-3" />
        )}
        {error ? (
          <Text
            className="text-destructive text-center text-sm mb-3"
            testID="current-location-error"
          >
            {error}
          </Text>
        ) : null}
        {current ? (
          <Text
            className="text-muted-foreground text-center font-mono text-xs mb-3"
            testID="current-location-coords"
          >
            {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}
          </Text>
        ) : null}
        <Pressable
          className={`bg-primary py-4 rounded-lg items-center mb-3 ${
            loading ? 'opacity-50' : ''
          }`}
          onPress={() => void refresh()}
          disabled={loading}
          testID="current-location-refresh"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {loading ? 'Updating…' : 'Refresh location'}
          </Text>
        </Pressable>
        {!home ? (
          <Link href="/set-home" asChild>
            <Pressable className="py-3 items-center" testID="current-location-set-home">
              <Text className="text-sidebar-primary text-[15px] font-medium">
                Set home location
              </Text>
            </Pressable>
          </Link>
        ) : null}
      </View>
    </View>
  )
}
