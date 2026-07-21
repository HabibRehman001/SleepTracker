/**
 * Step 136 — notification permissions for lock-in-30-min alert.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyNotificationPermission } from '../services/notificationPermissionPhase.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const notifications = readFileSync(join(root, 'services/notifications.ts'), 'utf8')
const screen = readFileSync(
  join(root, 'app/notification-permission.tsx'),
  'utf8'
)
const explainer = readFileSync(
  join(root, 'components/notifications/NotificationPermissionExplainer.tsx'),
  'utf8'
)
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const motion = readFileSync(join(root, 'app/motion-permission.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/useAppStore.ts'), 'utf8')

assert.ok(existsSync(join(root, 'app/notification-permission.tsx')))
assert.match(notifications, /requestPermissionsAsync/)
assert.match(notifications, /requestNotificationPermissions/)
assert.match(notifications, /LOCK_WARNING_MINUTES/)
assert.match(notifications, /scheduleLockWarningNotification|lock in/)
assert.match(notifications, /Phone locks in 30 minutes|PRE_LOCK_WARNING_BODY/)

assert.match(screen, /requestNotificationPermissions/)
assert.match(screen, /NotificationPermissionExplainer/)
assert.match(screen, /testID=["']notification-permission-screen["']/)
assert.match(screen, /LOCK_WARNING_MINUTES/)
assert.match(screen, /showPermissionRequiredAlert/)
assert.doesNotMatch(screen, /onContinueWithout|Continue without/)
assert.match(layout, /notification-permission/)
assert.match(motion, /notification-permission/)
assert.match(store, /notificationSetupDone/)

assert.ok(
  (appJson.expo.android?.permissions ?? []).includes('POST_NOTIFICATIONS'),
  'Android POST_NOTIFICATIONS'
)
assert.match(JSON.stringify(appJson.expo.plugins ?? []), /expo-notifications/)

assert.equal(classifyNotificationPermission('granted'), 'granted')
assert.equal(classifyNotificationPermission('denied'), 'denied')
assert.equal(classifyNotificationPermission('undetermined'), 'undetermined')

console.log(
  'Notification permissions contract OK — lock-in-30-min alert permission'
)
