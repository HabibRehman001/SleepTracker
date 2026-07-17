import { useRef, useState } from 'react'
import {
  Animated,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { OnboardingSlideView } from './OnboardingSlideView'
import { ONBOARDING_SLIDES } from './slides'

type Props = {
  onFinished: () => void
}

/**
 * Swipeable welcome pager — 4 screens (Step 133).
 */
export function OnboardingPager({ onFinished }: Props) {
  const insets = useSafeAreaInsets()
  const width = Dimensions.get('window').width
  const scrollRef = useRef<ScrollView>(null)
  const [index, setIndex] = useState(0)
  const scrollX = useRef(new Animated.Value(0)).current

  const last = index >= ONBOARDING_SLIDES.length - 1

  const onMomentumEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width)
    setIndex(Math.max(0, Math.min(next, ONBOARDING_SLIDES.length - 1)))
  }

  const goNext = () => {
    if (last) {
      onFinished()
      return
    }
    const next = index + 1
    scrollRef.current?.scrollTo({ x: next * width, animated: true })
    setIndex(next)
  }

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="onboarding-screen"
    >
      {/* Soft atmosphere — not a flat void */}
      <View
        pointerEvents="none"
        className="absolute inset-0"
        style={{
          backgroundColor: '#0a0a0a',
        }}
      />
      <View
        pointerEvents="none"
        className="absolute -top-24 left-[-20%] h-72 w-[140%] rounded-full opacity-30"
        style={{ backgroundColor: '#1a1a22' }}
      />
      <View
        pointerEvents="none"
        className="absolute bottom-0 right-[-30%] h-80 w-[90%] rounded-full opacity-25"
        style={{ backgroundColor: '#141418' }}
      />

      <View className="flex-row items-center justify-between px-6 pt-3 pb-2">
        <Text className="text-foreground text-base font-semibold tracking-wide">
          Sleep Lock
        </Text>
        {!last ? (
          <Pressable onPress={onFinished} hitSlop={12} testID="onboarding-skip">
            <Text className="text-muted-foreground text-[15px]">Skip</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumEnd}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
        testID="onboarding-pager"
      >
        {ONBOARDING_SLIDES.map((slide) => (
          <OnboardingSlideView key={slide.key} slide={slide} width={width} />
        ))}
      </Animated.ScrollView>

      <View className="px-8 pb-6 pt-2">
        <View
          className="flex-row items-center justify-center gap-2 mb-7"
          testID="onboarding-dots"
        >
          {ONBOARDING_SLIDES.map((slide, i) => {
            const inputRange = [(i - 1) * width, i * width, (i + 1) * width]
            const dotWidth = scrollX.interpolate({
              inputRange,
              outputRange: [8, 22, 8],
              extrapolate: 'clamp',
            })
            const opacity = scrollX.interpolate({
              inputRange,
              outputRange: [0.35, 1, 0.35],
              extrapolate: 'clamp',
            })
            return (
              <Animated.View
                key={slide.key}
                style={{
                  width: dotWidth,
                  opacity,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#fafafa',
                }}
              />
            )
          })}
        </View>

        <Pressable
          className="bg-primary py-4 rounded-lg items-center"
          onPress={goNext}
          testID={last ? 'onboarding-done' : 'onboarding-next'}
        >
          <Text className="text-primary-foreground text-base font-semibold">
            {last ? 'Get started' : 'Next'}
          </Text>
        </Pressable>

        <Text className="text-muted-foreground text-center text-xs mt-4 leading-5">
          {index + 1} / {ONBOARDING_SLIDES.length} — swipe or tap Next
        </Text>
      </View>
    </View>
  )
}
