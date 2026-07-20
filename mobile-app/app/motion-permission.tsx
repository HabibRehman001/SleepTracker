import { useCallback, useState } from 'react'
import { Platform, Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { MotionPermissionExplainer } from '../components/motion/MotionPermissionExplainer'
import {
  ACTIVITY_RECOGNITION_WHY,
  MOTION_PURPOSE,
  requestMotionPermissions,
  type MotionPermissionPhase,
} from '../services/sensors'
import { showPermissionRequiredAlert } from '../services/permissionGate'
import { useAppStore } from '../store/useAppStore'

/**
 * Hard-gated motion / activity permission — cannot continue without Allow.
 */
export default function MotionPermissionScreen() {
  const insets = useSafeAreaInsets()
  const setMotionSetupDone = useAppStore((s) => s.setMotionSetupDone)

  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<MotionPermissionPhase | 'intro'>('intro')
  const [canAskAgain, setCanAskAgain] = useState(true)

  const request = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestMotionPermissions()
      const askAgain =
        result.phase === 'accelerometer_denied'
          ? result.canAskAgainAccelerometer
          : result.canAskAgainActivity
      setCanAskAgain(askAgain)

      if (result.phase === 'granted') {
        setMotionSetupDone(true)
        router.replace('/notification-permission')
        return
      }

      if (askAgain) {
        setPhase('intro')
        showPermissionRequiredAlert({
          canAskAgain: true,
          onRetry: () => void request(),
          detail:
            'Motion and step counting are required for your sleep baseline. Tap OK to allow access.',
        })
      } else {
        setPhase(result.phase)
      }
    } catch (err: unknown) {
      console.error(err)
      setPhase('intro')
      showPermissionRequiredAlert({
        canAskAgain: true,
        onRetry: () => void request(),
      })
    } finally {
      setBusy(false)
    }
  }, [setMotionSetupDone])

  const showExplainer =
    (phase === 'accelerometer_denied' || phase === 'activity_denied') &&
    !canAskAgain

  const platformHint =
    Platform.OS === 'android'
      ? 'Android will ask for Activity Recognition (ACTIVITY_RECOGNITION).'
      : Platform.OS === 'ios'
        ? 'iOS will authorize Core Motion for the pedometer.'
        : 'On web, the browser may prompt for device motion access.'

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="motion-permission-screen"
    >
      <View
        pointerEvents="none"
        className="absolute bottom-0 right-[-25%] h-72 w-[90%] rounded-full opacity-25"
        style={{ backgroundColor: '#141418' }}
      />

      {showExplainer ? (
        <MotionPermissionExplainer
          kind={phase === 'accelerometer_denied' ? 'accelerometer' : 'activity'}
          canAskAgain={canAskAgain}
          onTryAgain={() => void request()}
        />
      ) : (
        <View className="flex-1 justify-center px-8">
          <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4">
            Permissions
          </Text>
          <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
            Motion & steps
          </Text>
          <Text className="text-muted-foreground text-[16px] leading-7 mb-3">
            {MOTION_PURPOSE}
          </Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-2">
            {ACTIVITY_RECOGNITION_WHY}
          </Text>
          <Text className="text-muted-foreground text-[14px] leading-6 mb-8">
            We’ll enable the accelerometer, then request step counting.{' '}
            {platformHint} You must allow to continue.
          </Text>

          <Pressable
            className={`bg-primary py-4 rounded-lg items-center ${busy ? 'opacity-50' : ''}`}
            onPress={() => void request()}
            disabled={busy}
            testID="motion-request-permissions"
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {busy ? 'Requesting…' : 'Allow motion & steps'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
