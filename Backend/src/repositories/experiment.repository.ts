import { prisma } from '../lib/prisma'
import type { ExperimentRecord } from '../types'

export const experimentRepository = {
  async findAll(): Promise<ExperimentRecord[]> {
    return prisma.experiment.findMany({
      orderBy: { startDate: 'desc' },
    })
  },

  async findById(id: string): Promise<ExperimentRecord | null> {
    return prisma.experiment.findUnique({
      where: { id },
    })
  },

  async create(data: {
    name: string
    startDate: Date
    endDate: Date
  }): Promise<ExperimentRecord> {
    return prisma.experiment.create({ data })
  },
}
