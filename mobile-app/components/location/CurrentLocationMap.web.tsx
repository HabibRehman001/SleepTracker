import { Text, View } from 'react-native'

import type { CurrentLocationMapProps } from './currentLocationMapTypes'

/**
 * Web fallback — no react-native-maps (same pattern as HomeMapPicker.web).
 */
export function CurrentLocationMap({
  current,
  home,
}: CurrentLocationMapProps) {
  return (
    <View
      className="flex-1 overflow-hidden rounded-lg border border-border items-center justify-center px-6"
      style={{ backgroundColor: '#1a1a22' }}
      testID="current-location-map-web"
    >
      <Text className="text-foreground text-lg font-semibold mb-2 text-center">
        Current location
      </Text>
      <Text className="text-muted-foreground text-center text-[14px] leading-5 mb-4">
        Web preview shows coordinates (native builds use the real map).
      </Text>
      {current ? (
        <Text
          className="text-foreground font-mono text-sm mb-2"
          testID="current-location-you-coords"
        >
          You {current.latitude.toFixed(5)}, {current.longitude.toFixed(5)}
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm mb-2">Locating…</Text>
      )}
      {home ? (
        <Text
          className="text-muted-foreground font-mono text-sm"
          testID="current-location-home-coords"
        >
          Home {home.latitude.toFixed(5)}, {home.longitude.toFixed(5)}
        </Text>
      ) : (
        <Text className="text-muted-foreground text-sm">Home not set</Text>
      )}
    </View>
  )
}
