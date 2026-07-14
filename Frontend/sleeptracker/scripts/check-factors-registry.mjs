/**
 * Step 70–71 — Declarative FACTORS × OUTCOMES registry.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const backendRoot = join(root, '../../Backend')
const service = readFileSync(
  join(backendRoot, 'src/services/analytics.service.ts'),
  'utf8'
)
const cards = readFileSync(
  join(root, 'src/features/dashboard/CorrelationCards.tsx'),
  'utf8'
)

assert.match(service, /export const FACTORS/)
assert.match(service, /export const OUTCOMES/)
assert.match(service, /key:\s*'latency'/)
assert.match(service, /key:\s*'quality'/)
assert.match(service, /key:\s*'duration'/)
assert.match(service, /latencyMinutes/)
assert.match(service, /sleepDurationMinutes/)
assert.match(service, /factors\.flatMap/)
assert.match(service, /outcomes\.flatMap/)
assert.match(service, /vs \$\{outcome\.label\}/)
assert.match(service, /MIN_CORRELATION_GROUP_N/)
assert.match(service, /groupA\.n < MIN_CORRELATION_GROUP_N|groupA\.n < 3/)
assert.match(cards, /c\.outcome/)
assert.match(cards, /c\.label/)

console.log(
  'FACTORS × OUTCOMES OK — min group n=3 filter; latency/quality/duration'
)
