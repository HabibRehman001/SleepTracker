/**
 * Step 107 — Assemble monthly report data + render PDF buffer.
 */

import { format, parse } from 'date-fns'
import React from 'react'
import { renderToBuffer } from '@react-pdf/renderer'

import {
  buildMonthOverMonthCompare,
  buildMonthlyReport,
  entryMonthKey,
  toMonthlyReportSummary,
} from '../monthlyReport'
import type { SleepEntryWithRelations } from '../../types'
import { MonthlyReportPdfDocument } from './MonthlyReportPdf'
import {
  buildQualityChartPng,
  type QualityChartPoint,
} from './qualityChartPng'

export type PdfExportOptions = {
  /** `yyyy-MM`; defaults to current calendar month. */
  month?: string
  now?: Date
}

function monthLabel(month: string): string {
  const d = parse(`${month}-01`, 'yyyy-MM-dd', new Date())
  return format(d, 'MMMM yyyy')
}

export function buildQualitySeriesForMonth(
  entries: SleepEntryWithRelations[],
  month: string
): QualityChartPoint[] {
  return entries
    .filter((e) => entryMonthKey(e.date) === month)
    .filter((e) => e.sleepQuality != null && Number.isFinite(e.sleepQuality))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .map((e) => ({
      date: format(e.date, 'yyyy-MM-dd'),
      quality: e.sleepQuality as number,
    }))
}

/**
 * Render a one-page monthly PDF (stats + quality chart image + insights).
 */
export async function renderMonthlyReportPdf(
  entries: SleepEntryWithRelations[],
  options: PdfExportOptions = {}
): Promise<{ buffer: Buffer; month: string; filename: string }> {
  const now = options.now ?? new Date()
  const month = options.month ?? format(now, 'yyyy-MM')
  const compare = buildMonthOverMonthCompare(entries, month, now)
  const report = toMonthlyReportSummary(buildMonthlyReport(entries, month))
  const series = buildQualitySeriesForMonth(entries, month)
  const chartPng = buildQualityChartPng(
    series.length > 0
      ? series
      : [{ date: `${month}-01`, quality: 0 }]
  )

  const element = React.createElement(MonthlyReportPdfDocument, {
    month,
    monthLabel: monthLabel(month),
    summary: report,
    previous: compare.previous,
    metrics: compare.metrics,
    chartPng,
    insights: report.insights,
  })

  const buffer = await renderToBuffer(element)
  return {
    buffer: Buffer.from(buffer),
    month,
    filename: `sleeptracker-${month}.pdf`,
  }
}
