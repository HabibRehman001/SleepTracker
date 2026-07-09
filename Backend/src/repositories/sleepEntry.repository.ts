import { prisma } from '../lib/prisma'
import type { SleepEntryInput, SleepEntryWithRelations } from '../types'

const sleepEntryInclude = {
  mood: true,
  food: true,
  exercise: true,
  environment: true,
  health: true,
} as const

function sleepScalars(data: SleepEntryInput) {
  return {
    bedTime: data.bedTime ?? null,
    attemptSleepTime: data.attemptSleepTime ?? null,
    estimatedSleepTime: data.estimatedSleepTime ?? null,
    wakeTime: data.wakeTime ?? null,
    outOfBedTime: data.outOfBedTime ?? null,
    numberOfAwakenings: data.numberOfAwakenings ?? null,
    sleepQuality: data.sleepQuality ?? null,
    energyMorning: data.energyMorning ?? null,
    energyWork: data.energyWork ?? null,
    notes: data.notes ?? null,
  }
}

export const sleepEntryRepository = {
  findAll: (): Promise<SleepEntryWithRelations[]> =>
    prisma.sleepEntry.findMany({
      include: sleepEntryInclude,
      orderBy: { date: 'asc' },
    }),

  /** @deprecated Prefer findAll — kept for existing service callers */
  findAllWithRelations: (): Promise<SleepEntryWithRelations[]> =>
    sleepEntryRepository.findAll(),

  findById: (id: string): Promise<SleepEntryWithRelations | null> =>
    prisma.sleepEntry.findUnique({
      where: { id },
      include: sleepEntryInclude,
    }),

  findByDate: (date: Date): Promise<SleepEntryWithRelations | null> =>
    prisma.sleepEntry.findUnique({
      where: { date },
      include: sleepEntryInclude,
    }),

  findBetween: (
    startDate: Date,
    endDate: Date
  ): Promise<SleepEntryWithRelations[]> =>
    prisma.sleepEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: sleepEntryInclude,
      orderBy: { date: 'asc' },
    }),

  upsert: (date: Date, data: SleepEntryInput): Promise<SleepEntryWithRelations> =>
    prisma.sleepEntry.upsert({
      where: { date },
      create: {
        date,
        ...sleepScalars(data),
        ...(data.mood
          ? { mood: { create: data.mood } }
          : {}),
        ...(data.food
          ? { food: { create: data.food } }
          : {}),
        ...(data.exercise
          ? { exercise: { create: data.exercise } }
          : {}),
        ...(data.environment
          ? { environment: { create: data.environment } }
          : {}),
        ...(data.health
          ? { health: { create: data.health } }
          : {}),
      },
      update: {
        ...sleepScalars(data),
        ...(data.mood
          ? {
              mood: {
                upsert: {
                  create: data.mood,
                  update: data.mood,
                },
              },
            }
          : {}),
        ...(data.food
          ? {
              food: {
                upsert: {
                  create: data.food,
                  update: data.food,
                },
              },
            }
          : {}),
        ...(data.exercise
          ? {
              exercise: {
                upsert: {
                  create: data.exercise,
                  update: data.exercise,
                },
              },
            }
          : {}),
        ...(data.environment
          ? {
              environment: {
                upsert: {
                  create: data.environment,
                  update: data.environment,
                },
              },
            }
          : {}),
        ...(data.health
          ? {
              health: {
                upsert: {
                  create: data.health,
                  update: data.health,
                },
              },
            }
          : {}),
      },
      include: sleepEntryInclude,
    }),
}
