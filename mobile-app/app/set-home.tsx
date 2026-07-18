import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router, type Href } from 'expo-router'
import * as Location from 'expo-location'

import { HomeMapPicker } from '../components/home/HomeMapPicker'
import { useHomeLocationStore } from '../store/homeLocationStore'
import { useAppStore } from '../store/useAppStore'

/**
 * Step 137 — map picker; saves lat/lng to mobile-server (survives reinstall).
 */
export default function SetHomeScreen() {
  const insets = useSafeAreaInsets()
  const setHomeSetupDone = useAppStore((s) => s.setHomeSetupDone)

  const latitude = useHomeLocationStore((s) => s.latitude)
  const longitude = useHomeLocationStore((s) => s.longitude)
  const saving = useHomeLocationStore((s) => s.saving)
  const lastError = useHomeLocationStore((s) => s.lastError)
  const setCoords = useHomeLocationStore((s) => s.setCoords)
  const hydrateFromBackend = useHomeLocationStore((s) => s.hydrateFromBackend)
  const persistToBackend = useHomeLocationStore((s) => s.persistToBackend)

  const [loading, setLoading] = useState(true)
  const [initialRegion, setInitialRegion] = useState<
    | { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number }
    | undefined
  >()

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const existing = await hydrateFromBackend()
      if (cancelled) return
      if (existing) {
        setInitialRegion({
          latitude: existing.latitude,
          longitude: existing.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        })
      } else {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          })
          if (!cancelled) {
            setInitialRegion({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            })
          }
        } catch {
          // Keep default region inside HomeMapPicker
        }
      }
      if (!cancelled) setLoading(false)
    })()
    return () => {
      cancelled = true
    }
  }, [hydrateFromBackend])

  const save = useCallback(async () => {
    try {
      await persistToBackend()
      setHomeSetupDone(true)
      // Cast: .expo typed routes can lag until Metro regenerates them.
      router.replace('/device-owner-setup' as Href)
    } catch {
      // lastError already set on store
    }
  }, [persistToBackend, setHomeSetupDone])

  const coords =
    latitude != null && longitude != null
      ? { latitude, longitude }
      : null

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="set-home-screen"
    >
      <View className="px-6 pt-4 pb-3">
        <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-2">
          Home
        </Text>
        <Text className="text-foreground text-3xl font-semibold leading-tight mb-2">
          Set home location
        </Text>
        <Text className="text-muted-foreground text-[15px] leading-6">
          Tap the map to drop your home pin. Saved to your LAN server so a
          reinstall won’t lose it.
        </Text>
      </View>

      <View className="flex-1 px-4 pb-3">
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#fafafa" />
          </View>
        ) : (
          <HomeMapPicker
            coords={coords}
            initialRegion={initialRegion}
            onPick={({ latitude: lat, longitude: lng }) => setCoords(lat, lng)}
          />
        )}
      </View>

      <View className="px-6 pb-6">
        {coords ? (
          <Text
            className="text-muted-foreground text-center font-mono text-xs mb-3"
            testID="home-coords-readout"
          >
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text className="text-muted-foreground text-center text-sm mb-3">
            Tap the map to choose a spot
          </Text>
        )}
        {lastError ? (
          <Text className="text-destructive text-center text-sm mb-3" testID="home-save-error">
            {lastError}
          </Text>
        ) : null}
        <Pressable
          className={`bg-primary py-4 rounded-lg items-center ${
            !coords || saving ? 'opacity-50' : ''
          }`}
          onPress={() => void save()}
          disabled={!coords || saving}
          testID="home-save"
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {saving ? 'Saving…' : 'Save home'}
          </Text>
        </Pressable>
      </View>
    </View>
  )
}
