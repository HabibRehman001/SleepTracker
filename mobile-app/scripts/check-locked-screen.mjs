/**
 * Step 160 — calm locked full-screen UI (clock, sleep well, breathing).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  formatLockedClock,
  formatUntilWake,
  LOCKED_SLEEP_MESSAGE,
} from '../services/lockedScreenClock.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/locked.tsx'), 'utf8')
const orb = readFileSync(
  join(root, 'components/locked/BreathingOrb.tsx'),
  'utf8'
)
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const countdown = readFileSync(join(root, 'app/lock-countdown.tsx'), 'utf8')

assert.match(screen, /testID=["']locked-screen["']/)
assert.match(screen, /testID=["']locked-clock["']/)
assert.match(screen, /testID=["']locked-message["']/)
assert.match(screen, /LOCKED_SLEEP_MESSAGE|Sleep well/)
assert.match(screen, /BreathingOrb/)
assert.doesNotMatch(screen, /shouldn.?t|go back to bed|shame|you should/i)
assert.doesNotMatch(screen, /Time remaining|locks in|Phone locks/i)

assert.match(orb, /Animated\.loop|BreathingOrb/)
assert.match(orb, /locked-breathing/)

assert.match(index, /Redirect href=["']\/locked["']/)
assert.match(layout, /name=["']locked["']/)
assert.match(countdown, /replace\(['"]\/locked['"]\)/)

assert.equal(LOCKED_SLEEP_MESSAGE, 'Sleep well.')
assert.match(formatUntilWake('07:30') ?? '', /Until 7:30/)
assert.equal(formatUntilWake(null), null)
assert.equal(formatUntilWake('bad'), null)

const sample = formatLockedClock(new Date(2026, 6, 22, 2, 41, 0))
assert.match(sample, /2:41/)

console.log('Locked screen contract OK — calm clock + sleep well + breathing')
