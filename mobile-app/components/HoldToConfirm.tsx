import { useRef, useState } from 'react'
import {
  Animated,
  Pressable,
  Text,
  View,
  type GestureResponderEvent,
} from 'react-native'

const DEFAULT_HOLD_MS = 2000

type HoldToConfirmProps = {
  label: string
  holdingLabel?: string
  onConfirm: () => void
  disabled?: boolean
  holdMs?: number
  testID?: string
}

/**
 * Step 150 — deliberate hold-to-confirm (not a casual tap).
 */
export function HoldToConfirm({
  label,
  holdingLabel = 'Keep holding…',
  onConfirm,
  disabled = false,
  holdMs = DEFAULT_HOLD_MS,
  testID = 'hold-to-confirm',
}: HoldToConfirmProps) {
  const [holding, setHolding] = useState(false)
  const progress = useRef(new Animated.Value(0)).current
  const animRef = useRef<Animated.CompositeAnimation | null>(null)
  const doneRef = useRef(false)

  const reset = () => {
    animRef.current?.stop()
    animRef.current = null
    doneRef.current = false
    setHolding(false)
    progress.setValue(0)
  }

  const onPressIn = (_e: GestureResponderEvent) => {
    if (disabled) return
    doneRef.current = false
    setHolding(true)
    progress.setValue(0)
    animRef.current = Animated.timing(progress, {
      toValue: 1,
      duration: holdMs,
      useNativeDriver: false,
    })
    animRef.current.start(({ finished }) => {
      if (finished && !doneRef.current) {
        doneRef.current = true
        setHolding(false)
        progress.setValue(0)
        onConfirm()
      }
    })
  }

  const onPressOut = () => {
    if (doneRef.current) return
    reset()
  }

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  })

  return (
    <Pressable
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      className={`overflow-hidden rounded-lg border border-border ${disabled ? 'opacity-50' : ''}`}
    >
      <View
        className="py-5 items-center justify-center relative min-h-[56px]"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.18)' }}
      >
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width,
            backgroundColor: 'rgba(239, 68, 68, 0.45)',
          }}
          testID={`${testID}-progress`}
        />
        <Text className="text-foreground text-base font-semibold z-10 px-4 text-center">
          {holding ? holdingLabel : label}
        </Text>
      </View>
    </Pressable>
  )
}
