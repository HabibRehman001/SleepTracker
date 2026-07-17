/**
 * Step 110 — toast on every mutation; clear error when backend is unreachable.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mutationErrorMessage } from '../src/lib/mutationToast.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')
const api = readFileSync(join(root, 'src/lib/api-client.ts'), 'utf8')
const sleepMut = readFileSync(
  join(root, 'src/features/sleep-entry/useSleepEntries.ts'),
  'utf8'
)
const expMut = readFileSync(
  join(root, 'src/features/experiments/useExperiments.ts'),
  'utf8'
)
const form = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.tsx'),
  'utf8'
)
const quick = readFileSync(
  join(root, 'src/features/sleep-entry/QuickLogDialog.tsx'),
  'utf8'
)
const expForm = readFileSync(
  join(root, 'src/features/experiments/ExperimentForm.tsx'),
  'utf8'
)
const expPage = readFileSync(
  join(root, 'src/features/experiments/ExperimentsPage.tsx'),
  'utf8'
)

assert.ok(pkg.dependencies.sonner, 'sonner installed')
assert.match(main, /<Toaster/)

// API must fail loudly (no silent success on HTTP errors / offline)
assert.match(api, /!r\.ok|r\.ok/)
assert.match(api, /ApiError|Cannot reach the server/)
assert.match(api, /failed to fetch|networkerror|load failed/i)

// Every mutation hook toasts success + error
assert.match(sleepMut, /toastMutationSuccess\(['"]Saved['"]\)/)
assert.match(sleepMut, /toastMutationError/)
assert.match(sleepMut, /Could not save sleep entry/)

assert.match(expMut, /toastMutationSuccess\(['"]Experiment created['"]\)/)
assert.match(expMut, /toastMutationError/)
assert.match(expMut, /Could not create experiment/)
assert.match(expMut, /toastMutationSuccess\(['"]Experiment deleted['"]\)/)
assert.match(expMut, /Could not delete experiment/)

// Forms rely on hooks (no silent catch that swallows without toast)
assert.match(form, /useSaveSleepEntry/)
assert.match(form, /saveMutation\.mutate/)
assert.doesNotMatch(form, /toast\.success/)
assert.match(quick, /useSaveSleepEntry/)
assert.doesNotMatch(quick, /toast\.error/)
assert.match(expForm, /useCreateExperiment/)
assert.match(expPage, /useDeleteExperiment/)

// Offline / TypeError maps to a clear message for the toast
assert.equal(
  mutationErrorMessage(
    new Error('Cannot reach the server — is the backend running?')
  ),
  'Cannot reach the server — is the backend running?'
)
assert.equal(
  mutationErrorMessage(new Error(''), 'Could not save sleep entry'),
  'Could not save sleep entry'
)

console.log('Mutation toasts contract OK (sonner + offline error message)')
