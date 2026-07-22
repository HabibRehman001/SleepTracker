/**
 * Step 184 — Activity screen math (pure; no expo).
 */

import type { ActivityType } from './activityClassification'

export const DEFAULT_DAILY_STEP_GOAL = 8_000

export type DayStepBar = {
  /** 0 = today, 1 = yesterday, … */
  daysAgo: number
  /** Short weekday label e.g. Mon */
  label: string
  steps: number | null
  /** 0–1 height vs max in the series (or goal). */
  heightRatio: number
  isToday: boolean
}

export type ActivityMinutes = {
  walk: number
  jog: number
  run: number
}

export function goalProgress(
  steps: number,
  goal = DEFAULT_DAILY_STEP_GOAL
): { ratio: number; percent: number; remaining: number } {
  const g = Math.max(1, goal)
  const s = Math.max(0, Number.isFinite(steps) ? steps : 0)
  const ratio = Math.min(1, s / g)
  return {
    ratio,
    percent: Math.round(ratio * 100),
    remaining: Math.max(0, g - s),
  }
}

/** Weekday short labels for a local calendar day. */
export function weekdayShortLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { weekday: 'short' })
}

/**
 * Build 7 bars: oldest → today (left → right), like a week strip.
 * `series` keyed by daysAgo 0..6 with step counts (null = unknown).
 */
export function buildWeekStepBars(
  series: Array<{ daysAgo: number; steps: number | null }>,
  now = new Date(),
  goal = DEFAULT_DAILY_STEP_GOAL
): DayStepBar[] {
  const byAgo = new Map(series.map((d) => [d.daysAgo, d.steps]))
  const values: number[] = []
  for (let ago = 6; ago >= 0; ago--) {
    const s = byAgo.get(ago)
    if (s != null && s > 0) values.push(s)
  }
  const max = Math.max(goal, ...values, 1)

  const bars: DayStepBar[] = []
  for (let ago = 6; ago >= 0; ago--) {
    const day = new Date(now)
    day.setHours(12, 0, 0, 0)
    day.setDate(day.getDate() - ago)
    const steps = byAgo.has(ago) ? (byAgo.get(ago) ?? null) : null
    bars.push({
      daysAgo: ago,
      label: weekdayShortLabel(day),
      steps,
      heightRatio: steps != null && steps > 0 ? Math.min(1, steps / max) : 0,
      isToday: ago === 0,
    })
  }
  return bars
}

export function totalActivityMinutes(m: ActivityMinutes): number {
  return Math.max(0, m.walk) + Math.max(0, m.jog) + Math.max(0, m.run)
}

/**
 * When live minutes aren't tracked yet, rough split of today's steps into
 * minutes using typical cadences (personal-use estimate).
 */
export function estimateMinutesFromSteps(
  steps: number,
  mix: { walk: number; jog: number; run: number } = {
    walk: 0.75,
    jog: 0.2,
    run: 0.05,
  }
): ActivityMinutes {
  const s = Math.max(0, steps)
  const walkSteps = s * mix.walk
  const jogSteps = s * mix.jog
  const runSteps = s * mix.run
  return {
    walk: Math.round(walkSteps / 90),
    jog: Math.round(jogSteps / 125),
    run: Math.round(runSteps / 165),
  }
}

/** Prefer live tracked minutes; fall back to estimate when all zero. */
export function resolveActivityMinutes(
  tracked: ActivityMinutes,
  todaySteps: number
): ActivityMinutes {
  if (totalActivityMinutes(tracked) > 0) return tracked
  if (todaySteps > 0) return estimateMinutesFromSteps(todaySteps)
  return { walk: 0, jog: 0, run: 0 }
}

export function formatStepCount(steps: number): string {
  if (!Number.isFinite(steps)) return '0'
  return Math.round(steps).toLocaleString()
}

export function activityTypeLabel(type: ActivityType): string {
  return type.charAt(0).toUpperCase() + type.slice(1)
}
