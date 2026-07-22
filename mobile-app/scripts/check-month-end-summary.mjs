/**
 * Step 186 — month-end summary notification on the 1st.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  monthEndSummaryBody,
  nextMonthEndSummaryFireAt,
  reportMonthName,
  MONTH_END_SUMMARY_DAY,
  MONTH_END_SUMMARY_HOUR,
  MONTH_END_SUMMARY_NOTIFICATION_ID,
} from '../services/monthEndSummaryMath.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const math = readFileSync(join(root, 'services/monthEndSummaryMath.ts'), 'utf8')
const service = readFileSync(join(root, 'services/monthEndSummary.ts'), 'utf8')
const notifScreen = readFileSync(
  join(root, 'app/notification-permission.tsx'),
  'utf8'
)
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const summary = readFileSync(join(root, '..', 'Summary.txt'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.match(math, /monthEndSummaryBody|nextMonthEndSummaryFireAt/)
assert.match(service, /syncMonthEndSummaryNotification/)
assert.match(service, /scheduleNotificationAsync/)
assert.match(service, /SchedulableTriggerInputTypes\.DATE|DATE/)
assert.match(notifScreen, /syncMonthEndSummaryNotification/)
assert.match(index, /syncMonthEndSummaryNotification|monthEndSummary/)
assert.match(summary, /Step 186|6\.134.*186|month-end|sleep report for/)
assert.ok(pkg.scripts['test:month-end-summary'])
assert.equal(MONTH_END_SUMMARY_DAY, 1)
assert.equal(MONTH_END_SUMMARY_HOUR, 9)
assert.equal(MONTH_END_SUMMARY_NOTIFICATION_ID, 'sleep-lock-month-end-summary')

// Mid-June → next fire 1 July 09:00 → body names June
const midJune = new Date(2026, 5, 15, 12, 0, 0)
const fire = nextMonthEndSummaryFireAt(midJune)
assert.equal(fire.getFullYear(), 2026)
assert.equal(fire.getMonth(), 6) // July
assert.equal(fire.getDate(), 1)
assert.equal(fire.getHours(), 9)
assert.equal(reportMonthName(fire), 'June')
assert.equal(
  monthEndSummaryBody(fire),
  'Your sleep report for June is ready.'
)

// On 1 July morning after fire time → next is 1 Aug → July report
const afterJulyFirst = new Date(2026, 6, 1, 10, 0, 0)
const next = nextMonthEndSummaryFireAt(afterJulyFirst)
assert.equal(next.getMonth(), 7) // August
assert.equal(monthEndSummaryBody(next), 'Your sleep report for July is ready.')

// Exactly on 1st before 09:00 → fires that morning
const earlyFirst = new Date(2026, 6, 1, 8, 0, 0)
const sameMorning = nextMonthEndSummaryFireAt(earlyFirst)
assert.equal(sameMorning.getDate(), 1)
assert.equal(sameMorning.getMonth(), 6)
assert.equal(
  monthEndSummaryBody(sameMorning),
  'Your sleep report for June is ready.'
)

console.log(
  'Month-end summary contract OK — 1st @ 09:00, “Your sleep report for June is ready.”'
)
