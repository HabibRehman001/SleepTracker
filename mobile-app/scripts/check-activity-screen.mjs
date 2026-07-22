/**
 * Step 184 — Activity screen (goal ring, 7-day bars, walk/jog/run minutes).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildWeekStepBars,
  DEFAULT_DAILY_STEP_GOAL,
  estimateMinutesFromSteps,
  goalProgress,
  resolveActivityMinutes,
} from '../services/activityScreenMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/activity.tsx'), 'utf8')
const ring = readFileSync(
  join(root, 'components/activity/StepGoalRing.tsx'),
  'utf8'
)
const chart = readFileSync(
  join(root, 'components/activity/WeekStepsChart.tsx'),
  'utf8'
)
const breakdown = readFileSync(
  join(root, 'components/activity/ActivityBreakdown.tsx'),
  'utf8'
)
const math = readFileSync(join(root, 'services/activityScreenMath.ts'), 'utf8')
const history = readFileSync(join(root, 'services/activityHistory.ts'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const settings = readFileSync(join(root, 'app/settings.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(existsSync(join(root, 'app/activity.tsx')))
assert.ok(pkg.dependencies['react-native-svg'], 'react-native-svg')
assert.match(screen, /testID=["']activity-screen["']/)
assert.match(screen, /StepGoalRing|WeekStepsChart|ActivityBreakdown/)
assert.match(ring, /activity-goal-ring|activity-today-steps/)
assert.match(ring, /Circle|strokeDashoffset/)
assert.match(chart, /activity-week-chart|activity-bar-/)
assert.match(breakdown, /activity-breakdown|activity-minutes-walk/)
assert.match(math, /DEFAULT_DAILY_STEP_GOAL|buildWeekStepBars|goalProgress/)
assert.match(history, /fetchSevenDayStepSeries/)
assert.match(layout, /name=["']activity["']/)
assert.match(index, /open-activity|\/activity/)
assert.match(settings, /settings-open-activity|\/activity/)
assert.match(summary, /Step 184|6\.133.*184|Activity screen|goal ring/)
assert.ok(pkg.scripts['test:activity-screen'])

assert.equal(DEFAULT_DAILY_STEP_GOAL, 8_000)
const prog = goalProgress(4_000, 8_000)
assert.equal(prog.percent, 50)
assert.equal(prog.remaining, 4_000)
assert.equal(goalProgress(10_000, 8_000).percent, 100)

const bars = buildWeekStepBars([
  { daysAgo: 0, steps: 5000 },
  { daysAgo: 1, steps: 8000 },
  { daysAgo: 2, steps: null },
  { daysAgo: 3, steps: 2000 },
  { daysAgo: 4, steps: 3000 },
  { daysAgo: 5, steps: 1000 },
  { daysAgo: 6, steps: 4000 },
])
assert.equal(bars.length, 7)
assert.equal(bars[6].isToday, true)
assert.equal(bars[6].daysAgo, 0)
assert.ok(bars[0].daysAgo === 6)

const est = estimateMinutesFromSteps(9000)
assert.ok(est.walk >= est.jog)
assert.ok(est.walk + est.jog + est.run > 0)

const resolved = resolveActivityMinutes(
  { walk: 10, jog: 0, run: 0 },
  5000
)
assert.equal(resolved.walk, 10)

console.log(
  'Activity screen contract OK — goal ring + 7-day bars + walk/jog/run minutes'
)
