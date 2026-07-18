/**
 * Step 137 — set-home map picker + backend persistence contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const screen = readFileSync(join(root, 'app/set-home.tsx'), 'utf8')
const pickerNative = readFileSync(
  join(root, 'components/home/HomeMapPicker.native.tsx'),
  'utf8'
)
const pickerWeb = readFileSync(
  join(root, 'components/home/HomeMapPicker.web.tsx'),
  'utf8'
)
const api = readFileSync(join(root, 'services/homeLocation.ts'), 'utf8')
const store = readFileSync(join(root, 'store/homeLocationStore.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const notif = readFileSync(
  join(root, 'app/notification-permission.tsx'),
  'utf8'
)
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const appStore = readFileSync(join(root, 'store/useAppStore.ts'), 'utf8')

assert.ok(pkg.dependencies['react-native-maps'], 'react-native-maps installed')
assert.ok(existsSync(join(root, 'app/set-home.tsx')))
assert.ok(existsSync(join(root, 'components/home/HomeMapPicker.native.tsx')))
assert.ok(existsSync(join(root, 'components/home/HomeMapPicker.web.tsx')))
assert.match(pickerNative, /react-native-maps/)
assert.match(pickerNative, /MapView|Marker/)
assert.doesNotMatch(pickerWeb, /from ['"]react-native-maps['"]/)
assert.match(screen, /HomeMapPicker/)
assert.match(screen, /persistToBackend|saveHomeLocation/)
assert.match(screen, /testID=["']home-save["']/)
assert.match(api, /PUT|method:\s*['"]PUT['"]/)
assert.match(api, /\/home-location/)
assert.match(store, /hydrateFromBackend/)
assert.match(store, /persistToBackend/)
assert.match(layout, /set-home/)
assert.match(notif, /set-home/)
assert.match(index, /hydrateFromBackend|set-home/)
assert.match(appStore, /homeSetupDone/)

console.log('Set-home map picker contract OK — maps + backend persist')
