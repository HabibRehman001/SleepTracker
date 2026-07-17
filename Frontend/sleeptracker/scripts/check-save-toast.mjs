/**
 * Step 52 + 110 — form wires to useSaveSleepEntry; toast "Saved" on hook; Today card.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const form = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.tsx'),
  'utf8'
)
const saveHook = readFileSync(
  join(root, 'src/features/sleep-entry/useSleepEntries.ts'),
  'utf8'
)
const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')
const today = readFileSync(
  join(root, 'src/features/dashboard/TodayCard.tsx'),
  'utf8'
)
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(pkg.dependencies.sonner, 'sonner installed')
assert.match(form, /useSaveSleepEntry/)
assert.match(form, /saveMutation\.mutate/)
assert.match(form, /handleSubmit\(onValid\)/)
assert.match(saveHook, /toastMutationSuccess\(['"]Saved['"]\)/)
assert.match(saveHook, /toastMutationError/)
assert.match(main, /<Toaster/)
assert.match(today, /data-testid="today-card"/)
assert.match(today, /useSleepEntries/)
assert.match(today, /useDashboardStats|useStatsSummary/)

console.log('Step 52/110 contract OK — mutate + toast Saved (hook) + Today card')
