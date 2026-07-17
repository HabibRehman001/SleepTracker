/**
 * Step 53 — Mood accordion values live in parent RHF form (not local state).
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
const moodSrc = readFileSync(
  join(root, 'src/features/sleep-entry/MoodSection.tsx'),
  'utf8'
)
const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)

assert.match(formSrc, /FormProvider/)
assert.match(formSrc, /shouldUnregister:\s*false/)
assert.match(formSrc, /<MoodSection\s*\/>/)
assert.match(formSrc, /mood:\s*data\.mood/)
assert.match(moodSrc, /Accordion/)
assert.match(moodSrc, /useFormContext/)
assert.match(moodSrc, /forceMount/)
assert.match(moodSrc, /mood\.stress/)
assert.match(moodSrc, /mood-accordion/)
assert.match(schemaSrc, /mood:\s*moodSchema/)
assert.doesNotMatch(
  moodSrc,
  /useState\s*\(/,
  'no local mood state — parent form owns values'
)

const {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
} = await import('../src/features/sleep-entry/sleepEntryForm.schema.ts')

const edited = {
  ...sleepEntryFormDefaults,
  mood: { mood: 8, stress: 9, anxiety: 3, motivation: 7 },
}
const parsed = sleepEntryFormSchema.safeParse(edited)
assert.equal(parsed.success, true)
assert.equal(parsed.data?.mood.stress, 9)

console.log(
  'Mood section contract OK — Accordion + parent RHF (forceMount, shouldUnregister:false)'
)
