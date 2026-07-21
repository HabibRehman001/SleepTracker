/**
 * Step 104–105 — CSV flatten + JSON nested export / re-import.
 */
import { format } from 'date-fns'

import { prisma } from '../src/lib/prisma'
import { sleepEntryRepository } from '../src/repositories/sleepEntry.repository'
import {
  CSV_EXPORT_HEADERS,
  CSV_UTF8_BOM,
  exportService,
  jsonExportEntryToSeedCreateData,
  jsonExportEntryToUpsertInput,
  parseExportCsv,
  sleepEntriesToCsv,
  sleepEntriesToJsonExport,
  sleepEntriesToMarkdown,
  sleepEntriesToXlsx,
  sleepEntryToMarkdown,
} from '../src/services/export.service'
import { buildQualityChartPng } from '../src/services/pdf/qualityChartPng'
import {
  buildQualitySeriesForMonth,
  renderMonthlyReportPdf,
} from '../src/services/pdf/renderMonthlyReportPdf'
import { entryMonthKey } from '../src/services/monthlyReport'
import { assert, assertClose, assertEqual, runTest } from './helpers'

export async function runExportStubTests(): Promise<boolean> {
  console.log('\n[export]')
  const results: boolean[] = []

  results.push(
    await runTest(
      'CSV: one row per logged day + correct headers (Excel/Sheets shape)',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 14, `need seeded nights, got ${entries.length}`)

        const csv = sleepEntriesToCsv(entries)
        assert(csv.startsWith(CSV_UTF8_BOM), 'UTF-8 BOM for Excel')

        const { headers, rows } = parseExportCsv(csv)
        assertEqual(headers.length, CSV_EXPORT_HEADERS.length, 'header count')
        assertEqual(
          headers.join(','),
          CSV_EXPORT_HEADERS.join(','),
          'header order'
        )
        assertEqual(rows.length, entries.length, 'one row per logged day')

        for (const required of [
          'date',
          'sleepQuality',
          'mood',
          'mealBeforeSleep',
          'exercise',
          'phoneUsedBeforeSleep',
          'weight',
        ]) {
          assert(headers.includes(required), `missing header ${required}`)
        }

        for (let i = 0; i < rows.length; i++) {
          assertEqual(rows[i].length, headers.length, `row ${i} column count`)
        }

        const dateIdx = headers.indexOf('date')
        const qualityIdx = headers.indexOf('sleepQuality')
        const first = entries[0]
        const last = entries[entries.length - 1]
        assertEqual(
          rows[0][dateIdx],
          format(first.date, 'yyyy-MM-dd'),
          'first date'
        )
        assertEqual(
          rows[rows.length - 1][dateIdx],
          format(last.date, 'yyyy-MM-dd'),
          'last date'
        )
        assertEqual(
          rows[0][qualityIdx],
          first.sleepQuality == null ? '' : String(first.sleepQuality),
          'first sleepQuality'
        )

        const viaService = await exportService.exportCsv()
        assertEqual(
          parseExportCsv(viaService).rows.length,
          entries.length,
          'exportCsv row count'
        )
      }
    )
  )

  results.push(
    await runTest(
      'Excel: xlsx workbook with same flattened columns as CSV',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 1, 'need at least one night')
        const buf = await sleepEntriesToXlsx(entries.slice(0, 3))
        assertEqual(buf.subarray(0, 2).toString('utf8'), 'PK', 'zip/xlsx magic')
        assert(buf.length > 500, 'non-trivial workbook')
        const viaService = await exportService.exportXlsx()
        assertEqual(viaService.buffer.subarray(0, 2).toString('utf8'), 'PK', 'service zip magic')
        assert(viaService.filename.endsWith('.xlsx'), 'xlsx filename')
      }
    )
  )

  results.push(
    await runTest(
      'JSON export re-imports via seed create shape',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 14, `need seeded nights, got ${entries.length}`)

        const payload = sleepEntriesToJsonExport(entries)
        assertEqual(payload.format, 'json', 'format')
        assertEqual(payload.entryCount, entries.length, 'entryCount')
        assertEqual(payload.entries.length, entries.length, 'entries length')

        // Simulate download wire format (Date → ISO strings).
        const wire = JSON.parse(JSON.stringify(payload)) as {
          format: string
          entryCount: number
          entries: Array<Record<string, unknown>>
        }
        assertEqual(wire.format, 'json', 'wire format')
        assert(Array.isArray(wire.entries), 'wire entries array')
        assert(
          typeof wire.entries[0].date === 'string',
          'date serialized as ISO string'
        )
        assert(
          wire.entries[0].mood &&
            typeof (wire.entries[0].mood as { mood: number }).mood === 'number',
          'nested mood preserved'
        )

        const viaService = await exportService.exportJson()
        assertEqual(viaService.entryCount, entries.length, 'service entryCount')
        assertEqual(viaService.format, 'json', 'service format')

        // Re-import one night through seed-script create format on a free date.
        const source = wire.entries[0]
        const importDate = new Date('2099-01-15T00:00:00.000Z')
        await prisma.sleepEntry.deleteMany({ where: { date: importDate } })

        const seedData = jsonExportEntryToSeedCreateData(source, importDate)
        assert(seedData.mood && typeof seedData.mood === 'object', 'seed mood.create')
        assert(
          (seedData.mood as { create: unknown }).create,
          'mood uses { create } like seed.ts'
        )
        assert(
          (seedData.food as { create: unknown })?.create,
          'food uses { create }'
        )
        assert(
          (seedData.exercise as { create: unknown })?.create,
          'exercise uses { create }'
        )
        assert(
          (seedData.environment as { create: unknown })?.create,
          'environment uses { create }'
        )
        assert(
          (seedData.health as { create: unknown })?.create,
          'health uses { create }'
        )

        await prisma.sleepEntry.create({
          data: seedData as Parameters<typeof prisma.sleepEntry.create>[0]['data'],
        })

        const reloaded = await sleepEntryRepository.findByDate(importDate)
        assert(reloaded != null, 're-imported entry exists')

        const upsertInput = jsonExportEntryToUpsertInput(source)
        assertEqual(
          reloaded!.sleepQuality,
          upsertInput.sleepQuality ?? null,
          'sleepQuality round-trip'
        )
        assertEqual(
          reloaded!.notes,
          upsertInput.notes ?? null,
          'notes round-trip'
        )
        assertEqual(
          reloaded!.mood?.mood,
          upsertInput.mood?.mood ?? null,
          'mood.mood round-trip'
        )
        assertEqual(
          reloaded!.mood?.stress,
          upsertInput.mood?.stress ?? null,
          'mood.stress round-trip'
        )
        assertEqual(
          reloaded!.food?.mealBeforeSleep,
          upsertInput.food?.mealBeforeSleep ?? null,
          'mealBeforeSleep round-trip'
        )
        assertEqual(
          reloaded!.food?.caffeineAmountMg,
          upsertInput.food?.caffeineAmountMg ?? null,
          'caffeine round-trip'
        )
        assertEqual(
          reloaded!.exercise?.exercise,
          upsertInput.exercise?.exercise ?? null,
          'exercise round-trip'
        )
        assertEqual(
          reloaded!.environment?.phoneUsedBeforeSleep,
          upsertInput.environment?.phoneUsedBeforeSleep ?? null,
          'phoneUsedBeforeSleep round-trip'
        )
        assertEqual(
          reloaded!.health?.bloodPressure,
          upsertInput.health?.bloodPressure ?? null,
          'bloodPressure round-trip'
        )
        if (
          upsertInput.environment?.roomTemp != null &&
          reloaded!.environment?.roomTemp != null
        ) {
          assertClose(
            reloaded!.environment.roomTemp,
            upsertInput.environment.roomTemp,
            1e-6,
            'roomTemp round-trip'
          )
        }

        await prisma.sleepEntry.deleteMany({ where: { date: importDate } })
      }
    )
  )

  results.push(
    await runTest(
      'Markdown export: ## headings + bullet lists intact for viewers',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 14, `need seeded nights, got ${entries.length}`)

        const md = sleepEntriesToMarkdown(entries)
        assert(md.startsWith('# SleepTracker export'), 'doc title')

        // One ## heading per day (CommonMark ATX heading)
        const headingMatches = md.match(/^## \d{4}-\d{2}-\d{2}$/gm) ?? []
        assertEqual(
          headingMatches.length,
          entries.length,
          '## yyyy-MM-dd heading per night'
        )

        const firstDay = format(entries[0].date, 'yyyy-MM-dd')
        const lastDay = format(entries[entries.length - 1].date, 'yyyy-MM-dd')
        assert(md.includes(`## ${firstDay}`), `heading for ${firstDay}`)
        assert(md.includes(`## ${lastDay}`), `heading for ${lastDay}`)

        // Bullet list markers intact (render as lists in any MD viewer)
        // Format: `- **Label:** value`
        const bulletMatches = md.match(/^- \*\*[^*]+?:\*\* /gm) ?? []
        assert(
          bulletMatches.length >= entries.length * 5,
          `expected many field bullets, got ${bulletMatches.length}`
        )
        assert(md.includes('- **Sleep quality:**'), 'sleep quality bullet')
        assert(md.includes('- **Bed time:**'), 'bed time bullet')

        // Single-entry template
        const one = sleepEntryToMarkdown(entries[0])
        assert(one.startsWith(`## ${firstDay}`), 'single entry heading')
        assert(one.includes('- **Wake time:**'), 'wake bullet')
        if (entries[0].mood) {
          assert(one.includes('- **Mood:**'), 'mood bullet')
        }

        const viaService = await exportService.exportMarkdown()
        assertEqual(
          (viaService.match(/^## \d{4}-\d{2}-\d{2}$/gm) ?? []).length,
          entries.length,
          'service markdown heading count'
        )

        // Empty export still valid Markdown
        const empty = sleepEntriesToMarkdown([])
        assert(empty.includes('# SleepTracker export'), 'empty title')
        assert(empty.includes('_No sleep entries._'), 'empty note')
        assertEqual(
          (empty.match(/^## /gm) ?? []).length,
          0,
          'no day headings when empty'
        )
      }
    )
  )

  results.push(
    await runTest(
      'PDF monthly report: valid PDF with month, stats, chart image',
      async () => {
        const entries = await sleepEntryRepository.findAll()
        assert(entries.length >= 14, `need seeded nights, got ${entries.length}`)

        const counts = new Map<string, number>()
        for (const e of entries) {
          const key = entryMonthKey(e.date)
          counts.set(key, (counts.get(key) ?? 0) + 1)
        }
        let month = ''
        let maxCount = 0
        for (const [key, n] of counts) {
          if (n > maxCount) {
            maxCount = n
            month = key
          }
        }
        assert(month !== '', 'pick a month')

        const series = buildQualitySeriesForMonth(entries, month)
        assert(series.length > 0, 'quality series for chart')

        const png = buildQualityChartPng(series)
        assert(png[0] === 0x89 && png[1] === 0x50 && png[2] === 0x4e, 'PNG signature')
        assert(png.length > 200, 'PNG has payload')

        const { buffer, filename } = await renderMonthlyReportPdf(entries, {
          month,
        })
        assertEqual(filename, `sleeptracker-${month}.pdf`, 'render filename')
        assert(buffer.length > 1000, `PDF size ${buffer.length}`)
        assertEqual(buffer.subarray(0, 5).toString('utf8'), '%PDF-', 'PDF magic')

        const asLatin = buffer.toString('latin1')
        assert(asLatin.includes('SleepTracker'), 'brand in PDF')
        assert(asLatin.includes(month), `PDF mentions month ${month}`)
        assert(
          asLatin.includes('Avg quality') || asLatin.includes('quality'),
          'stats present in PDF metadata/subject (readable, not clipped)'
        )
        assert(
          asLatin.includes('nights') || asLatin.includes(String(maxCount)),
          'entry count context present'
        )
        assert(
          asLatin.includes('/Image') || asLatin.includes('Image'),
          'PDF has Image XObject for chart'
        )
        assert(asLatin.includes('Width 520'), 'chart image width')
        assert(asLatin.includes('Height 160'), 'chart image height')
        assert(asLatin.includes('DeviceRGB'), 'chart RGB image')

        // Service uses Step 108 sleep-export-YYYY-MM.pdf naming
        const viaService = await exportService.exportPdf(month)
        assertEqual(
          viaService.filename,
          `sleep-export-${month}.pdf`,
          'service filename'
        )
        assertEqual(
          viaService.buffer.subarray(0, 5).toString('utf8'),
          '%PDF-',
          'service PDF magic'
        )
        assertEqual(viaService.month, month, 'service month')
      }
    )
  )

  return results.every(Boolean)
}
