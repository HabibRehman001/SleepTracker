/**
 * Insight sentence templates (Steps 76–77).
 * Each template is guarded by a minimum effect-size threshold and fills real numbers.
 * Results are ranked by effect size; only the top 3–5 are returned.
 */

export type InsightCandidate = {
  /** Short phrase used in templates, e.g. "used your phone before sleep". */
  label: string
  /** YES − NO duration average (minutes). Template fires when > 20. */
  effectMinutes?: number
  /** YES − NO latency average (minutes). Template fires when > 15. */
  latencyDiff?: number
}

export type InsightTemplate = (c: InsightCandidate) => string | null

/** Cap ranked insights shown (Step 77 — "3–5 most meaningful"). */
export const MAX_RANKED_INSIGHTS = 5

export const insightTemplates: InsightTemplate[] = [
  (c) =>
    c.effectMinutes != null && c.effectMinutes > 20
      ? `You slept ${c.effectMinutes} minutes longer on days where you ${c.label}.`
      : null,
  (c) =>
    c.latencyDiff != null && c.latencyDiff > 15
      ? `${c.label} increased your average sleep latency by ${c.latencyDiff} minutes.`
      : null,
]

/** Dominant numeric effect size for ranking (absolute minutes). */
export function insightEffectSize(c: InsightCandidate): number {
  return Math.max(
    Math.abs(c.effectMinutes ?? 0),
    Math.abs(c.latencyDiff ?? 0)
  )
}

/** Largest-effect candidates first (registration order ignored). */
export function rankInsightCandidates(
  candidates: InsightCandidate[]
): InsightCandidate[] {
  return [...candidates].sort(
    (a, b) => insightEffectSize(b) - insightEffectSize(a)
  )
}

type ScoredSentence = {
  sentence: string
  effectSize: number
}

/**
 * Apply templates, rank by effect size, keep the top {@link MAX_RANKED_INSIGHTS}.
 */
export function generateInsightSentences(
  candidates: InsightCandidate[]
): string[] {
  const scored: ScoredSentence[] = []

  for (const candidate of candidates) {
    const durationSentence = insightTemplates[0](candidate)
    if (durationSentence != null && candidate.effectMinutes != null) {
      scored.push({
        sentence: durationSentence,
        effectSize: Math.abs(candidate.effectMinutes),
      })
    }
    const latencySentence = insightTemplates[1](candidate)
    if (latencySentence != null && candidate.latencyDiff != null) {
      scored.push({
        sentence: latencySentence,
        effectSize: Math.abs(candidate.latencyDiff),
      })
    }
  }

  scored.sort((a, b) => b.effectSize - a.effectSize)
  return scored.slice(0, MAX_RANKED_INSIGHTS).map((s) => s.sentence)
}
