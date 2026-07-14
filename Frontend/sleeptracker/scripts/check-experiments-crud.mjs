/**
 * Step 97 — Experiment CRUD UI: form (name, start, optional end) + page wired.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ExperimentForm } from '../src/features/experiments/ExperimentForm.tsx'
import {
  experimentFormDefaults,
  experimentFormSchema,
} from '../src/features/experiments/experimentForm.schema.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const page = readFileSync(
  join(root, 'src/features/experiments/ExperimentsPage.tsx'),
  'utf8'
)
const form = readFileSync(
  join(root, 'src/features/experiments/ExperimentForm.tsx'),
  'utf8'
)
const hook = readFileSync(
  join(root, 'src/features/experiments/useExperiments.ts'),
  'utf8'
)
const api = readFileSync(join(root, 'src/lib/api-client.ts'), 'utf8')

assert.match(app, /ExperimentsPage/)
assert.doesNotMatch(app, /PlaceholderPage label="Experiments"/)
assert.match(page, /ExperimentForm/)
assert.match(page, /ExperimentListCard|useDeleteExperiment/)
assert.match(form, /type="date"/)
assert.match(form, /optional/)
assert.match(hook, /api\.post.*\/experiments/)
assert.match(hook, /api\.delete/)
assert.match(api, /delete:/)

const defaults = experimentFormDefaults()
assert.ok(defaults.startDate)
assert.equal(defaults.endDate, '')

const openEnded = experimentFormSchema.safeParse({
  name: 'Test',
  startDate: '2026-07-01',
  endDate: '',
})
assert.ok(openEnded.success, 'open-ended form valid')

const badWindow = experimentFormSchema.safeParse({
  name: 'Test',
  startDate: '2026-07-10',
  endDate: '2026-07-01',
})
assert.equal(badWindow.success, false)

// SSR smoke — form markup (needs QueryClient for useMutation)
const qc = new QueryClient({
  defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
})
const html = renderToStaticMarkup(
  createElement(QueryClientProvider, { client: qc }, createElement(ExperimentForm))
)
assert.match(html, /data-testid="experiment-form"/)
assert.match(html, /Start date/)
assert.match(html, /End date/)

console.log('Experiments CRUD contract OK (form + optional end + delete hook)')
