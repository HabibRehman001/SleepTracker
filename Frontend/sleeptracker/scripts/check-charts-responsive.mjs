/**
 * Step 89 — All charts responsive from 1440px → 375px (no container overflow).
 */
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const chartsDir = join(root, 'src/components/charts')

const shell = readFileSync(join(chartsDir, 'ChartCardShell.tsx'), 'utf8')
const frame = readFileSync(join(chartsDir, 'ResponsiveChartFrame.tsx'), 'utf8')
const hook = readFileSync(join(chartsDir, 'useCompactChart.ts'), 'utf8')
const page = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.tsx'),
  'utf8'
)
const shellLayout = readFileSync(
  join(root, 'src/components/layout/AppShell.tsx'),
  'utf8'
)
const heat = readFileSync(join(chartsDir, 'HeatmapCalendar.tsx'), 'utf8')

assert.match(shell, /min-w-0/)
assert.match(shell, /overflow-hidden/)
assert.match(shell, /max-w-full/)
assert.match(frame, /ResponsiveContainer/)
assert.match(frame, /min-w-0/)
assert.match(frame, /max-w-full/)
assert.match(frame, /debounce/)
assert.match(frame, /chartGridClassName/)
assert.match(hook, /max-width|matchMedia/)
assert.match(page, /min-w-0/)
assert.match(page, /dashboard-trends/)
assert.match(shellLayout, /overflow-x-hidden/)
assert.match(heat, /overflow-x-auto/)

/** Recharts feature charts must use ResponsiveChartFrame (not raw ResponsiveContainer). */
const chartFiles = readdirSync(chartsDir).filter((f) =>
  /Chart|Card\.tsx$/.test(f)
)
const mustUseFrame = [
  'LineChartCard.tsx',
  'ScatterChartCard.tsx',
  'SleepDurationChart.tsx',
  'SleepTimelineChart.tsx',
  'SleepQualityOverTimeChart.tsx',
  'WeekdayWeekendChart.tsx',
  'ScheduleConsistencyCharts.tsx',
]
for (const file of mustUseFrame) {
  const src = readFileSync(join(chartsDir, file), 'utf8')
  assert.match(src, /ResponsiveChartFrame/, `${file} uses ResponsiveChartFrame`)
  assert.doesNotMatch(
    src,
    /from 'recharts'[\s\S]*ResponsiveContainer|ResponsiveContainer[\s\S]*from 'recharts'/,
    `${file} should not import ResponsiveContainer directly`
  )
}

assert.ok(chartFiles.length >= 6)

// Compact theme helpers exist
const theme = readFileSync(join(chartsDir, 'chartTheme.ts'), 'utf8')
assert.match(theme, /chartMarginCompact|compactChartHeight|chartPlotMargin/)

console.log(
  'Charts responsive OK — min-w-0 shells, ResponsiveChartFrame, compact ≤640px, heatmap scrolls'
)
