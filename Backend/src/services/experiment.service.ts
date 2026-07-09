import { AppError } from '../middleware/errorMiddleware'
import { experimentRepository } from '../repositories/experiment.repository'
import type { ExperimentRecord } from '../types'

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
    endDate: string | Date
  }): Promise<ExperimentRecord> {
    if (!input.name?.trim()) {
      throw new AppError('Experiment name is required', 400)
    }

    const startDate = new Date(input.startDate)
    const endDate = new Date(input.endDate)

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new AppError('Valid startDate and endDate are required', 400)
    }

    if (endDate < startDate) {
      throw new AppError('endDate must be on or after startDate', 400)
    }

    return experimentRepository.create({
      name: input.name.trim(),
      startDate,
      endDate,
    })
  },
}
