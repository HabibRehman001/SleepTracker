/**
 * Step 56 — Environment toggles + temp + brightness on parent form.
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
const envSrc = readFileSync(
  join(root, 'src/features/sleep-entry/EnvironmentSection.tsx'),
  'utf8'
)
const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)

assert.match(formSrc, /<EnvironmentSection\s*\/>/)
assert.match(formSrc, /environment:\s*\{/)
assert.match(envSrc, /ENV_TOGGLES/)
assert.match(envSrc, /fanOn/)
assert.match(envSrc, /acOn/)
assert.match(envSrc, /blackoutCurtains/)
assert.match(envSrc, /eyeMask/)
assert.match(envSrc, /whiteNoise/)
assert.match(envSrc, /sunlightSeenBeforeSleep/)
assert.match(envSrc, /birdsHeard/)
assert.match(envSrc, /fajrHeard/)
assert.match(envSrc, /roomTemp/)
assert.match(envSrc, /screenBrightness/)
assert.match(envSrc, /Slider/)
assert.match(envSrc, /Switch/)
assert.match(schemaSrc, /environment:\s*environmentSchema/)

const {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
} = await import('../src/features/sleep-entry/sleepEntryForm.schema.ts')

const parsed = sleepEntryFormSchema.safeParse({
  ...sleepEntryFormDefaults,
  environment: {
    ...sleepEntryFormDefaults.environment,
    fanOn: true,
    roomTemp: 22.5,
    screenBrightness: 15,
  },
})
assert.equal(parsed.success, true)
assert.equal(parsed.data?.environment.fanOn, true)
assert.equal(parsed.data?.environment.screenBrightness, 15)

console.log('Environment section contract OK — toggles + temp + brightness')
