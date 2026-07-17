import { Link, router } from 'expo-router'
import { Pressable, Text, View } from 'react-native'

import { useAppStore } from '../store/useAppStore'
import { useBaselineStore } from '../store/baselineStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Onboarding — seeds baseline + draft schedule stores (Step 123).
 */
export default function OnboardingScreen() {
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone)
  const setBaseline = useBaselineStore((s) => s.setBaseline)
  const setSchedule = useScheduleStore((s) => s.setSchedule)

  const finish = () => {
    // Placeholder auto-detect until sensors land — still exercises the stores.
    setBaseline({
      avgDailySteps: 6500,
      detectedBedtime: '23:00',
      detectedWaketime: '07:00',
      sampleNights: 3,
    })
    setSchedule('23:00', '07:00')
    setOnboardingDone(true)
    router.replace('/')
  }

  return (
    <View
      className="bg-background flex-1 items-center justify-center px-6"
      testID="onboarding-screen"
    >
      <Text className="text-foreground text-3xl font-semibold mb-3">Welcome</Text>
      <Text className="text-muted-foreground text-center text-[15px] leading-6 mb-7">
        Sleep Lock keeps focus time protected. You can change lock settings
        anytime after setup.
      </Text>
      <Pressable
        className="bg-primary px-5 py-3 rounded-lg mb-4"
        onPress={finish}
        testID="onboarding-done"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Get started
        </Text>
      </Pressable>
      <Link href="/" asChild>
        <Pressable className="py-2" testID="onboarding-home-link">
          <Text className="text-sidebar-primary text-[15px]">Back to home</Text>
        </Pressable>
      </Link>
    </View>
  )
}
