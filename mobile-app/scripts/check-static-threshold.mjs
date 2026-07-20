/**
 * Step 142 — STATIC_THRESHOLD (0.15 m/s² deviation from gravity).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyMotionMagnitude,
  computeMagnitude,
  deviationFromGravityMs2,
  GRAVITY_MS2,
  isStatic,
  STATIC_THRESHOLD,
} from '../services/motionSampleMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(join(root, 'services/motionSampleMath.ts'), 'utf8')
const sample = readFileSync(join(root, 'services/motionSample.ts'), 'utf8')

assert.match(math, /STATIC_THRESHOLD\s*=\s*0\.15/)
assert.match(math, /m\/s²|m\/s2|deviation from gravity/i)
assert.match(math, /isStatic|deviationFromGravityMs2/)
assert.match(sample, /classifyMotionMagnitude|isStatic|deviationMs2/)

assert.equal(STATIC_THRESHOLD, 0.15)
assert.equal(GRAVITY_MS2, 9.81)

// Phone lying flat and untouched → under threshold
const flatMag = computeMagnitude(0, 0, 1)
assert.equal(flatMag, 1)
assert.equal(deviationFromGravityMs2(flatMag), 0)
assert.equal(isStatic(flatMag), true)
assert.equal(classifyMotionMagnitude(flatMag).isStatic, true)

// Tiny sensor noise still static (~0.05 m/s² << 0.15)
const noisyFlat = computeMagnitude(0.002, -0.001, 0.9995)
assert.ok(deviationFromGravityMs2(noisyFlat) < STATIC_THRESHOLD)
assert.equal(isStatic(noisyFlat), true)

// Just over threshold is NOT static (strict <)
const overThresholdG = 1 + (STATIC_THRESHOLD + 0.01) / GRAVITY_MS2
assert.ok(deviationFromGravityMs2(overThresholdG) > STATIC_THRESHOLD)
assert.equal(isStatic(overThresholdG), false)

// Phone carried while walking → clearly over threshold
// Typical step bump: extra ~0.2–0.5g on top of gravity
const walkingMag = computeMagnitude(0.35, 0.2, 1.15)
assert.ok(walkingMag > 1.1)
assert.ok(deviationFromGravityMs2(walkingMag) > STATIC_THRESHOLD)
assert.equal(isStatic(walkingMag), false)

const briskWalk = computeMagnitude(0.5, 0.4, 1.3)
assert.equal(isStatic(briskWalk), false)
assert.ok(deviationFromGravityMs2(briskWalk) > 1) // clearly over 0.15

console.log(
  'Static threshold contract OK — flat < 0.15 m/s²; walking clearly over'
)
