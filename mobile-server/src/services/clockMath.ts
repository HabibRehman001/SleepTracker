/**
 * Circular clock math for bed/wake averages (Step 129).
 * Same concepts as Phase 1 analytics.service — reimplemented for ActivitySession.
 */

const MINUTES_PER_DAY = 24 * 60

export function minutesSinceMidnight(date: Date): number {
  return date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60
}

export function circularMeanMinutes(minutesList: number[]): number | null {
  if (minutesList.length === 0) return null
  let sinSum = 0
  let cosSum = 0
  for (const minutes of minutesList) {
    const angle = (minutes / MINUTES_PER_DAY) * 2 * Math.PI
    sinSum += Math.sin(angle)
    cosSum += Math.cos(angle)
  }
  const meanAngle = Math.atan2(
    sinSum / minutesList.length,
    cosSum / minutesList.length
  )
  let meanMinutes = (meanAngle / (2 * Math.PI)) * MINUTES_PER_DAY
  if (meanMinutes < 0) meanMinutes += MINUTES_PER_DAY
  return meanMinutes
}

export function circularStdDevMinutes(minutesList: number[]): number {
  if (minutesList.length < 2) return 0
  const meanMinutes = circularMeanMinutes(minutesList)
  if (meanMinutes === null) return 0
  const squared = minutesList.map((minutes) => {
    let delta = minutes - meanMinutes
    if (delta > MINUTES_PER_DAY / 2) delta -= MINUTES_PER_DAY
    if (delta < -MINUTES_PER_DAY / 2) delta += MINUTES_PER_DAY
    return delta * delta
  })
  return Math.sqrt(squared.reduce((sum, v) => sum + v, 0) / squared.length)
}

/** Bedtime consistency 0–100: lower stdev → higher score. */
export function consistencyScoreFromBedMinutes(bedMinutes: number[]): number {
  if (bedMinutes.length < 2) return 100
  const stdev = circularStdDevMinutes(bedMinutes)
  return Math.round((100 - Math.min(100, stdev)) * 10) / 10
}

export function formatClock(minutes: number): string {
  const rounded = Math.round(minutes) % MINUTES_PER_DAY
  const hh = Math.floor(rounded / 60)
  const mm = rounded % 60
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}
