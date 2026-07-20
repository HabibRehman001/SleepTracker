/**
 * Step 134 — two-step location permissions + denial explainer contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { classifyLocationPermission } from '../services/locationPermissionPhase.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const locationSrc = readFileSync(join(root, 'services/location.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/location-permission.tsx'), 'utf8')
const explainer = readFileSync(
  join(root, 'components/location/LocationPermissionExplainer.tsx'),
  'utf8'
)
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const onboarding = readFileSync(join(root, 'app/onboarding.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/useAppStore.ts'), 'utf8')

assert.ok(existsSync(join(root, 'app/location-permission.tsx')))
assert.match(locationSrc, /requestForegroundPermissionsAsync/)
assert.match(locationSrc, /requestBackgroundPermissionsAsync/)
assert.match(locationSrc, /requestLocationPermissionsTwoStep/)
assert.match(locationSrc, /openAppSettings|Linking\.openSettings/)
assert.match(locationSrc, /BACKGROUND_LOCATION_WHY/)

assert.match(screen, /requestLocationPermissionsTwoStep/)
assert.match(screen, /LocationPermissionExplainer/)
assert.match(screen, /testID=["']location-permission-screen["']/)

assert.match(explainer, /Why we need this/)
assert.match(explainer, /testID=["']location-open-settings["']/)
assert.match(explainer, /testID=["']location-why-body["']/)
assert.match(explainer, /BACKGROUND_LOCATION_WHY|background location/i)
assert.doesNotMatch(explainer, /Continue without/)
assert.doesNotMatch(screen, /onContinueWithout|Continue without/)
assert.match(
  readFileSync(join(root, 'services/permissionGate.ts'), 'utf8'),
  /Permission required/
)
assert.match(screen, /showPermissionRequiredAlert/)

assert.match(layout, /location-permission/)
assert.match(onboarding, /auth/)
assert.match(store, /locationSetupDone/)

// PermissionStatus string values (avoid expo-location ESM named-export quirks in tsx)
assert.equal(
  classifyLocationPermission('denied', 'undetermined'),
  'foreground_denied'
)
assert.equal(
  classifyLocationPermission('granted', 'denied'),
  'background_denied'
)
assert.equal(classifyLocationPermission('granted', 'granted'), 'granted')

console.log('Location permissions contract OK — two-step + denial explainer')
