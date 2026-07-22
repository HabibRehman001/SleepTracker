/**
 * Step 183 — classify walk/jog/run from step cadence.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cadenceFromStepDelta,
  classifyActivity,
  JOG_CADENCE_MIN,
  RUN_CADENCE_MIN,
} from '../services/activityClassification.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(
  join(root, 'services/activityClassification.ts'),
  'utf8'
)
const store = readFileSync(join(root, 'store/pedometerStore.ts'), 'utf8')
const screen = readFileSync(join(root, 'app/live-steps.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(math, /classifyActivity/)
assert.match(math, /'walk'\s*\|\s*'jog'\s*\|\s*'run'|ActivityType/)
assert.equal(JOG_CADENCE_MIN, 100)
assert.equal(RUN_CADENCE_MIN, 150)

// Prompt test vectors
assert.equal(classifyActivity(90), 'walk')
assert.equal(classifyActivity(130), 'jog')
assert.equal(classifyActivity(170), 'run')

// Boundaries
assert.equal(classifyActivity(0), 'walk')
assert.equal(classifyActivity(99.9), 'walk')
assert.equal(classifyActivity(100), 'jog')
assert.equal(classifyActivity(149.9), 'jog')
assert.equal(classifyActivity(150), 'run')
assert.equal(classifyActivity(Number.NaN), 'walk')

assert.equal(cadenceFromStepDelta(15, 10_000), 90)
assert.equal(cadenceFromStepDelta(10, 1_000), null) // window too short

assert.match(store, /classifyActivity|stepsPerMinute|activityType/)
assert.match(screen, /live-steps-activity|activityType|stepsPerMinute/)
assert.match(summary, /Step 183|6\.132.*183|classifyActivity|walk.*jog.*run/)
assert.ok(pkg.scripts['test:activity-classify'])

console.log(
  'Activity classify contract OK — 90→walk, 130→jog, 170→run'
)
