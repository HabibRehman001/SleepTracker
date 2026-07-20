import { Alert } from 'react-native'

import { openAppSettings } from './location'

/**
 * Hard gate: deny → "Permission required" + OK → re-prompt (or Settings).
 * User cannot skip required OS permissions.
 */
export function showPermissionRequiredAlert(options: {
  canAskAgain: boolean
  onRetry: () => void
  detail?: string
}): void {
  const detail =
    options.detail ??
    'Sleep Lock needs this permission to continue. Tap OK to allow access.'

  Alert.alert(
    'Permission required',
    options.canAskAgain
      ? detail
      : `${detail}\n\nEnable it in Settings, then return to the app.`,
    [
      {
        text: 'OK',
        onPress: () => {
          if (options.canAskAgain) {
            options.onRetry()
          } else {
            void openAppSettings()
          }
        },
      },
    ],
    { cancelable: false }
  )
}
