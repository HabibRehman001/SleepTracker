/**
 * Step 135 — motion / activity recognition permissions contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyMotionPermission } from '../services/motionPermissionPhase.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const sensors = readFileSync(join(root, 'services/sensors.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/motion-permission.tsx'), 'utf8')
const explainer = readFileSync(
  join(root, 'components/motion/MotionPermissionExplainer.tsx'),
  'utf8'
)
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const locationScreen = readFileSync(
  join(root, 'app/location-permission.tsx'),
  'utf8'
)
const store = readFileSync(join(root, 'store/useAppStore.ts'), 'utf8')

assert.ok(existsSync(join(root, 'app/motion-permission.tsx')))
assert.match(sensors, /Accelerometer\.requestPermissionsAsync/)
assert.match(sensors, /Pedometer\.requestPermissionsAsync/)
assert.match(sensors, /requestMotionPermissions/)
assert.match(sensors, /ACTIVITY_RECOGNITION|Core Motion/)

assert.match(screen, /requestMotionPermissions/)
assert.match(screen, /MotionPermissionExplainer/)
assert.match(screen, /testID=["']motion-permission-screen["']/)

assert.match(explainer, /Why we need this/)
assert.match(explainer, /testID=["']motion-open-settings["']/)
assert.doesNotMatch(explainer, /Continue without/)
assert.doesNotMatch(screen, /onContinueWithout|Continue without/)
assert.match(screen, /showPermissionRequiredAlert/)

assert.match(layout, /motion-permission/)
assert.match(locationScreen, /motion-permission/)
assert.match(store, /motionSetupDone/)

const plugins = JSON.stringify(appJson.expo.plugins ?? [])
assert.match(plugins, /expo-sensors/)
assert.match(plugins, /motionPermission|NSMotion/)
assert.ok(
  (appJson.expo.android?.permissions ?? []).includes('ACTIVITY_RECOGNITION'),
  'Android ACTIVITY_RECOGNITION'
)
assert.ok(
  appJson.expo.ios?.infoPlist?.NSMotionUsageDescription,
  'iOS NSMotionUsageDescription'
)

assert.equal(
  classifyMotionPermission('denied', 'undetermined'),
  'accelerometer_denied'
)
assert.equal(
  classifyMotionPermission('granted', 'denied'),
  'activity_denied'
)
assert.equal(classifyMotionPermission('granted', 'granted'), 'granted')

console.log(
  'Motion permissions contract OK — accelerometer + ACTIVITY_RECOGNITION / Core Motion'
)
