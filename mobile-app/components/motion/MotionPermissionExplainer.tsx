import { Pressable, Text, View } from 'react-native'

import {
  ACTIVITY_RECOGNITION_WHY,
  MOTION_PURPOSE,
} from '../../services/sensors'
import { openAppSettings } from '../../services/location'

type Props = {
  kind: 'accelerometer' | 'activity'
  canAskAgain: boolean
  onTryAgain: () => void
}

/**
 * Shown when motion was denied permanently (canAskAgain false).
 */
export function MotionPermissionExplainer({
  kind,
  canAskAgain,
  onTryAgain,
}: Props) {
  const isActivity = kind === 'activity'
  const title = isActivity
    ? 'Activity recognition is required'
    : 'Motion sensors are required'
  const why = isActivity ? ACTIVITY_RECOGNITION_WHY : MOTION_PURPOSE

  return (
    <View className="flex-1 justify-center px-8" testID="motion-permission-explainer">
      <Text
        className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4"
        testID="motion-why-label"
      >
        Why we need this
      </Text>
      <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
        {title}
      </Text>
      <Text
        className="text-muted-foreground text-[16px] leading-7 mb-8"
        testID="motion-why-body"
      >
        {why} You can’t continue until this is allowed.
      </Text>

      <Pressable
        className="bg-primary py-4 rounded-lg items-center mb-3"
        onPress={() => void openAppSettings()}
        testID="motion-open-settings"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Open Settings
        </Text>
      </Pressable>

      {canAskAgain ? (
        <Pressable
          className="border border-border py-4 rounded-lg items-center mb-3"
          onPress={onTryAgain}
          testID="motion-try-again"
        >
          <Text className="text-foreground text-base font-semibold">Try again</Text>
        </Pressable>
      ) : (
        <Text className="text-muted-foreground text-center text-sm mb-3 leading-5">
          Enable motion / activity access in Settings, then tap OK.
        </Text>
      )}

      <Pressable
        className="border border-border py-4 rounded-lg items-center"
        onPress={onTryAgain}
        testID="motion-permission-ok"
      >
        <Text className="text-foreground text-base font-semibold">OK</Text>
      </Pressable>
    </View>
  )
}
