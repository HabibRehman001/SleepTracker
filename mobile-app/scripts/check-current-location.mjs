/**
 * Step 179 — Current location screen (you + home + distance).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatDistanceFromHome,
  regionFittingPoints,
  summarizeCurrentVsHome,
} from '../services/currentLocationMath.ts'
import { HOME_GEOFENCE_RADIUS_METERS } from '../services/geofence.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/current-location.tsx'), 'utf8')
const native = readFileSync(
  join(root, 'components/location/CurrentLocationMap.native.tsx'),
  'utf8'
)
const web = readFileSync(
  join(root, 'components/location/CurrentLocationMap.web.tsx'),
  'utf8'
)
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'app/current-location.tsx')))
assert.ok(existsSync(join(root, 'services/currentLocationMath.ts')))
assert.match(screen, /current-location-screen/)
assert.match(screen, /CurrentLocationMap/)
assert.match(screen, /summarizeCurrentVsHome|formatDistanceFromHome|distance/)
assert.match(screen, /getCurrentPositionAsync/)
assert.doesNotMatch(screen, /watchPositionAsync|startLocationUpdatesAsync/)
assert.match(native, /react-native-maps/)
assert.match(native, /Marker/)
assert.match(native, /current-location-home-marker|current-location-you-marker/)
assert.doesNotMatch(web, /from ['"]react-native-maps['"]/)
assert.match(layout, /current-location/)
assert.match(settings, /settings-open-current-location|current-location/)
assert.match(index, /open-current-location|current-location/)
assert.match(summary, /Step 179|6\.129.*179|Current location/)
assert.ok(pkg.scripts['test:current-location'])

const home = { latitude: 31.52, longitude: 74.35 }
const nearby = { latitude: 31.5205, longitude: 74.3505 }
const far = { latitude: 31.55, longitude: 74.4 }

assert.equal(formatDistanceFromHome(120), '120 m from home')
assert.equal(formatDistanceFromHome(2400), '2.4 km from home')

const nearSummary = summarizeCurrentVsHome(nearby, home)
assert.ok(nearSummary.distanceMeters < HOME_GEOFENCE_RADIUS_METERS * 2)
assert.match(nearSummary.distanceLabel, /from home/)

const farSummary = summarizeCurrentVsHome(far, home)
assert.equal(farSummary.insideHomeGeofence, false)
assert.ok(farSummary.distanceMeters > HOME_GEOFENCE_RADIUS_METERS)

const region = regionFittingPoints(nearby, home)
assert.ok(region.latitudeDelta > 0)
assert.ok(region.longitudeDelta > 0)

console.log(
  'Current location screen OK — map + home marker + distance (one-shot GPS)'
)
