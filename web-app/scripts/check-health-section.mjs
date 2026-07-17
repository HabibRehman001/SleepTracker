/**
 * Step 57 — Health section; loose BP regex (120/80), empty allowed.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const formSrc = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.tsx'),
  'utf8'
)
const healthSrc = readFileSync(
  join(root, 'src/features/sleep-entry/HealthSection.tsx'),
  'utf8'
)
const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)

assert.match(formSrc, /<HealthSection\s*\/>/)
assert.match(formSrc, /health:\s*\{/)
assert.match(healthSrc, /health\.weight/)
assert.match(healthSrc, /health\.restingHeartRate/)
assert.match(healthSrc, /health\.bloodPressure/)
assert.match(healthSrc, /120\/80/)
assert.match(schemaSrc, /health:\s*healthSchema/)
assert.match(schemaSrc, /bloodPressureLoose/)
assert.match(schemaSrc, /Use format like 120\/80/)

const {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
} = await import('../src/features/sleep-entry/sleepEntryForm.schema.ts')

const ok = sleepEntryFormSchema.safeParse({
  ...sleepEntryFormDefaults,
  health: { weight: 72.5, restingHeartRate: 58, bloodPressure: '120 / 80' },
})
assert.equal(ok.success, true)

const emptyBp = sleepEntryFormSchema.safeParse({
  ...sleepEntryFormDefaults,
  health: { weight: 0, restingHeartRate: 0, bloodPressure: '' },
})
assert.equal(emptyBp.success, true)

const badBp = sleepEntryFormSchema.safeParse({
  ...sleepEntryFormDefaults,
  health: { weight: 70, restingHeartRate: 60, bloodPressure: 'high' },
})
assert.equal(badBp.success, false)
const bpIssue = badBp.error?.issues.find((i) =>
  i.path.includes('bloodPressure')
)
assert.ok(bpIssue)
assert.match(String(bpIssue.message), /120\/80/)

console.log('Health section contract OK — weight/RHR/BP loose validation')
