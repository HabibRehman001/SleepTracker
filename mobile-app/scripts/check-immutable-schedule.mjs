/**
 * Step 193 — immutable-schedule guarantee.
 * Attempt every non–24h-override path; none may change locked sleep/wake.
 */
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ALLOWED_SCHEDULE_EDIT_SCREENS,
  coreScheduleChanged,
  FORBIDDEN_LOCKED_SCHEDULE_MUTATORS,
  IMMUTABLE_SCHEDULE_GUARANTEE,
  SCHEDULE_ATTACK_UI_PATHS,
} from '../services/immutableScheduleMath.ts'
import {
  SCHEDULE_CHANGE_DELAY_MS,
  computePendingEffectiveAt,
} from '../services/scheduleChange.ts'
import { useScheduleStore } from '../store/scheduleStore.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(
  join(root, 'services/immutableScheduleMath.ts'),
  'utf8'
)
const storeSrc = readFileSync(join(root, 'store/scheduleStore.ts'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const baseline = readFileSync(join(root, 'app/baseline-results.tsx'), 'utf8')
const lockScreen = readFileSync(join(root, 'app/lock-schedule.tsx'), 'utf8')
const request = readFileSync(
  join(root, 'app/request-schedule-change.tsx'),
  'utf8'
)
const onboarding = readFileSync(join(root, 'app/onboarding.tsx'), 'utf8')
const manual = readFileSync(join(root, 'app/manual-sleep-entry.tsx'), 'utf8')
const api = readFileSync(join(root, 'services/scheduleApi.ts'), 'utf8')
const serverRoutes = readFileSync(
  join(root, '..', 'mobile-server/src/routes/schedule.routes.ts'),
  'utf8'
)
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(math, /FORBIDDEN_LOCKED_SCHEDULE_MUTATORS|SCHEDULE_ATTACK_UI_PATHS/)
assert.match(IMMUTABLE_SCHEDULE_GUARANTEE, /24-hour|24h/i)
assert.ok(FORBIDDEN_LOCKED_SCHEDULE_MUTATORS.includes('setSchedule'))
assert.ok(ALLOWED_SCHEDULE_EDIT_SCREENS.includes('request-schedule-change.tsx'))
assert.match(storeSrc, /if \(get\(\)\.lockedIn\) return/)
assert.match(storeSrc, /Idempotent re-hydrate|never rewrite/)
assert.match(settings, /settings-schedule-readonly/)
assert.doesNotMatch(settings, /TextInput|onChangeText/)
assert.match(baseline, /baseline-results-locked/)
assert.match(lockScreen, /lock-schedule-already|fetchSchedule/)
assert.match(request, /requestScheduleChange|applyPendingChange/)
assert.match(request, /TextInput/)
assert.match(api, /requestScheduleChange|change-request/)
assert.doesNotMatch(api, /method:\s*['"]PUT['"]|method:\s*['"]PATCH['"]/)
assert.doesNotMatch(serverRoutes, /router\.(put|patch|delete)/i)
assert.match(serverRoutes, /change-request/)
assert.doesNotMatch(manual, /useScheduleStore|setSchedule|applyLockedSchedule/)
assert.match(onboarding, /setSchedule/)
assert.match(summary, /Step 193|6\.140.*193|immutable/)
assert.ok(pkg.scripts['test:immutable-schedule'])

function resetUnlocked() {
  useScheduleStore.setState({
    bedtime: null,
    waketime: null,
    lockedIn: false,
    lockedAt: null,
    pendingSleepTime: null,
    pendingWakeTime: null,
    pendingRequestedAt: null,
    pendingEffectiveAt: null,
  })
}

function snapshot() {
  const s = useScheduleStore.getState()
  return {
    bedtime: s.bedtime,
    waketime: s.waketime,
    lockedIn: s.lockedIn,
  }
}

function assertUnchanged(path, before) {
  const after = snapshot()
  assert.equal(
    coreScheduleChanged(before, after),
    false,
    `${path} mutated core schedule: ${JSON.stringify(before)} → ${JSON.stringify(after)}`
  )
  assert.equal(after.bedtime, '04:00')
  assert.equal(after.waketime, '12:00')
  assert.equal(after.lockedIn, true)
}

// --- Lock once, then attack every store/UI-equivalent path ---
resetUnlocked()
useScheduleStore.getState().applyLockedSchedule(
  '04:00',
  '12:00',
  '2026-07-22T01:00:00.000Z'
)
const locked = snapshot()
assert.equal(locked.lockedIn, true)

const attacks = []

// Path: settings-style direct setSchedule
{
  const before = snapshot()
  useScheduleStore.getState().setSchedule('05:00', '11:00')
  assertUnchanged('setSchedule', before)
  attacks.push('setSchedule')
}

// Path: re-lock with different times via applyLockedSchedule
{
  const before = snapshot()
  useScheduleStore.getState().applyLockedSchedule(
    '06:00',
    '10:00',
    '2026-07-22T02:00:00.000Z'
  )
  assertUnchanged('applyLockedSchedule(different)', before)
  attacks.push('applyLockedSchedule-different')
}

// Path: idempotent same-times re-hydrate (allowed; times unchanged)
{
  const before = snapshot()
  useScheduleStore.getState().applyLockedSchedule(
    '04:00',
    '12:00',
    '2026-07-22T03:00:00.000Z'
  )
  assert.equal(useScheduleStore.getState().bedtime, '04:00')
  assert.equal(useScheduleStore.getState().waketime, '12:00')
  assert.equal(coreScheduleChanged(before, snapshot()), false)
  attacks.push('applyLockedSchedule-idempotent')
}

// Path: lockIn again
{
  const before = snapshot()
  useScheduleStore.getState().lockIn('2026-07-22T04:00:00.000Z')
  assertUnchanged('lockIn', before)
  attacks.push('lockIn')
}

// Path: clearSchedule / wipe
{
  const before = snapshot()
  useScheduleStore.getState().clearSchedule()
  assertUnchanged('clearSchedule', before)
  attacks.push('clearSchedule')
}

// Path: onboarding finish seed (same as setSchedule)
{
  const before = snapshot()
  useScheduleStore.getState().setSchedule('23:00', '07:00')
  assertUnchanged('onboarding-setSchedule', before)
  attacks.push('onboarding-setSchedule')
}

// Path: baseline adjust draft (setSchedule)
{
  const before = snapshot()
  useScheduleStore.getState().setSchedule('02:00', '09:00')
  assertUnchanged('baseline-setSchedule', before)
  attacks.push('baseline-setSchedule')
}

// Path: applyPendingChange without going through delay must NOT rewrite core yet
{
  const before = snapshot()
  const requestedAt = new Date('2026-07-22T05:00:00.000Z')
  const effectiveAt = computePendingEffectiveAt(requestedAt)
  useScheduleStore
    .getState()
    .applyPendingChange('05:00', '11:30', effectiveAt, requestedAt)
  assert.equal(useScheduleStore.getState().bedtime, '04:00')
  assert.equal(useScheduleStore.getState().waketime, '12:00')
  const mid = useScheduleStore
    .getState()
    .getEnforcedTimes(new Date(requestedAt.getTime() + 60_000))
  assert.deepEqual(mid, { bedtime: '04:00', waketime: '12:00' })
  assert.equal(coreScheduleChanged(before, snapshot()), false)
  attacks.push('applyPendingChange-during-delay')

  // After 24h promote is the ONLY success path for core rewrite
  assert.equal(
    useScheduleStore
      .getState()
      .promoteDuePending(
        new Date(requestedAt.getTime() + SCHEDULE_CHANGE_DELAY_MS)
      ),
    true
  )
  assert.equal(useScheduleStore.getState().bedtime, '05:00')
  assert.equal(useScheduleStore.getState().waketime, '11:30')
  attacks.push('promoteDuePending-after-24h')
}

// Re-lock for UI file scans (after promote left 05:00/11:30)
assert.equal(useScheduleStore.getState().lockedIn, true)

// --- UI path catalog: every attack screen wired ---
for (const path of SCHEDULE_ATTACK_UI_PATHS) {
  const src = readFileSync(join(root, 'app', path.file), 'utf8')
  if (path.mustNotHave) {
    for (const needle of path.mustNotHave) {
      assert.doesNotMatch(
        src,
        new RegExp(needle),
        `${path.id} must not contain ${needle}`
      )
    }
  }
  if (path.mustHave) {
    for (const needle of path.mustHave) {
      assert.match(src, new RegExp(needle), `${path.id} missing ${needle}`)
    }
  }
}

// Only request-schedule-change may edit locked schedule; baseline TextInputs
// exist but are unreachable after the lockedIn early return (asserted above).
const appDir = join(root, 'app')
const scheduleEditAllowed = new Set([
  ...ALLOWED_SCHEDULE_EDIT_SCREENS,
  'baseline-results.tsx', // gated: baseline-results-locked before adjust fields
])
for (const name of readdirSync(appDir)) {
  if (!name.endsWith('.tsx')) continue
  if (scheduleEditAllowed.has(name)) continue
  const src = readFileSync(join(appDir, name), 'utf8')
  if (!/TextInput/.test(src)) continue
  if (/useScheduleStore/.test(src)) {
    assert.fail(
      `${name} has TextInput + useScheduleStore — forbidden schedule edit surface`
    )
  }
}

// baseline-results still has TextInput in source but locked gate must precede it
assert.match(baseline, /if \(lockedIn\)/)
const lockedGateIdx = baseline.indexOf('baseline-results-locked')
const adjustIdx = baseline.indexOf('baseline-adjust-bedtime')
assert.ok(lockedGateIdx > 0 && adjustIdx > lockedGateIdx)

assert.ok(attacks.length >= 8, `expected many attack paths, got ${attacks.length}`)

console.log(
  `Immutable schedule OK — ${attacks.length} attack paths blocked; only 24h override succeeds`
)
