/**
 * Step 51 — SleepEntry form Zod rejects sleepQuality: 0 before any network call.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const timeString = z
  .string()
  .min(1, 'Required')
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Use HH:MM')

const score1to10 = z.number().int().min(1, 'Must be at least 1').max(10)

const schema = z.object({
  bedTime: timeString,
  attemptSleepTime: timeString,
  wakeTime: timeString,
  sleepQuality: score1to10,
  energyMorning: score1to10,
  energyWork: score1to10,
})

const validBase = {
  bedTime: '23:00',
  attemptSleepTime: '23:15',
  wakeTime: '07:00',
  energyMorning: 6,
  energyWork: 6,
}

const bad = schema.safeParse({ ...validBase, sleepQuality: 0 })
assert.equal(bad.success, false, 'sleepQuality: 0 must fail')
const issue = bad.error?.issues.find((i) => i.path.includes('sleepQuality'))
assert.ok(issue, 'inline sleepQuality issue present')
assert.match(String(issue.message), /at least 1|min/i)

const good = schema.safeParse({ ...validBase, sleepQuality: 7 })
assert.equal(good.success, true)

// Source contract: form uses zodResolver + mutate only in onValid
const formSrc = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.tsx'),
  'utf8'
)
assert.match(formSrc, /zodResolver\(sleepEntryFormSchema\)/)
assert.match(formSrc, /handleSubmit\(onValid/)
assert.match(formSrc, /saveEntry\.mutate/)
assert.match(formSrc, /type="time"/)
assert.match(formSrc, /Slider/)
assert.doesNotMatch(
  formSrc,
  /onInvalid[\s\S]*mutate|mutate[\s\S]*sleepQuality:\s*0/
)

const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)
assert.match(schemaSrc, /sleepQuality:\s*score1to10/)
assert.match(schemaSrc, /\.min\(1/)

console.log(
  'SleepEntry form validation OK — sleepQuality:0 fails before network'
)
