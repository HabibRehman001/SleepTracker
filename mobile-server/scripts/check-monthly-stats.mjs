/**
 * Step 129 — monthly stats aggregation + clock math helpers.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  circularMeanMinutes,
  consistencyScoreFromBedMinutes,
  formatClock,
} from '../src/services/clockMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/monthlyStats.service.ts'),
  'utf8'
)

assert.match(appSrc, /\/stats/)
assert.match(service, /\$group/)
assert.match(service, /monthKey|%Y-%m/)
assert.match(service, /consistencyScore/)
assert.match(service, /avgDuration/)

// 23:00 and 01:00 circular mean should land near midnight, not 12:00
const mean = circularMeanMinutes([23 * 60, 1 * 60])
assert.ok(mean != null)
assert.ok(mean < 60 || mean > 22 * 60, `unexpected mean ${mean}`)
assert.equal(formatClock(4 * 60), '04:00')
assert.equal(consistencyScoreFromBedMinutes([23 * 60, 23 * 60]), 100)

console.log('Monthly stats contract OK — aggregation + circular clock math')
