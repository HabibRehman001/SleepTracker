import { Pressable, Text, View } from 'react-native'

import { BACKGROUND_LOCATION_WHY, LOCATION_PURPOSE } from '../../services/location'

type Props = {
  /** foreground_denied | background_denied */
  kind: 'foreground' | 'background'
  canAskAgain: boolean
  onTryAgain: () => void
  onContinueWithout: () => void
  onOpenSettings: () => void
}

/**
 * Shown when location permission is denied — never a silent failure (Step 134).
 */
export function LocationPermissionExplainer({
  kind,
  canAskAgain,
  onTryAgain,
  onContinueWithout,
  onOpenSettings,
}: Props) {
  const isBackground = kind === 'background'
  const title = isBackground
    ? 'Background location is off'
    : 'Location permission is off'
  const why = isBackground
    ? BACKGROUND_LOCATION_WHY
    : `${LOCATION_PURPOSE} We need “While using the app” before we can ask for background access.`

  return (
    <View className="flex-1 justify-center px-8" testID="location-permission-explainer">
      <Text
        className="text-muted-foreground text-xs font-semibold tracking-[0.18em] uppercase mb-4"
        testID="location-why-label"
      >
        Why we need this
      </Text>
      <Text className="text-foreground text-3xl font-semibold leading-tight mb-4">
        {title}
      </Text>
      <Text
        className="text-muted-foreground text-[16px] leading-7 mb-8"
        testID="location-why-body"
      >
        {why}
      </Text>

      <Pressable
        className="bg-primary py-4 rounded-lg items-center mb-3"
        onPress={onOpenSettings}
        testID="location-open-settings"
      >
        <Text className="text-primary-foreground text-base font-semibold">
          Open Settings
        </Text>
      </Pressable>

      {canAskAgain ? (
        <Pressable
          className="border border-border py-4 rounded-lg items-center mb-3"
          onPress={onTryAgain}
          testID="location-try-again"
        >
          <Text className="text-foreground text-base font-semibold">Try again</Text>
        </Pressable>
      ) : (
        <Text className="text-muted-foreground text-center text-sm mb-3 leading-5">
          Permission was denied permanently — enable it in Settings, then return here.
        </Text>
      )}

      <Pressable
        className="py-3 items-center"
        onPress={onContinueWithout}
        testID="location-continue-without"
      >
        <Text className="text-muted-foreground text-[15px]">
          Continue without {isBackground ? 'background ' : ''}location
        </Text>
      </Pressable>
    </View>
  )
}
