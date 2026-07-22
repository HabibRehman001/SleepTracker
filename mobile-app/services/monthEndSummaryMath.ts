/**
 * Step 186 — month-end sleep report notification (pure math).
 * Fires on the 1st; body names the month that just ended.
 */

export const MONTH_END_SUMMARY_HOUR = 9
export const MONTH_END_SUMMARY_MINUTE = 0
export const MONTH_END_SUMMARY_DAY = 1

export const MONTH_END_SUMMARY_TITLE = 'Sleep Lock'
export const MONTH_END_SUMMARY_NOTIFICATION_ID = 'sleep-lock-month-end-summary'

/**
 * Next local 1st-of-month at the configured clock time (strictly after `now`).
 */
export function nextMonthEndSummaryFireAt(
  now = new Date(),
  hour = MONTH_END_SUMMARY_HOUR,
  minute = MONTH_END_SUMMARY_MINUTE
): Date {
  let fire = new Date(
    now.getFullYear(),
    now.getMonth(),
    MONTH_END_SUMMARY_DAY,
    hour,
    minute,
    0,
    0
  )
  if (fire.getTime() <= now.getTime()) {
    fire = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      MONTH_END_SUMMARY_DAY,
      hour,
      minute,
      0,
      0
    )
  }
  return fire
}

/** Month the report covers when the notification fires on the 1st (previous month). */
export function reportMonthForFireAt(fireAt: Date): Date {
  return new Date(fireAt.getFullYear(), fireAt.getMonth() - 1, 1)
}

export function reportMonthName(
  fireAt: Date,
  locale = 'en-US'
): string {
  return reportMonthForFireAt(fireAt).toLocaleString(locale, { month: 'long' })
}

/** e.g. fire on 1 July → "Your sleep report for June is ready." */
export function monthEndSummaryBody(fireAt: Date, locale = 'en-US'): string {
  return `Your sleep report for ${reportMonthName(fireAt, locale)} is ready.`
}

export function isFirstOfMonth(now = new Date()): boolean {
  return now.getDate() === MONTH_END_SUMMARY_DAY
}
