import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

/**
 * Soft breathing orb — slow expand/fade. Presence without urgency (Step 160).
 */
export function BreathingOrb({ testID = 'locked-breathing' }: { testID?: string }) {
  const scale = useRef(new Animated.Value(0.88)).current
  const opacity = useRef(new Animated.Value(0.28)).current

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, {
            toValue: 1.06,
            duration: 4200,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.88,
            duration: 4200,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.48,
            duration: 4200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.28,
            duration: 4200,
            useNativeDriver: true,
          }),
        ]),
      ])
    )
    pulse.start()
    return () => {
      pulse.stop()
    }
  }, [scale, opacity])

  return (
    <View
      className="items-center justify-center"
      style={{ height: 200 }}
      testID={testID}
    >
      <Animated.View
        style={{
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: 'rgba(120, 145, 168, 0.22)',
          borderWidth: 1,
          borderColor: 'rgba(160, 180, 200, 0.18)',
          opacity,
          transform: [{ scale }],
        }}
        testID={`${testID}-orb`}
      />
    </View>
  )
}
