import { Pressable, Text, View } from 'react-native'

import {
  DEFAULT_MAP_REGION,
  type HomeMapPickerProps,
} from './homeMapTypes'

/**
 * Web map picker — no react-native-maps (codegenNativeComponent is native-only).
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

  return (
    <View
      className="flex-1 overflow-hidden rounded-lg border border-border"
      testID="home-map-web-fallback"
    >
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: '#1a1a22' }}
        onPress={() =>
          onPick({
            latitude: region.latitude,
            longitude: region.longitude,
          })
        }
        testID="home-map-web-tap"
      >
        <Text className="text-foreground text-lg font-semibold mb-2 text-center">
          Tap to drop a home pin
        </Text>
        <Text className="text-muted-foreground text-center text-[14px] leading-5 mb-4">
          Web preview uses a coordinate pad (native builds use the real map).
        </Text>
        {coords ? (
          <Text
            className="text-foreground font-mono text-sm"
            testID="home-map-coords"
          >
            {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
          </Text>
        ) : (
          <Text className="text-muted-foreground text-sm">No pin yet</Text>
        )}
      </Pressable>
      <View className="flex-row border-t border-border">
        {(
          [
            ['N', 0.002, 0],
            ['S', -0.002, 0],
            ['E', 0, 0.002],
            ['W', 0, -0.002],
          ] as const
        ).map(([label, dLat, dLng]) => (
          <Pressable
            key={label}
            className="flex-1 py-3 items-center border-r border-border"
            onPress={() => {
              const base = coords ?? {
                latitude: region.latitude,
                longitude: region.longitude,
              }
              onPick({
                latitude: base.latitude + dLat,
                longitude: base.longitude + dLng,
              })
            }}
            testID={`home-map-nudge-${label}`}
          >
            <Text className="text-foreground font-semibold">{label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}
