/**
 * Pure notification-permission phase (no expo imports — testable in Node).
 */
export type NotificationPermissionPhase = 'undetermined' | 'denied' | 'granted'

export function classifyNotificationPermission(
  status: string
): NotificationPermissionPhase {
  if (status === 'granted') return 'granted'
  if (status === 'undetermined') return 'undetermined'
  return 'denied'
}
