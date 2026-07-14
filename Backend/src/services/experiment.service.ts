import { AppError } from '../middleware/errorMiddleware'
import { experimentRepository } from '../repositories/experiment.repository'
import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import {
  latencyMinutes,
  sleepDurationHours,
  sleepQuality,
} from './analytics.service'
import {
  computeExperimentComparison,
  type ExperimentComparison,
} from './experimentComparison'
import type { ExperimentRecord, SleepEntryWithRelations } from '../types'

export {
  computeExperimentComparison,
  experimentOutcomeDiff,
  mean,
  splitExperimentWindows,
  welchTTest,
  EXPERIMENT_BEFORE_WINDOW_DAYS,
  EXPERIMENT_ALPHA,
  type ExperimentComparison,
  type ExperimentOutcomeDiff,
} from './experimentComparison'

const EXPERIMENT_OUTCOME_METRICS = [
  {
    key: 'sleepQuality',
    label: 'Sleep quality',
    unit: 'points',
    get: (e: SleepEntryWithRelations) => sleepQuality(e),
  },
  {
    key: 'durationHours',
    label: 'Sleep duration',
    unit: 'hours',
    get: (e: SleepEntryWithRelations) => sleepDurationHours(e),
  },
  {
    key: 'latencyMinutes',
    label: 'Sleep latency',
    unit: 'minutes',
    get: (e: SleepEntryWithRelations) => latencyMinutes(e),
  },
] as const

function parseOptionalDate(
  value: string | Date | null | undefined,
  field: string,
  required: boolean
): Date | null {
  if (value == null || value === '') {
    if (required) {
      throw new AppError(`${field} is required`, 400)
    }
    return null
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Valid ${field} is required`, 400)
  }
  return date
}

export const experimentService = {
  async list(): Promise<ExperimentRecord[]> {
    return experimentRepository.findAll()
  },

  async getById(id: string): Promise<ExperimentRecord> {
    const experiment = await experimentRepository.findById(id)

    if (!experiment) {
      throw new AppError('Experiment not found', 404)
    }

    return experiment
  },

  async create(input: {
    name: string
    startDate: string | Date
    endDate?: string | Date | null
  }): Promise<ExperimentRecord> {
    if (!input.name?.trim()) {
      throw new AppError('Experiment name is required', 400)
    }

    const startDate = parseOptionalDate(input.startDate, 'startDate', true)
    if (!startDate) {
      throw new AppError('Valid startDate is required', 400)
    }

    const endDate = parseOptionalDate(
      input.endDate ?? null,
      'endDate',
      false
    )

    if (endDate && endDate < startDate) {
      throw new AppError('endDate must be on or after startDate', 400)
    }

    return experimentRepository.create({
      name: input.name.trim(),
      startDate,
      endDate,
    })
  },

  async delete(id: string): Promise<void> {
    const existing = await experimentRepository.findById(id)
    if (!existing) {
      throw new AppError('Experiment not found', 404)
    }
    await experimentRepository.delete(id)
  },

  /**
   * Step 98 — before (last 14 pre nights) vs during means + diffs per outcome.
   */
  async getComparison(id: string): Promise<ExperimentComparison> {
    const experiment = await experimentService.getById(id)
    const entries = await sleepEntryRepository.findAll()
    return computeExperimentComparison(
      entries,
      experiment,
      [...EXPERIMENT_OUTCOME_METRICS]
    )
  },
}
