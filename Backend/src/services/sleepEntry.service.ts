import { AppError } from '../middleware/errorMiddleware'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import type { SleepEntryInput, SleepEntryWithRelations } from '../types'

/**
 * Normalize route date params so "YYYY-MM-DD" always maps to the same unique key.
 * Full ISO strings are accepted as-is.
 */
export function parseEntryDate(value: string): Date {
  const trimmed = value.trim()

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const date = new Date(`${trimmed}T00:00:00.000Z`)
    if (Number.isNaN(date.getTime())) {
      throw new AppError(`Invalid date: ${value}`, 400)
    }
    return date
  }

  const date = new Date(trimmed)
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid date: ${value}`, 400)
  }
  return date
}

export const sleepEntryService = {
  async list(): Promise<SleepEntryWithRelations[]> {
    return sleepEntryRepository.findAll()
  },

  async getById(id: string): Promise<SleepEntryWithRelations> {
    const entry = await sleepEntryRepository.findById(id)

    if (!entry) {
      throw new AppError('Sleep entry not found', 404)
    }

    return entry
  },

  async getByDate(dateParam: string): Promise<SleepEntryWithRelations> {
    const date = parseEntryDate(dateParam)
    const entry = await sleepEntryRepository.findByDate(date)

    if (!entry) {
      throw new AppError(`Sleep entry not found for date ${dateParam}`, 404)
    }

    return entry
  },

  async upsertByDate(
    dateParam: string,
    data: SleepEntryInput
  ): Promise<SleepEntryWithRelations> {
    const date = parseEntryDate(dateParam)
    return sleepEntryRepository.upsert(date, data)
  },
}
