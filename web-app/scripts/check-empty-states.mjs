/**
 * Step 109 — loading + empty states: moon loader CSS, EmptyState CTA, dashboard guard.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { MemoryRouter } from 'react-router'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  EmptyState,
  FIRST_NIGHT_CTA,
} from '../src/components/ui/EmptyState.tsx'
import { SleepTrackerLoader } from '../src/components/ui/Loader.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const css = readFileSync(join(root, 'src/index.css'), 'utf8')
const dash = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const analytics = readFileSync(
  join(root, 'src/features/analytics/AnalyticsPage.tsx'),
  'utf8'
)
const experiments = readFileSync(
  join(root, 'src/features/experiments/ExperimentsPage.tsx'),
  'utf8'
)
const reports = readFileSync(
  join(root, 'src/features/reports/ReportsPage.tsx'),
  'utf8'
)
const loaderSrc = readFileSync(
  join(root, 'src/components/ui/Loader.tsx'),
  'utf8'
)

assert.match(css, /\.stl-root/)
assert.match(css, /stl-pulse-glow/)
assert.match(css, /stl-drift-fade/)
assert.match(css, /--stl-blue-light/)
assert.match(loaderSrc, /stl-moon-svg|crescent/)
assert.match(loaderSrc, /data-testid="sleep-loader"/)

assert.equal(
  FIRST_NIGHT_CTA,
  'Log your first night to see stats here'
)

assert.match(dash, /EmptyState|FIRST_NIGHT_CTA/)
assert.match(dash, /SleepTrackerLoader/)
assert.match(dash, /dashboard-empty|FIRST_NIGHT_CTA/)
assert.match(analytics, /analytics-empty|FIRST_NIGHT_CTA/)
assert.match(analytics, /SleepTrackerLoader/)
assert.match(experiments, /SleepTrackerLoader/)
assert.match(experiments, /experiments-empty/)
assert.match(reports, /SleepTrackerLoader/)
assert.match(reports, /reports-empty|FIRST_NIGHT_CTA/)

const emptyHtml = renderToStaticMarkup(
  createElement(
    MemoryRouter,
    null,
    createElement(EmptyState, {
      description: FIRST_NIGHT_CTA,
      'data-testid': 'dashboard-empty',
    })
  )
)
assert.match(emptyHtml, /Log your first night to see stats here/)
assert.match(emptyHtml, /dashboard-empty/)
assert.match(emptyHtml, /Log a night/)

const loaderHtml = renderToStaticMarkup(
  createElement(SleepTrackerLoader, {
    fullScreen: false,
    size: 'sm',
    label: 'Loading your sleep data…',
  })
)
assert.match(loaderHtml, /sleep-loader/)
assert.match(loaderHtml, /stl-root/)
assert.match(loaderHtml, /stl-moon-svg/)
assert.match(loaderHtml, /Loading your sleep data/)

console.log('Empty/loading states contract OK (CTA + moon loader)')
