/**
 * Step 62 — Today's Sleep card: duration + quality + colored badge.
 * Mock 5h / quality 3 → red badge.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  TodaysSleepCard,
  todaySleepBadgeTone,
} from '../src/features/dashboard/TodayCard.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(
  join(root, 'src/features/dashboard/TodayCard.tsx'),
  'utf8'
)
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(src, /export function TodaysSleepCard/)
assert.match(src, /export function todaySleepBadgeTone/)
assert.match(src, /today-sleep-badge/)
assert.match(page, /TodayCard/)
assert.equal(todaySleepBadgeTone(5, 3), 'red')
assert.equal(todaySleepBadgeTone(8, 8), 'green')
assert.equal(todaySleepBadgeTone(8, 3), 'yellow')
assert.equal(todaySleepBadgeTone(5, 8), 'yellow')

const html = renderToStaticMarkup(
  createElement(TodaysSleepCard, {
    hours: 5,
    quality: 3,
    dateLabel: '2026-07-14',
  })
)

assert.match(html, /Today/)
assert.match(html, /5h/)
assert.match(html, /data-testid="today-quality"[^>]*>3</)
assert.match(html, /data-testid="today-sleep-badge"/)
assert.match(html, /data-tone="red"/)
assert.match(html, />Poor</)

console.log("Today's Sleep card OK — mock 5h / quality 3 → red badge")
