/**
 * Step 174 — home geofence setup contract.
 * Physical / emulator: crossing 150m should fire HOME_GEOFENCE within ~30s.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildHomeGeofenceRegion,
  GEOFENCE_EVENT_ENTER,
  GEOFENCE_EVENT_EXIT,
  HOME_GEOFENCE_REGION_ID,
  HOME_GEOFENCE_TASK,
  interpretHomeGeofenceEvent,
} from '../services/homeGeofenceMath.ts'
import { HOME_GEOFENCE_RADIUS_METERS } from '../services/geofence.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const geo = readFileSync(join(root, 'services/homeGeofence.ts'), 'utf8')
const math = readFileSync(join(root, 'services/homeGeofenceMath.ts'), 'utf8')
const bg = readFileSync(join(root, 'services/backgroundTasks.ts'), 'utf8')
const setHome = readFileSync(join(root, 'app/set-home.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'services/homeGeofence.ts')))
assert.ok(existsSync(join(root, 'services/homeGeofenceMath.ts')))
assert.ok(pkg.dependencies['expo-location'])
assert.ok(pkg.dependencies['expo-task-manager'])
assert.equal(HOME_GEOFENCE_RADIUS_METERS, 150)
assert.equal(HOME_GEOFENCE_TASK, 'HOME_GEOFENCE')
assert.match(geo, /Location\.startGeofencingAsync/)
assert.match(geo, /TaskManager\.defineTask/)
assert.match(geo, /HOME_GEOFENCE/)
assert.match(geo, /GeofencingEventType|GEOFENCE_EVENT_ENTER|interpretHomeGeofenceEvent/)
assert.match(geo, /recordHomeArrival|syncHomeArrivalFromGeofenceEnter/)
assert.match(math, /notifyOnEnter:\s*true/)
assert.match(math, /radius:\s*radiusMeters|radius:/)
assert.match(bg, /homeGeofence|HOME_GEOFENCE/)
assert.match(layout, /backgroundTasks/)
assert.match(setHome, /startHomeGeofencing/)
assert.match(index, /syncHomeGeofencing|startHomeGeofencing/)
assert.match(summary, /Step 174|6\.124.*174|HOME_GEOFENCE/)

const region = buildHomeGeofenceRegion({ latitude: 31.52, longitude: 74.35 })
assert.equal(region.identifier, HOME_GEOFENCE_REGION_ID)
assert.equal(region.identifier, 'home')
assert.equal(region.radius, 150)
assert.equal(region.notifyOnEnter, true)
assert.equal(region.notifyOnExit, true)

  
assert.deepEqual(
  [
    region.identifier,
    region.latitude,
    region.longitude,
    region.radius,
    region.notifyOnEnter,
    region.notifyOnExit,
  ],
  ['home', 31.52, 74.35, 150, true, true]
)

const enter = interpretHomeGeofenceEvent(GEOFENCE_EVENT_ENTER)
assert.equal(enter.kind, 'enter')
assert.equal(enter.shouldRecordHomeArrival, true)
assert.equal(enter.inside, true)

const exit = interpretHomeGeofenceEvent(GEOFENCE_EVENT_EXIT)
assert.equal(exit.kind, 'exit')
assert.equal(exit.shouldRecordHomeArrival, false)
assert.equal(exit.inside, false)

assert.equal(interpretHomeGeofenceEvent(99).kind, 'ignore')

console.log(
  'Home geofence contract OK — HOME_GEOFENCE 150m; Enter → recordHomeArrival (manual: cross radius ~30s)'
)
