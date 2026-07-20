import { Pressable, Text, View } from 'react-native'

import { NOTIFICATION_PURPOSE } from '../../services/notifications'
import { openAppSettings } from '../../services/location'

type Props = {
  canAskAgain: boolean
  onTryAgain: () => void
}

/**
 * Shown when notifications were denied permanently (canAskAgain false).
 */
export function NotificationPermissionExplainer({
  canAskAgain,
  onTryAgain,
}: Props) {
  return (
    <View
      className="flex-1 justify-center px-8"
      testID="notification-permission-explainer"
    >
      <Text
        className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4"
        testID="notification-why-label"
      >
        Why we need this
      </Text>
      <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
        Notifications are required
      </Text>
      <Text
        className="text-muted-foreground text-[16px] leading-7 mb-8"
        testID="notification-why-body"
      >
        {NOTIFICATION_PURPOSE} Without them, you won’t get the lock countdown
        heads-up. You can’t continue until notifications are allowed.
      </Text>

      <Pressable
        className="bg-primary py-4 rounded-lg items-center mb-3"
        onPress={() => void openAppSettings()}
        testID="notification-open-settings"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Open Settings
        </Text>
      </Pressable>

      {canAskAgain ? (
        <Pressable
          className="border border-border py-4 rounded-lg items-center mb-3"
          onPress={onTryAgain}
          testID="notification-try-again"
        >
          <Text className="text-foreground text-base font-semibold">Try again</Text>
        </Pressable>
      ) : (
        <Text className="text-muted-foreground text-center text-sm mb-3 leading-5">
          Enable notifications in Settings, then tap OK.
        </Text>
      )}

      <Pressable
        className="border border-border py-4 rounded-lg items-center"
        onPress={onTryAgain}
        testID="notification-permission-ok"
      >
        <Text className="text-foreground text-base font-semibold">OK</Text>
      </Pressable>
    </View>
  )
}
