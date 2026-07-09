import type {
  AnalyticsSummary,
  CorrelationResult,
  SleepEntryWithRelations,
} from '../types'

/**
 * Pure Pearson correlation — no Express, no Prisma.
 * Unit-testable with plain number arrays.
 */
export function pearsonCorrelation(xs: number[], ys: number[]): number | null {
  if (xs.length !== ys.length || xs.length < 2) {
    return null
  }

  const n = xs.length
  const meanX = xs.reduce((sum, value) => sum + value, 0) / n
  const meanY = ys.reduce((sum, value) => sum + value, 0) / n

  let numerator = 0
  let denomX = 0
  let denomY = 0

  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX
    const dy = ys[i] - meanY
    numerator += dx * dy
    denomX += dx * dx
    denomY += dy * dy
  }

  const denominator = Math.sqrt(denomX * denomY)
  if (denominator === 0) {
    return null
  }

  return numerator / denominator
}

function average(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length
}

type FactorExtractor = (entry: SleepEntryWithRelations) => number | null

const FACTORS: { factor: string; extract: FactorExtractor }[] = [
  {
    factor: 'stress',
    extract: (entry) => entry.mood?.stress ?? null,
  },
  {
    factor: 'anxiety',
    extract: (entry) => entry.mood?.anxiety ?? null,
  },
  {
    factor: 'caffeineAmountMg',
    extract: (entry) => entry.food?.caffeineAmountMg ?? null,
  },
  {
    factor: 'minutesPhoneBeforeSleep',
    extract: (entry) => entry.environment?.minutesPhoneBeforeSleep ?? null,
  },
  {
    factor: 'exerciseDuration',
    extract: (entry) => entry.exercise?.duration ?? null,
  },
]

/**
 * Pure analytics over in-memory entries — injectable for unit tests.
 */
export function computeAnalyticsSummary(
  entries: SleepEntryWithRelations[]
): AnalyticsSummary {
  const qualities = entries
    .map((entry) => entry.sleepQuality)
    .filter((value): value is number => value !== null)

  const correlations: CorrelationResult[] = FACTORS.flatMap(({ factor, extract }) => {
    const pairs = entries
      .map((entry) => {
        const quality = entry.sleepQuality
        const factorValue = extract(entry)
        if (quality === null || factorValue === null) {
          return null
        }
        return { quality, factorValue }
      })
      .filter((pair): pair is { quality: number; factorValue: number } => pair !== null)

    const coefficient = pearsonCorrelation(
      pairs.map((pair) => pair.factorValue),
      pairs.map((pair) => pair.quality)
    )

    if (coefficient === null) {
      return []
    }

    return [
      {
        factor,
        coefficient: Number(coefficient.toFixed(4)),
        sampleSize: pairs.length,
      },
    ]
  })

  return {
    entryCount: entries.length,
    averageSleepQuality:
      average(qualities) === null
        ? null
        : Number(average(qualities)!.toFixed(2)),
    correlations,
  }
}

export type SleepEntryReader = {
  findAll: () => Promise<SleepEntryWithRelations[]>
}

/**
 * Service facade used by routes. Depends on a repository interface,
 * not Prisma or Express — swap in a fake reader for unit tests.
 */
export function createAnalyticsService(reader: SleepEntryReader) {
  return {
    async getSummary(): Promise<AnalyticsSummary> {
      const entries = await reader.findAll()
      return computeAnalyticsSummary(entries)
    },
  }
}
