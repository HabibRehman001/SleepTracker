/**
 * Step 52 — form wires to useSaveSleepEntry; toast "Saved"; Today card invalidates.
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
assert.match(form, /toast\.success\(\s*['"]Saved['"]\s*\)/)
assert.match(main, /<Toaster/)
assert.match(today, /data-testid="today-card"/)
assert.match(today, /useSleepEntries/)
assert.match(today, /useDashboardStats|useStatsSummary/)

console.log('Step 52 contract OK — mutate + toast Saved + Today card')
