import { useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'

import { LocationPermissionExplainer } from '../components/location/LocationPermissionExplainer'
import {
  LOCATION_PURPOSE,
  openAppSettings,
  requestLocationPermissionsTwoStep,
  type LocationPermissionPhase,
} from '../services/location'
import { useAppStore } from '../store/useAppStore'

/**
 * Step 134 — two-step location permission (foreground → background).
 * Background denial shows an explanation + settings deep-link (not silent).
 */
export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets()
  const setLocationSetupDone = useAppStore((s) => s.setLocationSetupDone)

  const [busy, setBusy] = useState(false)
  const [phase, setPhase] = useState<LocationPermissionPhase | 'intro'>('intro')
  const [canAskAgain, setCanAskAgain] = useState(true)

  const finish = useCallback(() => {
    setLocationSetupDone(true)
    router.replace('/motion-permission')
  }, [setLocationSetupDone])

  const request = useCallback(async () => {
    setBusy(true)
    try {
      const result = await requestLocationPermissionsTwoStep()
      setPhase(result.phase)
      setCanAskAgain(
        result.phase === 'foreground_denied'
          ? result.canAskAgainForeground
          : result.canAskAgainBackground
      )
      if (result.phase === 'granted') {
        setLocationSetupDone(true)
        router.replace('/motion-permission')
      }
    } catch (err: unknown) {
      // Treat unexpected errors like a denial — never fail silently.
      console.error(err)
      setPhase('background_denied')
      setCanAskAgain(true)
    } finally {
      setBusy(false)
    }
  }, [setLocationSetupDone])

  const showExplainer =
    phase === 'foreground_denied' || phase === 'background_denied'

  return (
    <View
      className="bg-background flex-1"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      testID="location-permission-screen"
    >
      <View
        pointerEvents="none"
        className="absolute -top-20 left-[-15%] h-64 w-[130%] rounded-full opacity-30"
        style={{ backgroundColor: '#1a1a22' }}
      />

      {showExplainer ? (
        <LocationPermissionExplainer
          kind={phase === 'foreground_denied' ? 'foreground' : 'background'}
          canAskAgain={canAskAgain}
          onTryAgain={() => void request()}
          onContinueWithout={finish}
          onOpenSettings={() => void openAppSettings()}
        />
      ) : (
        <View className="flex-1 justify-center px-8">
          <Text className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4">
            Permissions
          </Text>
          <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
            Location for geofencing
          </Text>
          <Text className="text-muted-foreground text-[16px] leading-7 mb-3">
            {LOCATION_PURPOSE}
          </Text>
          <Text className="text-muted-foreground text-[15px] leading-6 mb-8">
            We’ll ask twice: first while you use the app, then background access —
            both Android and iOS require that order.
          </Text>

          <Pressable
            className={`bg-primary py-4 rounded-lg items-center ${busy ? 'opacity-50' : ''}`}
            onPress={() => void request()}
            disabled={busy}
            testID="location-request-permissions"
          >
            <Text className="text-primary-foreground text-base font-semibold">
              {busy ? 'Requesting…' : 'Allow location'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}
