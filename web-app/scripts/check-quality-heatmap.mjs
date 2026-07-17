/**
 * Step 85 — GitHub-style quality contribution heatmap.
 * Full year → ~52 week columns; horizontal scroll, no page layout overflow.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildContributionGrid,
  contributionGridWidth,
  HeatmapCalendar,
  seedYearQualityDays,
} from '../src/components/charts/index.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const heatSrc = readFileSync(
  join(root, 'src/components/charts/HeatmapCalendar.tsx'),
  'utf8'
)
const gridSrc = readFileSync(
  join(root, 'src/components/charts/contributionGrid.ts'),
  'utf8'
)
const qualitySrc = readFileSync(
  join(root, 'src/components/charts/QualityContributionHeatmap.tsx'),
  'utf8'
)
const pageSrc = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)

assert.match(gridSrc, /buildContributionGrid/)
assert.match(heatSrc, /overflow-x-auto/)
assert.match(heatSrc, /weekCount|columns/)
assert.match(qualitySrc, /sleepQuality|quality/)
assert.match(pageSrc, /QualityContributionHeatmap/)

const yearDays = seedYearQualityDays(new Date(2026, 6, 14), 365)
assert.equal(yearDays.length, 365)

const start = yearDays[0].date
const end = yearDays[yearDays.length - 1].date
const grid = buildContributionGrid(yearDays, start, end)

assert.ok(
  grid.weekCount >= 52 && grid.weekCount <= 54,
  `expected ~52 columns, got ${grid.weekCount}`
)

const svgWidth = contributionGridWidth(grid.weekCount)
assert.ok(svgWidth > 700, `year grid SVG width ${svgWidth}`)
// Dashboard max-w-6xl ≈ 1152px — year SVG is wider, so scroll wrapper is required
assert.ok(svgWidth > 720, 'year grid wider than narrow viewports')

const html = renderToStaticMarkup(
  createElement(HeatmapCalendar, {
    title: 'Sleep quality (year)',
    days: yearDays,
    startDate: start,
    endDate: end,
    maxValue: 10,
  })
)

assert.match(html, /heatmap-scroll/)
assert.match(html, /overflow-x-auto/)
assert.match(html, new RegExp(`data-week-count="${grid.weekCount}"`))
assert.match(html, /quality/)
// Scroll wrapper present; SVG keeps intrinsic width (not forced into page flow)
assert.match(html, /max-w-full/)
assert.match(html, /max-w-none/)
assert.doesNotMatch(html, /w-screen|min-w-\[2000/)

console.log(
  `Quality heatmap OK — ${yearDays.length} days → ${grid.weekCount} week columns; scroll wrapper prevents layout overflow`
)
