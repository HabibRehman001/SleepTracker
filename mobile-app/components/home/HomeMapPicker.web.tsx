import { createElement, useCallback, useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native'

import {
  DEFAULT_MAP_REGION,
  type HomeMapPickerProps,
} from './homeMapTypes'

/** Public Google Maps embed (no API key) — pin + surrounding map. */
export function googleMapsEmbedUrl(
  latitude: number,
  longitude: number,
  zoom = 16
): string {
  const q = `${latitude},${longitude}`
  return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=${zoom}&output=embed`
}

async function geocodeAddress(
  query: string
): Promise<{ latitude: number; longitude: number; label: string } | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: query,
      format: 'json',
      limit: '1',
    }).toString()
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      // Nominatim usage policy asks for a valid identifying UA.
      'User-Agent': 'SleepLock/1.0 (home-location setup)',
    },
  })
  if (!res.ok) return null
  const data = (await res.json()) as Array<{
    lat: string
    lon: string
    display_name?: string
  }>
  if (!data?.length) return null
  const latitude = Number(data[0].lat)
  const longitude = Number(data[0].lon)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null
  return {
    latitude,
    longitude,
    label: data[0].display_name ?? query,
  }
}

/**
 * Web map picker — Google Maps iframe + search / current-location pin.
 * (react-native-maps is native-only; iframe gives a real map on localhost web.)
 */
export function HomeMapPicker({
  coords,
  onPick,
  initialRegion,
}: HomeMapPickerProps) {
  const region = initialRegion ?? {
    ...DEFAULT_MAP_REGION,
    ...(coords
      ? { latitude: coords.latitude, longitude: coords.longitude }
      : {}),
  }
  const lat = coords?.latitude ?? region.latitude
  const lng = coords?.longitude ?? region.longitude

  const [query, setQuery] = useState('')
  const [busy, setBusy] = useState(false)
  const [hint, setHint] = useState<string | null>(null)

  const apply = useCallback(
    (latitude: number, longitude: number, message?: string) => {
      onPick({ latitude, longitude })
      setHint(message ?? null)
    },
    [onPick]
  )

  const onSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setBusy(true)
    setHint(null)
    try {
      const hit = await geocodeAddress(q)
      if (!hit) {
        setHint('No results — try a fuller address or place name.')
        return
      }
      apply(hit.latitude, hit.longitude, hit.label)
    } catch {
      setHint('Search failed — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }, [apply, query])

  const onUseMyLocation = useCallback(async () => {
    setBusy(true)
    setHint(null)
    try {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        setHint('Geolocation is not available in this browser.')
        return
      }
      await new Promise<void>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            apply(
              pos.coords.latitude,
              pos.coords.longitude,
              'Pin set to your current location'
            )
            resolve()
          },
          (err) => reject(err),
          { enableHighAccuracy: true, timeout: 15_000 }
        )
      })
    } catch {
      setHint('Could not read your location — allow location access and retry.')
    } finally {
      setBusy(false)
    }
  }, [apply])

  const iframe = createElement('iframe', {
    src: googleMapsEmbedUrl(lat, lng),
    title: 'Google Maps — home location',
    style: {
      border: 0,
      width: '100%',
      height: '100%',
      borderRadius: 8,
      minHeight: 280,
    },
    allowFullScreen: true,
    loading: 'lazy',
    referrerPolicy: 'no-referrer-when-downgrade',
    'data-testid': 'home-map-google-iframe',
  })

  return (
    <View
      className="flex-1 overflow-hidden rounded-lg border border-border"
      testID="home-map-web-fallback"
      style={{ minHeight: 360 }}
    >
      <View className="px-3 pt-3 pb-2 gap-2 border-b border-border">
        <View className="flex-row gap-2 items-center">
          <TextInput
            className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-foreground text-[15px]"
            placeholder="Search address or place…"
            placeholderTextColor="#888"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => void onSearch()}
            returnKeyType="search"
            editable={!busy}
            testID="home-map-search-input"
          />
          <Pressable
            className={`bg-primary px-4 py-2.5 rounded-lg ${busy ? 'opacity-50' : ''}`}
            onPress={() => void onSearch()}
            disabled={busy}
            testID="home-map-search-submit"
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-sm">
                Search
              </Text>
            )}
          </Pressable>
        </View>
        <Pressable
          className="py-2 items-center"
          onPress={() => void onUseMyLocation()}
          disabled={busy}
          testID="home-map-use-my-location"
        >
          <Text className="text-sidebar-primary text-[14px] font-medium">
            Use my current location
          </Text>
        </Pressable>
      </View>

      <View className="flex-1" style={{ minHeight: 280 }} testID="home-map-iframe-wrap">
        {iframe}
      </View>

      <View className="px-3 py-3 border-t border-border">
        {hint ? (
          <Text
            className="text-muted-foreground text-center text-xs mb-2 leading-4"
            testID="home-map-hint"
          >
            {hint}
          </Text>
        ) : (
          <Text className="text-muted-foreground text-center text-xs mb-2 leading-4">
            Search or use your location to place the home pin on the map.
          </Text>
        )}
        {coords ? (
          <Text
            className="text-foreground font-mono text-xs text-center"
            testID="home-map-coords"
          >
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text className="text-muted-foreground text-xs text-center">
            No pin yet
          </Text>
        )}
      </View>
    </View>
  )
}
