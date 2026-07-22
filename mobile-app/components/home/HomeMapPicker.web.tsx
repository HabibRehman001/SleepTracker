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

export type GeocodeHit = {
  latitude: number
  longitude: number
  label: string
}

/**
 * OpenStreetMap embed with an explicit marker at lat/lng.
 * Same coords the app saves — avoids Google unofficial-embed snapping elsewhere.
 */
export function mapEmbedUrl(
  latitude: number,
  longitude: number,
  pad = 0.008
): string {
  const west = longitude - pad
  const south = latitude - pad
  const east = longitude + pad
  const north = latitude + pad
  const bbox = [west, south, east, north].map(encodeURIComponent).join('%2C')
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${encodeURIComponent(`${latitude},${longitude}`)}`
}

/** @deprecated Use mapEmbedUrl — kept for contract tests naming. */
export function googleMapsEmbedUrl(
  latitude: number,
  longitude: number
): string {
  return mapEmbedUrl(latitude, longitude)
}

async function geocodeAddress(query: string): Promise<GeocodeHit[]> {
  const url =
    'https://nominatim.openstreetmap.org/search?' +
    new URLSearchParams({
      q: query,
      format: 'json',
      limit: '5',
      addressdetails: '1',
    }).toString()
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'User-Agent': 'SleepLock/1.0 (home-location setup)',
    },
  })
  if (!res.ok) return []
  const data = (await res.json()) as Array<{
    lat: string
    lon: string
    display_name?: string
  }>
  if (!Array.isArray(data)) return []
  const hits: GeocodeHit[] = []
  for (const row of data) {
    const latitude = Number(row.lat)
    const longitude = Number(row.lon)
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) continue
    hits.push({
      latitude,
      longitude,
      label: row.display_name ?? query,
    })
  }
  return hits
}

/**
 * Web map picker — OSM iframe (exact marker) + address search with result pick.
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
  const [results, setResults] = useState<GeocodeHit[]>([])

  const apply = useCallback(
    (latitude: number, longitude: number, message?: string) => {
      onPick({ latitude, longitude })
      setHint(message ?? null)
      setResults([])
    },
    [onPick]
  )

  const onSearch = useCallback(async () => {
    const q = query.trim()
    if (!q) return
    setBusy(true)
    setHint(null)
    setResults([])
    try {
      const hits = await geocodeAddress(q)
      if (!hits.length) {
        setHint('No results — try a fuller street address or city.')
        return
      }
      if (hits.length === 1) {
        apply(hits[0].latitude, hits[0].longitude, hits[0].label)
        return
      }
      setResults(hits)
      setHint('Pick the matching address below — the map pin follows your choice.')
    } catch {
      setHint('Search failed — check your connection and try again.')
    } finally {
      setBusy(false)
    }
  }, [apply, query])

  const onUseMyLocation = useCallback(async () => {
    setBusy(true)
    setHint(null)
    setResults([])
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
    key: `${lat.toFixed(6)},${lng.toFixed(6)}`,
    src: mapEmbedUrl(lat, lng),
    title: 'Map — home location',
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
            placeholder="Search full address or place…"
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
        {results.length > 0 ? (
          <View className="gap-1.5 pb-1" testID="home-map-search-results">
            {results.map((hit, i) => (
              <Pressable
                key={`${hit.latitude}-${hit.longitude}-${i}`}
                className="bg-card border border-border rounded-lg px-3 py-2.5"
                onPress={() => apply(hit.latitude, hit.longitude, hit.label)}
                testID={`home-map-result-${i}`}
              >
                <Text
                  className="text-foreground text-[13px] leading-5"
                  numberOfLines={2}
                >
                  {hit.label}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>

      <View
        className="flex-1"
        style={{ minHeight: 280 }}
        testID="home-map-iframe-wrap"
      >
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
            Search a full address, pick a result, or use your location. The pin
            matches the coordinates you save.
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
