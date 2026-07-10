import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import type { SleepEntryWithRelations } from '../types'

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

export function sleepEntriesToCsv(entries: SleepEntryWithRelations[]): string {
  const headers = [
    'id',
    'date',
    'sleepQuality',
    'energyMorning',
    'energyWork',
    'numberOfAwakenings',
    'mood',
    'stress',
    'anxiety',
    'motivation',
    'caffeineAmountMg',
    'exercise',
    'exerciseDuration',
    'minutesPhoneBeforeSleep',
    'notes',
  ]

  const rows = entries.map((entry) =>
    [
      entry.id,
      entry.date.toISOString(),
      entry.sleepQuality,
      entry.energyMorning,
      entry.energyWork,
      entry.numberOfAwakenings,
      entry.mood?.mood,
      entry.mood?.stress,
      entry.mood?.anxiety,
      entry.mood?.motivation,
      entry.food?.caffeineAmountMg,
      entry.exercise?.exercise,
      entry.exercise?.duration,
      entry.environment?.minutesPhoneBeforeSleep,
      entry.notes,
    ]
      .map(csvEscape)
      .join(',')
  )

  return [headers.join(','), ...rows].join('\n')
}

export const exportService = {
  async exportSleepEntriesCsv(): Promise<string> {
    const entries = await sleepEntryRepository.findAll()
    return sleepEntriesToCsv(entries)
  },

  /** Step 41 stub — full JSON export in steps 104–106. */
  async exportJsonStub(): Promise<{
    status: 'stub'
    format: 'json'
    message: string
    plannedSteps: string
    entryCount: number
  }> {
    const entries = await sleepEntryRepository.findAll()
    return {
      status: 'stub',
      format: 'json',
      message:
        'JSON export stub. Full nested export lands in Phase 1K (steps 104–106).',
      plannedSteps: '104-106',
      entryCount: entries.length,
    }
  },

  /** Step 41 stub — full CSV export polish in steps 104–106. */
  async exportCsvStub(): Promise<string> {
    const entries = await sleepEntryRepository.findAll()
    return [
      '# SleepTracker CSV export stub',
      '# Full implementation: steps 104-106 (Phase 1K)',
      `entryCount,${entries.length}`,
      'status,stub',
    ].join('\n')
  },
}
