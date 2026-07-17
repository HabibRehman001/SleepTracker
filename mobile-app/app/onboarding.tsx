import { router } from 'expo-router'

import { OnboardingPager } from '../components/onboarding/OnboardingPager'
import { useAppStore } from '../store/useAppStore'
import { useBaselineStore } from '../store/baselineStore'
import { useScheduleStore } from '../store/scheduleStore'

/**
 * Welcome / onboarding — swipeable intro (Step 133).
 * Seeds baseline + draft schedule, then location permissions (Step 134).
 */
export default function OnboardingScreen() {
  const setOnboardingDone = useAppStore((s) => s.setOnboardingDone)
  const setBaseline = useBaselineStore((s) => s.setBaseline)
  const setSchedule = useScheduleStore((s) => s.setSchedule)

  const finish = () => {
    setBaseline({
      avgDailySteps: 6500,
      detectedBedtime: '23:00',
      detectedWaketime: '07:00',
      sampleNights: 2,
    })
    setSchedule('23:00', '07:00')
    setOnboardingDone(true)
    router.replace('/location-permission')
  }

  return <OnboardingPager onFinished={finish} />
}
