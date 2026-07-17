/**
 * Step 63 — Sleep Debt card: Xh Ym + small 7-day trend arrow.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  SleepDebtCardView,
  formatSleepDebt,
  sleepDebtTrendDirection,
} from '../src/features/dashboard/SleepDebtCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(
  join(root, 'src/features/dashboard/SleepDebtCard.tsx'),
  'utf8'
)
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const grid = readFileSync(
  join(root, 'src/features/dashboard/StatCardsGrid.tsx'),
  'utf8'
)

assert.match(src, /export function SleepDebtCard/)
assert.match(src, /export function SleepDebtCardView/)
assert.match(src, /export function formatSleepDebt/)
assert.match(src, /sleep-debt-trend-arrow/)
assert.match(page, /SleepDebtCard/)
assert.match(grid, /\$\{h\}h \$\{m\}m/)

assert.equal(formatSleepDebt(220), '3h 40m')
assert.equal(formatSleepDebt(0), '0h 0m')
assert.equal(formatSleepDebt(45), '0h 45m')
assert.equal(sleepDebtTrendDirection(220, 200), 'up')
assert.equal(sleepDebtTrendDirection(180, 200), 'down')
assert.equal(sleepDebtTrendDirection(200, 200), 'flat')

const html = renderToStaticMarkup(
  createElement(SleepDebtCardView, {
    debtMinutes: 220,
    trend: 'up',
    deltaMinutes: 20,
  })
)

assert.match(html, /Sleep Debt/)
assert.match(html, /3h 40m/)
assert.match(html, /data-testid="sleep-debt-trend"/)
assert.match(html, /data-trend="up"/)
assert.match(html, /data-testid="sleep-debt-trend-arrow"/)
assert.match(html, /\+20m vs prior 7d/)

console.log('Sleep Debt card OK — 3h 40m + 7-day trend arrow')
