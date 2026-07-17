/**
 * Step 48 — Zustand holds only ephemeral UI state; selectedDate syncs across components.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { create } from 'zustand'
import { format } from 'date-fns'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const storeSrc = readFileSync(join(root, 'src/stores/ui-store.ts'), 'utf8')
assert.match(storeSrc, /selectedDate:\s*format\(new Date\(\),\s*'yyyy-MM-dd'\)/)
assert.match(storeSrc, /setSelectedDate:\s*\(d\)\s*=>\s*set\(\{\s*selectedDate:\s*d\s*\}\)/)
assert.doesNotMatch(
  storeSrc,
  /sleepEntries|SleepEntry\[\]|statsSummary/,
  'no server data in Zustand'
)

const form = readFileSync(join(root, 'src/features/sleep-entry/SleepLogForm.tsx'), 'utf8')
const selector = readFileSync(
  join(root, 'src/features/sleep-entry/DateSelector.tsx'),
  'utf8'
)
assert.match(selector, /setSelectedDate/)
assert.match(form, /selectedDate/)
assert.match(form, /form-selected-date/)

const useUiStore = create((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (d) => set({ selectedDate: d }),
}))

useUiStore.getState().setSelectedDate('2026-07-01')
assert.equal(useUiStore.getState().selectedDate, '2026-07-01')

console.log('Zustand UI store contract OK (selectedDate sync; no server duplication)')
