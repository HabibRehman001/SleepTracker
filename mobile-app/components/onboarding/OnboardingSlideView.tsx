import { Text, View } from 'react-native'

import type { OnboardingSlide } from './slides'

type Props = {
  slide: OnboardingSlide
  width: number
}

/**
 * One full-width onboarding panel (Step 133).
 */
export function OnboardingSlideView({ slide, width }: Props) {
  return (
    <View
      style={{ width }}
      className="flex-1 justify-center px-8"
      testID={`onboarding-slide-${slide.key}`}
    >
      <Text className="text-muted-foreground text-xs font-semibold tracking-[0.2em] uppercase mb-4">
        {slide.eyebrow}
      </Text>
      <Text className="text-foreground text-4xl font-semibold leading-tight mb-5">
        {slide.title}
      </Text>
      <Text className="text-muted-foreground text-[17px] leading-7">
        {slide.body}
      </Text>
    </View>
  )
}
