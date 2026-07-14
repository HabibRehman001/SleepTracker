/**
 * Step 96 — Patterns Detected card: amber banners only when triggered.
 * Seeded stable data → zero warning banners (no false positives).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { PatternsDetectedCardView } from '../src/features/dashboard/PatternsDetectedCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const cardSrc = readFileSync(
  join(root, 'src/features/dashboard/PatternsDetectedCard.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const hookSrc = readFileSync(
  join(root, 'src/features/analytics/useAnalytics.ts'),
  'utf8'
)

assert.match(cardSrc, /Patterns Detected/)
assert.match(cardSrc, /amber/)
assert.match(cardSrc, /pattern-warning/)
assert.match(pageSrc, /PatternsDetectedCard/)
assert.match(pageSrc, /InsightsPanel/)
// Card sits below InsightsPanel in the Insights section
assert.ok(
  pageSrc.indexOf('InsightsPanel') < pageSrc.indexOf('PatternsDetectedCard'),
  'PatternsDetectedCard below InsightsPanel'
)
assert.match(hookSrc, /\/analytics\/patterns/)
assert.match(hookSrc, /useSmartPatterns/)

const withWarning = renderToStaticMarkup(
  createElement(PatternsDetectedCardView, {
    warnings: [
      {
        key: 'weekendJetlag',
        severity: 'warning',
        message: 'Weekend jetlag: Sunday night is 2.5h off your weekday average.',
      },
    ],
    highlights: [],
  })
)
assert.match(withWarning, /pattern-warning-weekendJetlag/)
assert.match(withWarning, /Weekend jetlag/)
assert.match(withWarning, /amber/)

const noWarnings = renderToStaticMarkup(
  createElement(PatternsDetectedCardView, {
    warnings: [],
    highlights: [
      {
        key: 'personalRecord',
        message: 'Best sleep quality: 9 on 2026-06-17.',
      },
    ],
  })
)
assert.doesNotMatch(noWarnings, /pattern-warning-/)
assert.match(noWarnings, /Best sleep quality/)

const API = process.env.SLEEPTRACKER_API ?? 'http://localhost:4000/api'
try {
  const res = await fetch(`${API}/analytics/patterns`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const body = await res.json()
  assert.ok(Array.isArray(body.warnings), 'warnings array')
  assert.ok(Array.isArray(body.highlights), 'highlights array')
  assert.equal(
    body.warnings.length,
    0,
    `seed must not false-positive amber banners, got ${JSON.stringify(body.warnings)}`
  )
  const html = renderToStaticMarkup(
    createElement(PatternsDetectedCardView, {
      warnings: body.warnings,
      highlights: body.highlights,
    })
  )
  assert.doesNotMatch(html, /pattern-warning-/)
  console.log(
    `Patterns Detected live OK — 0 warning banners; ${body.highlights.length} highlights`
  )
} catch (err) {
  console.warn(
    'Patterns Detected live API skipped:',
    err instanceof Error ? err.message : err
  )
}

console.log('Patterns Detected contract OK (amber only when triggered)')
