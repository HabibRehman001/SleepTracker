/**
 * Step 178 — geofence battery: region monitoring, not GPS polling.
 * Contract proves HOME_GEOFENCE uses startGeofencingAsync only.
 * Manual: overnight drain with fence active ≈ normal few %, not 20%+.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  assertGeofenceUsesRegionMonitoring,
  BANNED_HOME_GEOFENCE_LOCATION_APIS,
  classifyOvernightGeofenceDrain,
  GEOFENCE_BATTERY_BODY,
  GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT,
  GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT,
  REQUIRED_HOME_GEOFENCE_API,
} from '../services/geofenceBattery.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const geo = readFileSync(join(root, 'services/homeGeofence.ts'), 'utf8')
const math = readFileSync(join(root, 'services/homeGeofenceMath.ts'), 'utf8')
const battery = readFileSync(join(root, 'services/geofenceBattery.ts'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.equal(REQUIRED_HOME_GEOFENCE_API, 'startGeofencingAsync')
assert.equal(GEOFENCE_OVERNIGHT_DRAIN_BUDGET_PERCENT, 5)
assert.equal(GEOFENCE_POLLING_DRAIN_RED_FLAG_PERCENT, 20)
assert.ok(GEOFENCE_BATTERY_BODY.includes('region-monitoring'))
assert.match(geo, /Location\.startGeofencingAsync/)
assert.match(geo, /region-monitoring|OS geofencing|Step 178/)
assert.match(battery, /startGeofencingAsync/)
assert.match(settings, /settings-geofence-battery/)
assert.match(settings, /GEOFENCE_BATTERY_BODY/)
assert.match(summary, /Step 178|6\.128.*178|region-monitoring|startGeofencingAsync/)
assert.ok(pkg.scripts['test:geofence-battery'])

const check = assertGeofenceUsesRegionMonitoring(geo)
assert.equal(check.ok, true, check.reasons.join('; '))

for (const banned of BANNED_HOME_GEOFENCE_LOCATION_APIS) {
  assert.doesNotMatch(geo, new RegExp(`(?:Location\\.|\\.)${banned}\\s*\\(`))
  assert.doesNotMatch(math, new RegExp(`(?:Location\\.|\\.)${banned}\\s*\\(`))
}

// No continuous location updates anywhere under services/ for home fence path
const callSite = (name) =>
  new RegExp(`(?:Location\\.|\\.)${name}\\s*\\(`)
const servicesDir = join(root, 'services')
for (const name of readdirSync(servicesDir)) {
  if (!name.endsWith('.ts')) continue
  if (name === 'geofenceBattery.ts') continue // documents banned names
  const src = readFileSync(join(servicesDir, name), 'utf8')
  if (
    name === 'homeGeofence.ts' ||
    name.includes('Geofence') ||
    name.includes('geofence')
  ) {
    assert.doesNotMatch(src, callSite('watchPositionAsync'))
    assert.doesNotMatch(src, callSite('startLocationUpdatesAsync'))
  }
}

// Synthetic overnight drain classification (manual device test uses same thresholds)
assert.equal(classifyOvernightGeofenceDrain(3).withinBudget, true)
assert.equal(classifyOvernightGeofenceDrain(3).redFlagContinuousGps, false)
assert.equal(classifyOvernightGeofenceDrain(4).comparableToNormalStandby, true)
assert.equal(classifyOvernightGeofenceDrain(22).withinBudget, false)
assert.equal(classifyOvernightGeofenceDrain(22).redFlagContinuousGps, true)

// Guard helper rejects polling source
const bad = assertGeofenceUsesRegionMonitoring(`
  setInterval(() => Location.getCurrentPositionAsync(), 5000)
`)
assert.equal(bad.ok, false)

const badWatch = assertGeofenceUsesRegionMonitoring(`
  Location.watchPositionAsync({}, () => {})
`)
assert.equal(badWatch.ok, false)
assert.ok(badWatch.reasons.some((r) => r.includes('watchPositionAsync')))

console.log(
  'Geofence battery OK — startGeofencingAsync only; overnight ≤5% budget (not 20%+ polling)'
)
