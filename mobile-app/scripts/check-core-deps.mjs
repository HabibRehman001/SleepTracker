/**
 * Step 120 — core deps for location, sensors, background tasks, state, queries.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const deps = pkg.dependencies

for (const name of [
  'expo-location',
  'expo-sensors',
  'expo-task-manager',
  'expo-background-fetch',
  'expo-notifications',
  'zustand',
  '@tanstack/react-query',
]) {
  assert.ok(deps[name], `missing dependency ${name}`)
}

const plugins = JSON.stringify(app.expo.plugins ?? [])
assert.match(plugins, /expo-location/)
assert.match(plugins, /expo-background-fetch/)
assert.match(plugins, /expo-notifications/)
assert.match(layout, /QueryClientProvider/)

assert.ok(
  (app.expo.ios?.infoPlist?.UIBackgroundModes ?? []).includes('location'),
  'iOS background location mode'
)
assert.ok(
  (app.expo.android?.permissions ?? []).includes('ACCESS_FINE_LOCATION'),
  'Android fine location permission'
)

console.log('Core deps contract OK — location/sensors/background/query/zustand')
