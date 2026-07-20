/**
 * Step 144 — static window ∩ home geofence (sleep only at home).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  distanceMeters,
  HOME_GEOFENCE_RADIUS_METERS,
  isInsideHomeGeofence,
} from '../services/geofence.ts'
import {
  findLongestSleepWindow,
  findLongestStaticWindow,
  synthesizeSamples,
} from '../services/staticWindow.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const staticSrc = readFileSync(join(root, 'services/staticWindow.ts'), 'utf8')
const geoSrc = readFileSync(join(root, 'services/geofence.ts'), 'utf8')

assert.match(staticSrc, /requireAtHome|findLongestSleepWindow|insideHomeGeofence/)
assert.match(geoSrc, /isInsideHomeGeofence|HOME_GEOFENCE_RADIUS/)
assert.ok(HOME_GEOFENCE_RADIUS_METERS > 0)

const home = { latitude: 31.5204, longitude: 74.3587 }
const friend = { latitude: 31.55, longitude: 74.35 } // ~3km+ away
assert.equal(isInsideHomeGeofence(home, home), true)
assert.equal(isInsideHomeGeofence(friend, home), false)
assert.ok(distanceMeters(home, friend) > HOME_GEOFENCE_RADIUS_METERS)

const day = new Date(2026, 6, 20)
function at(h, m, dayOffset = 0) {
  const d = new Date(day)
  d.setDate(d.getDate() + dayOffset)
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

const interval = 15 * 60 * 1000

// --- Prompt test: 4h static at friend's house → excluded from sleep ---
const friendStart = at(4, 0, 1)
const friendEnd = at(8, 0, 1) // 4 hours
const friendBlock = synthesizeSamples(friendStart, friendEnd, interval, true, {
  insideHomeGeofence: false,
  latitude: friend.latitude,
  longitude: friend.longitude,
})

assert.equal(
  findLongestSleepWindow(friendBlock, { minDurationMs: 3.5 * 60 * 60 * 1000 }),
  null,
  '4h static at friend must not count as sleep'
)

// Same 4h block without home filter would still be under default 6h min —
// with lowered min it would match motion-only, proving location is the gate:
const motionOnly = findLongestStaticWindow(friendBlock, {
  minDurationMs: 3.5 * 60 * 60 * 1000,
  requireAtHome: false,
})
assert.ok(motionOnly, 'motion-only should still see the 4h static run')

// --- 8h at home → accepted as sleep ---
const homeStart = at(4, 15, 1)
const homeEnd = at(12, 20, 1)
const homeBlock = synthesizeSamples(homeStart, homeEnd, interval, true, {
  insideHomeGeofence: true,
  latitude: home.latitude,
  longitude: home.longitude,
})
const sleep = findLongestSleepWindow(homeBlock)
assert.ok(sleep)
assert.equal(sleep.start.getTime(), homeStart)
assert.equal(sleep.end.getTime(), homeEnd)

// Mix: friend stillness earlier (different night) + home sleep → home wins
const friendEarlierStart = at(4, 0, 0) // previous calendar morning — still in night window
const friendEarlierEnd = at(8, 0, 0)
const friendEarlier = synthesizeSamples(
  friendEarlierStart,
  friendEarlierEnd,
  interval,
  true,
  {
    insideHomeGeofence: false,
    latitude: friend.latitude,
    longitude: friend.longitude,
  }
)
const mixed = findLongestSleepWindow([...friendEarlier, ...homeBlock], {
  minDurationMs: 3.5 * 60 * 60 * 1000,
})
assert.ok(mixed)
assert.equal(mixed.start.getTime(), homeStart)

console.log(
  'Home geofence sleep contract OK — friend 4h static excluded; home sleep kept'
)
