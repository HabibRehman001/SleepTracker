/**
 * Step 199 — iOS wake ≈ first AppState active after static window (approximation).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildIosWakeEvent,
  decideIosWakeProxy,
  IOS_WAKE_PROXY_ACTION,
  IOS_WAKE_PROXY_HONESTY_BODY,
  IOS_WAKE_PROXY_HONESTY_SHORT,
  IOS_WAKE_PROXY_HONESTY_TITLE,
  IOS_WAKE_PROXY_MAX_DELAY_MS,
  IOS_WAKE_PROXY_TOO_LATE_MS,
} from '../services/iosWakeProxyMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const mathSrc = readFileSync(
  join(root, 'services/iosWakeProxyMath.ts'),
  'utf8'
)
const ioSrc = readFileSync(join(root, 'services/iosWakeProxy.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'services/iosWakeProxyMath.ts')))
assert.ok(existsSync(join(root, 'services/iosWakeProxy.ts')))

assert.match(ioSrc, /AppState\.addEventListener\(\s*['"]change['"]/)
assert.match(ioSrc, /handleIosAppStateForWake|watchIosWakeProxy/)
assert.match(layout, /watchIosWakeProxy/)
assert.match(settings, /IOS_WAKE_PROXY_HONESTY_TITLE/)
assert.match(settings, /settings-ios-wake-proxy/)
assert.match(settings, /Platform\.OS === ['"]ios['"]/)

assert.match(IOS_WAKE_PROXY_HONESTY_TITLE, /approximate/i)
assert.match(IOS_WAKE_PROXY_HONESTY_BODY, /approximation|not a guarantee/i)
assert.match(IOS_WAKE_PROXY_HONESTY_BODY, /no wake event|rather than guessing/i)
assert.match(IOS_WAKE_PROXY_HONESTY_SHORT, /Approximation/)
assert.equal(IOS_WAKE_PROXY_ACTION, 'APP_STATE_ACTIVE')
assert.equal(IOS_WAKE_PROXY_MAX_DELAY_MS, 15 * 60 * 1000)
assert.equal(IOS_WAKE_PROXY_TOO_LATE_MS, 2 * 60 * 60 * 1000)

assert.match(summary, /Step 199|6\.145.*199|AppState|wake proxy|approximation/)
assert.ok(pkg.scripts['test:ios-wake-proxy'])
assert.match(mathSrc, /decideIosWakeProxy/)

const windowEnd = 1_700_000_000_000

// Open within a few minutes of static window ending → record wake near "now"
const soon = windowEnd + 3 * 60 * 1000
const openSoon = decideIosWakeProxy({
  nextAppState: 'active',
  staticWindowEndMs: windowEnd,
  nowMs: soon,
  recordedForWindowEndMs: null,
})
assert.equal(openSoon.shouldRecord, true)
assert.equal(openSoon.wakeMs, soon)
assert.equal(openSoon.reason, 'recorded')
assert.ok(
  Math.abs(openSoon.wakeMs - windowEnd) < 5 * 60 * 1000,
  'wake close to real window end when opened soon'
)
const event = buildIosWakeEvent(soon, windowEnd)
assert.equal(event.action, IOS_WAKE_PROXY_ACTION)
assert.equal(event.delayMs, 3 * 60 * 1000)

// Hours later without opening → no wake event (do not guess)
const hoursLater = windowEnd + 4 * 60 * 60 * 1000
const late = decideIosWakeProxy({
  nextAppState: 'active',
  staticWindowEndMs: windowEnd,
  nowMs: hoursLater,
  recordedForWindowEndMs: null,
})
assert.equal(late.shouldRecord, false)
assert.equal(late.wakeMs, null)
assert.equal(late.reason, 'too-late-no-guess')

// Slightly past 15m but under 2h → still no invent
const midLate = decideIosWakeProxy({
  nextAppState: 'active',
  staticWindowEndMs: windowEnd,
  nowMs: windowEnd + 30 * 60 * 1000,
  recordedForWindowEndMs: null,
})
assert.equal(midLate.shouldRecord, false)
assert.equal(midLate.wakeMs, null)
assert.equal(midLate.reason, 'outside-proxy-window')

// Background → ignore
const bg = decideIosWakeProxy({
  nextAppState: 'background',
  staticWindowEndMs: windowEnd,
  nowMs: soon,
  recordedForWindowEndMs: null,
})
assert.equal(bg.shouldRecord, false)
assert.equal(bg.reason, 'not-active')

// Already recorded for this window → no duplicate
const dup = decideIosWakeProxy({
  nextAppState: 'active',
  staticWindowEndMs: windowEnd,
  nowMs: soon,
  recordedForWindowEndMs: windowEnd,
})
assert.equal(dup.shouldRecord, false)
assert.equal(dup.reason, 'already-recorded')

console.log(
  'iOS wake proxy OK — AppState active within 15m records; hours later = no guess'
)
