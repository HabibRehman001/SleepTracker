/**
 * Step 104–105 — CSV flatten + JSON nested export.
 */

import { format } from 'date-fns'

import { sleepEntryRepository } from '../repositories/sleepEntry.repository'
import { entryMonthKey } from './monthlyReport'
import type { SleepEntryInput, SleepEntryWithRelations } from '../types'

/** Stable column order for GET /api/export/csv (and /sleep-entries.csv). */
export const CSV_EXPORT_HEADERS = [
  'id',
  'date',
  'bedTime',
  'attemptSleepTime',
  'estimatedSleepTime',
  'wakeTime',
  'outOfBedTime',
  'numberOfAwakenings',
  'sleepQuality',
  'energyMorning',
  'energyWork',
  'notes',
  // mood
  'mood',
  'stress',
  'anxiety',
  'motivation',
  // food
  'mealBeforeSleep',
  'mealTime',
  'mealType',
  'caffeineAmountMg',
  'caffeineLastConsumed',
  // exercise
  'exercise',
  'exerciseType',
  'exerciseDuration',
  'workoutTime',
  // environment
  'roomTemp',
  'fanOn',
  'acOn',
  'blackoutCurtains',
  'eyeMask',
  'whiteNoise',
  'phoneUsedBeforeSleep',
  'minutesPhoneBeforeSleep',
  'sunlightSeenBeforeSleep',
  'birdsHeard',
  'fajrHeard',
  'screenBrightness',
  // health
  'weight',
  'restingHeartRate',
  'bloodPressure',
] as const

export type CsvExportHeader = (typeof CSV_EXPORT_HEADERS)[number]

/** UTF-8 BOM so Excel detects encoding correctly. */
export const CSV_UTF8_BOM = '\uFEFF'

function csvEscape(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return ''
  }

  const text = String(value)
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }

  return text
}

function formatDay(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

function formatTimestamp(date: Date | null | undefined): string {
  if (!date) return ''
  return date.toISOString()
}

function formatBool(value: boolean | null | undefined): string {
  if (value === null || value === undefined) return ''
  return value ? 'true' : 'false'
}

/** One flat object per logged day (SleepEntry + nested children). */
export function flattenSleepEntry(
  entry: SleepEntryWithRelations
): Record<CsvExportHeader, string | number | boolean | null | undefined> {
  return {
    id: entry.id,
    date: formatDay(entry.date),
    bedTime: formatTimestamp(entry.bedTime),
    attemptSleepTime: formatTimestamp(entry.attemptSleepTime),
    estimatedSleepTime: formatTimestamp(entry.estimatedSleepTime),
    wakeTime: formatTimestamp(entry.wakeTime),
    outOfBedTime: formatTimestamp(entry.outOfBedTime),
    numberOfAwakenings: entry.numberOfAwakenings,
    sleepQuality: entry.sleepQuality,
    energyMorning: entry.energyMorning,
    energyWork: entry.energyWork,
    notes: entry.notes,

    mood: entry.mood?.mood,
    stress: entry.mood?.stress,
    anxiety: entry.mood?.anxiety,
    motivation: entry.mood?.motivation,

    mealBeforeSleep:
      entry.food == null ? '' : formatBool(entry.food.mealBeforeSleep),
    mealTime: formatTimestamp(entry.food?.mealTime),
    mealType: entry.food?.mealType,
    caffeineAmountMg: entry.food?.caffeineAmountMg,
    caffeineLastConsumed: formatTimestamp(entry.food?.caffeineLastConsumed),

    exercise: entry.exercise == null ? '' : formatBool(entry.exercise.exercise),
    exerciseType: entry.exercise?.exerciseType,
    exerciseDuration: entry.exercise?.duration,
    workoutTime: formatTimestamp(entry.exercise?.workoutTime),

    roomTemp: entry.environment?.roomTemp,
    fanOn: formatBool(entry.environment?.fanOn),
    acOn: formatBool(entry.environment?.acOn),
    blackoutCurtains: formatBool(entry.environment?.blackoutCurtains),
    eyeMask: formatBool(entry.environment?.eyeMask),
    whiteNoise: formatBool(entry.environment?.whiteNoise),
    phoneUsedBeforeSleep: formatBool(entry.environment?.phoneUsedBeforeSleep),
    minutesPhoneBeforeSleep: entry.environment?.minutesPhoneBeforeSleep,
    sunlightSeenBeforeSleep: formatBool(
      entry.environment?.sunlightSeenBeforeSleep
    ),
    birdsHeard: formatBool(entry.environment?.birdsHeard),
    fajrHeard: formatBool(entry.environment?.fajrHeard),
    screenBrightness: entry.environment?.screenBrightness,

    weight: entry.health?.weight,
    restingHeartRate: entry.health?.restingHeartRate,
    bloodPressure: entry.health?.bloodPressure,
  }
}

/**
 * Pure CSV builder: header row + one data row per entry (sorted as given).
 * Includes UTF-8 BOM for Excel.
 */
export function sleepEntriesToCsv(entries: SleepEntryWithRelations[]): string {
  const headerLine = CSV_EXPORT_HEADERS.join(',')
  const rows = entries.map((entry) => {
    const flat = flattenSleepEntry(entry)
    return CSV_EXPORT_HEADERS.map((key) => csvEscape(flat[key])).join(',')
  })
  return CSV_UTF8_BOM + [headerLine, ...rows].join('\r\n')
}

/**
 * Excel workbook (.xlsx) — same flattened columns as CSV, one row per night.
 */
export async function sleepEntriesToXlsx(
  entries: SleepEntryWithRelations[]
): Promise<Buffer> {
  const mod = await import('exceljs')
  const ExcelJS = (mod as { default?: typeof mod }).default ?? mod
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'SleepTracker'
  workbook.created = new Date()
  const sheet = workbook.addWorksheet('Sleep export', {
    views: [{ state: 'frozen', ySplit: 1 }],
  })

  sheet.addRow([...CSV_EXPORT_HEADERS])
  const header = sheet.getRow(1)
  header.font = { bold: true }

  for (const entry of entries) {
    const flat = flattenSleepEntry(entry)
    sheet.addRow(
      CSV_EXPORT_HEADERS.map((key) => {
        const v = flat[key]
        if (v === null || v === undefined) return ''
        return v
      })
    )
  }

  sheet.columns.forEach((col) => {
    let max = 10
    col.eachCell?.({ includeEmpty: true }, (cell) => {
      const len = String(cell.value ?? '').length
      if (len > max) max = Math.min(len, 40)
    })
    col.width = max + 2
  })

  const buf = await workbook.xlsx.writeBuffer()
  return Buffer.from(buf)
}

/** Parse a CSV produced by {@link sleepEntriesToCsv} (for tests). */
export function parseExportCsv(csv: string): {
  headers: string[]
  rows: string[][]
} {
  const text = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv
  const lines = text.split(/\r?\n/).filter((line) => line.length > 0)
  if (lines.length === 0) {
    return { headers: [], rows: [] }
  }

  const parseLine = (line: string): string[] => {
    const cells: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        let cell = ''
        i += 1
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            cell += '"'
            i += 2
            continue
          }
          if (line[i] === '"') {
            i += 1
            break
          }
          cell += line[i]
          i += 1
        }
        cells.push(cell)
        if (line[i] === ',') i += 1
        continue
      }
      const next = line.indexOf(',', i)
      if (next === -1) {
        cells.push(line.slice(i))
        break
      }
      cells.push(line.slice(i, next))
      i = next + 1
    }
    return cells
  }

  const headers = parseLine(lines[0])
  const rows = lines.slice(1).map(parseLine)
  return { headers, rows }
}

// ---------------------------------------------------------------------------
// Step 105 — JSON export (full nested query result)
// ---------------------------------------------------------------------------

/** Wire / file shape for GET /api/export/json. */
export type SleepJsonExport = {
  format: 'json'
  exportedAt: string
  entryCount: number
  /** Full nested SleepEntry rows (dates as ISO strings after JSON.stringify). */
  entries: SleepEntryWithRelations[]
}

/**
 * Pure builder: wrap findAll-shaped entries for download.
 * Express `res.json` serializes Date → ISO; tests should JSON.parse(JSON.stringify(...)).
 */
export function sleepEntriesToJsonExport(
  entries: SleepEntryWithRelations[]
): SleepJsonExport {
  return {
    format: 'json',
    exportedAt: new Date().toISOString(),
    entryCount: entries.length,
    entries,
  }
}

function asDate(value: unknown): Date | null {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }
  const d = new Date(String(value))
  return Number.isNaN(d.getTime()) ? null : d
}

function asNumber(value: unknown): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function asBool(value: unknown): boolean | null {
  if (value == null || value === '') return null
  if (typeof value === 'boolean') return value
  if (value === 'true') return true
  if (value === 'false') return false
  return null
}

function asString(value: unknown): string | null {
  if (value == null) return null
  return String(value)
}

/** Calendar day key used by upsert / seed (`yyyy-MM-dd`). */
export function jsonExportDateKey(date: unknown): string {
  const d = asDate(date)
  if (!d) {
    throw new Error('JSON export entry missing valid date')
  }
  // Prefer UTC calendar day so ISO midnight round-trips with parseEntryDate.
  return d.toISOString().slice(0, 10)
}

/**
 * Strip DB ids / meta and map a JSON-exported entry → {@link SleepEntryInput}
 * (same nested field shape the PUT upsert / seed children use).
 */
export function jsonExportEntryToUpsertInput(
  raw: Record<string, unknown>
): SleepEntryInput {
  const moodRaw = raw.mood as Record<string, unknown> | null | undefined
  const foodRaw = raw.food as Record<string, unknown> | null | undefined
  const exerciseRaw = raw.exercise as Record<string, unknown> | null | undefined
  const envRaw = raw.environment as Record<string, unknown> | null | undefined
  const healthRaw = raw.health as Record<string, unknown> | null | undefined

  return {
    bedTime: asDate(raw.bedTime),
    attemptSleepTime: asDate(raw.attemptSleepTime),
    estimatedSleepTime: asDate(raw.estimatedSleepTime),
    wakeTime: asDate(raw.wakeTime),
    outOfBedTime: asDate(raw.outOfBedTime),
    numberOfAwakenings: asNumber(raw.numberOfAwakenings),
    sleepQuality: asNumber(raw.sleepQuality),
    energyMorning: asNumber(raw.energyMorning),
    energyWork: asNumber(raw.energyWork),
    notes: asString(raw.notes),
    mood: moodRaw
      ? {
          mood: asNumber(moodRaw.mood) ?? 5,
          stress: asNumber(moodRaw.stress) ?? 5,
          anxiety: asNumber(moodRaw.anxiety) ?? 5,
          motivation: asNumber(moodRaw.motivation) ?? 5,
        }
      : null,
    food: foodRaw
      ? {
          mealBeforeSleep: asBool(foodRaw.mealBeforeSleep) ?? false,
          mealTime: asDate(foodRaw.mealTime),
          mealType: asString(foodRaw.mealType),
          caffeineAmountMg: asNumber(foodRaw.caffeineAmountMg),
          caffeineLastConsumed: asDate(foodRaw.caffeineLastConsumed),
        }
      : null,
    exercise: exerciseRaw
      ? {
          exercise: asBool(exerciseRaw.exercise) ?? false,
          exerciseType: asString(exerciseRaw.exerciseType),
          duration: asNumber(exerciseRaw.duration),
          workoutTime: asDate(exerciseRaw.workoutTime),
        }
      : null,
    environment: envRaw
      ? {
          roomTemp: asNumber(envRaw.roomTemp),
          fanOn: asBool(envRaw.fanOn),
          acOn: asBool(envRaw.acOn),
          blackoutCurtains: asBool(envRaw.blackoutCurtains),
          eyeMask: asBool(envRaw.eyeMask),
          whiteNoise: asBool(envRaw.whiteNoise),
          phoneUsedBeforeSleep: asBool(envRaw.phoneUsedBeforeSleep),
          minutesPhoneBeforeSleep: asNumber(envRaw.minutesPhoneBeforeSleep),
          sunlightSeenBeforeSleep: asBool(envRaw.sunlightSeenBeforeSleep),
          birdsHeard: asBool(envRaw.birdsHeard),
          fajrHeard: asBool(envRaw.fajrHeard),
          screenBrightness: asNumber(envRaw.screenBrightness),
        }
      : null,
    health: healthRaw
      ? {
          weight: asNumber(healthRaw.weight),
          restingHeartRate: asNumber(healthRaw.restingHeartRate),
          bloodPressure: asString(healthRaw.bloodPressure),
        }
      : null,
  }
}

/**
 * Seed-script create shape: scalars + `mood: { create: … }` nested children.
 * Feed this to `prisma.sleepEntry.create({ data })` (override `date` as needed).
 */
export function jsonExportEntryToSeedCreateData(
  raw: Record<string, unknown>,
  dateOverride?: Date
): Record<string, unknown> {
  const input = jsonExportEntryToUpsertInput(raw)
  const date = dateOverride ?? asDate(raw.date)
  if (!date) {
    throw new Error('JSON export entry missing date for seed create')
  }

  return {
    date,
    bedTime: input.bedTime ?? null,
    attemptSleepTime: input.attemptSleepTime ?? null,
    estimatedSleepTime: input.estimatedSleepTime ?? null,
    wakeTime: input.wakeTime ?? null,
    outOfBedTime: input.outOfBedTime ?? null,
    numberOfAwakenings: input.numberOfAwakenings ?? null,
    sleepQuality: input.sleepQuality ?? null,
    energyMorning: input.energyMorning ?? null,
    energyWork: input.energyWork ?? null,
    notes: input.notes ?? null,
    ...(input.mood ? { mood: { create: input.mood } } : {}),
    ...(input.food ? { food: { create: input.food } } : {}),
    ...(input.exercise ? { exercise: { create: input.exercise } } : {}),
    ...(input.environment
      ? { environment: { create: input.environment } }
      : {}),
    ...(input.health ? { health: { create: input.health } } : {}),
  }
}

// ---------------------------------------------------------------------------
// Step 106 — Markdown export (human-readable daily log)
// ---------------------------------------------------------------------------

function mdClock(date: Date | null | undefined): string {
  if (!date) return '—'
  return format(date, 'HH:mm')
}

function mdValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'yes' : 'no'
  return String(value)
}

function mdBullet(label: string, value: string): string {
  return `- **${label}:** ${value}`
}

/** One day block: `## yyyy-MM-dd` + bullet fields. */
export function sleepEntryToMarkdown(entry: SleepEntryWithRelations): string {
  const day = format(entry.date, 'yyyy-MM-dd')
  const lines: string[] = [`## ${day}`, '']

  lines.push(mdBullet('Bed time', mdClock(entry.bedTime)))
  lines.push(mdBullet('Attempt sleep', mdClock(entry.attemptSleepTime)))
  lines.push(mdBullet('Estimated sleep', mdClock(entry.estimatedSleepTime)))
  lines.push(mdBullet('Wake time', mdClock(entry.wakeTime)))
  lines.push(mdBullet('Out of bed', mdClock(entry.outOfBedTime)))
  lines.push(mdBullet('Awakenings', mdValue(entry.numberOfAwakenings)))
  lines.push(mdBullet('Sleep quality', mdValue(entry.sleepQuality)))
  lines.push(mdBullet('Energy (morning)', mdValue(entry.energyMorning)))
  lines.push(mdBullet('Energy (work)', mdValue(entry.energyWork)))
  lines.push(mdBullet('Notes', mdValue(entry.notes)))

  if (entry.mood) {
    lines.push('')
    lines.push(mdBullet('Mood', mdValue(entry.mood.mood)))
    lines.push(mdBullet('Stress', mdValue(entry.mood.stress)))
    lines.push(mdBullet('Anxiety', mdValue(entry.mood.anxiety)))
    lines.push(mdBullet('Motivation', mdValue(entry.mood.motivation)))
  }

  if (entry.food) {
    lines.push('')
    lines.push(
      mdBullet('Meal before sleep', mdValue(entry.food.mealBeforeSleep))
    )
    lines.push(mdBullet('Meal type', mdValue(entry.food.mealType)))
    lines.push(mdBullet('Caffeine (mg)', mdValue(entry.food.caffeineAmountMg)))
  }

  if (entry.exercise) {
    lines.push('')
    lines.push(mdBullet('Exercise', mdValue(entry.exercise.exercise)))
    lines.push(mdBullet('Exercise type', mdValue(entry.exercise.exerciseType)))
    lines.push(mdBullet('Exercise duration (min)', mdValue(entry.exercise.duration)))
  }

  if (entry.environment) {
    lines.push('')
    lines.push(mdBullet('Room temp (°C)', mdValue(entry.environment.roomTemp)))
    lines.push(
      mdBullet(
        'Phone before sleep',
        mdValue(entry.environment.phoneUsedBeforeSleep)
      )
    )
    lines.push(
      mdBullet(
        'Minutes on phone',
        mdValue(entry.environment.minutesPhoneBeforeSleep)
      )
    )
    lines.push(
      mdBullet(
        'Sunrise before bed',
        mdValue(entry.environment.sunlightSeenBeforeSleep)
      )
    )
  }

  if (entry.health) {
    lines.push('')
    lines.push(mdBullet('Weight', mdValue(entry.health.weight)))
    lines.push(
      mdBullet('Resting HR', mdValue(entry.health.restingHeartRate))
    )
    lines.push(mdBullet('Blood pressure', mdValue(entry.health.bloodPressure)))
  }

  return lines.join('\n')
}

/**
 * Human-readable Markdown log for personal notes.
 * Each night is a `## yyyy-MM-dd` section with `- **Field:** value` bullets.
 */
export function sleepEntriesToMarkdown(
  entries: SleepEntryWithRelations[]
): string {
  const header = [
    '# SleepTracker export',
    '',
    `_${entries.length} night${entries.length === 1 ? '' : 's'} · exported ${format(new Date(), 'yyyy-MM-dd')}_`,
    '',
    '---',
    '',
  ].join('\n')

  if (entries.length === 0) {
    return header + '_No sleep entries._\n'
  }

  const body = entries.map(sleepEntryToMarkdown).join('\n\n---\n\n')
  return `${header}${body}\n`
}

export type ExportFormat = 'csv' | 'json' | 'md' | 'pdf' | 'xlsx'

/** Step 108 — download basename, e.g. sleep-export-2026-07.csv */
export function buildExportFilename(
  format: ExportFormat,
  month: string
): string {
  const ext = format === 'md' ? 'md' : format
  return `sleep-export-${month}.${ext}`
}

export function filterEntriesByMonth(
  entries: SleepEntryWithRelations[],
  month?: string
): SleepEntryWithRelations[] {
  if (!month) return entries
  return entries.filter((e) => entryMonthKey(e.date) === month)
}

async function loadEntries(month?: string): Promise<SleepEntryWithRelations[]> {
  const all = await sleepEntryRepository.findAll()
  return filterEntriesByMonth(all, month)
}

export const exportService = {
  async exportSleepEntriesCsv(month?: string): Promise<string> {
    const entries = await loadEntries(month)
    return sleepEntriesToCsv(entries)
  },

  /** Step 104 — full flattened CSV. */
  async exportCsv(month?: string): Promise<string> {
    return exportService.exportSleepEntriesCsv(month)
  },

  /** @deprecated Use exportCsv. */
  async exportCsvStub(): Promise<string> {
    return exportService.exportCsv()
  },

  /** Step 105 — full nested JSON (findAll as-is). */
  async exportJson(month?: string): Promise<SleepJsonExport> {
    const entries = await loadEntries(month)
    return sleepEntriesToJsonExport(entries)
  },

  /** @deprecated Use exportJson. */
  async exportJsonStub(): Promise<SleepJsonExport> {
    return exportService.exportJson()
  },

  /** Step 106 — human-readable Markdown daily log. */
  async exportMarkdown(month?: string): Promise<string> {
    const entries = await loadEntries(month)
    return sleepEntriesToMarkdown(entries)
  },

  /** Step 107 — one-page monthly PDF (stats + quality chart image). */
  async exportPdf(month?: string): Promise<{
    buffer: Buffer
    month: string
    filename: string
  }> {
    const { renderMonthlyReportPdf } = await import('./pdf/renderMonthlyReportPdf')
    const entries = await sleepEntryRepository.findAll()
    const result = await renderMonthlyReportPdf(entries, { month })
    return {
      ...result,
      filename: buildExportFilename('pdf', result.month),
    }
  },

  /** Excel spreadsheet (.xlsx) — flattened nights for Sheets/Excel. */
  async exportXlsx(month?: string): Promise<{
    buffer: Buffer
    filename: string
    month: string
  }> {
    const entries = await loadEntries(month)
    const resolvedMonth = month ?? format(new Date(), 'yyyy-MM')
    const buffer = await sleepEntriesToXlsx(entries)
    return {
      buffer,
      month: resolvedMonth,
      filename: buildExportFilename('xlsx', resolvedMonth),
    }
  },
}
