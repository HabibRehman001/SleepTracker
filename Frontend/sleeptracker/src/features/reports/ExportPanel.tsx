import { format } from 'date-fns'
import { toast } from 'sonner'
import * as React from 'react'

import { Button } from '@/components/ui/button'
import {
  buildExportFilename,
  downloadExportFile,
  type ExportFormat,
} from '@/features/reports/exportDownload'
import { mutationErrorMessage } from '@/lib/mutationToast'
import { cn } from '@/lib/utils'

const FORMATS: { format: ExportFormat; label: string }[] = [
  { format: 'csv', label: 'CSV' },
  { format: 'json', label: 'JSON' },
  { format: 'md', label: 'Markdown' },
  { format: 'pdf', label: 'PDF' },
]

export type ExportPanelProps = {
  /** Initial month `yyyy-MM` (defaults to current). */
  defaultMonth?: string
  className?: string
}

/**
 * Step 108 — date-range (month) selector + four export buttons (blob download).
 */
export function ExportPanel({ defaultMonth, className }: ExportPanelProps) {
  const [month, setMonth] = React.useState(
    () => defaultMonth ?? format(new Date(), 'yyyy-MM')
  )
  const [pending, setPending] = React.useState<ExportFormat | null>(null)

  React.useEffect(() => {
    if (defaultMonth) setMonth(defaultMonth)
  }, [defaultMonth])

  const onExport = async (format: ExportFormat) => {
    setPending(format)
    try {
      const filename = await downloadExportFile(format, month)
      toast.success(`Downloaded ${filename}`)
    } catch (err) {
      toast.error(
        mutationErrorMessage(
          err,
          `Could not download ${buildExportFilename(format, month)}`
        )
      )
    } finally {
      setPending(null)
    }
  }

  return (
    <section
      className={cn('space-y-3', className)}
      data-testid="export-panel"
    >
      <div>
        <h2 className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
          Export
        </h2>
        <p className="text-muted-foreground mt-1 text-sm">
          Pick a month, then download CSV, JSON, Markdown, or PDF.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="text-muted-foreground text-xs font-medium">
            Date range (month)
          </span>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border-input bg-background h-8 rounded-md border px-2 text-sm shadow-xs"
            data-testid="export-month-selector"
            aria-label="Export month"
          />
        </label>

        <div
          className="flex flex-wrap gap-2"
          data-testid="export-buttons"
          role="group"
          aria-label="Export formats"
        >
          {FORMATS.map(({ format, label }) => (
            <Button
              key={format}
              type="button"
              variant="outline"
              size="sm"
              disabled={pending != null || !/^\d{4}-\d{2}$/.test(month)}
              data-testid={`export-btn-${format}`}
              data-filename={buildExportFilename(format, month)}
              onClick={() => void onExport(format)}
            >
              {pending === format ? 'Downloading…' : label}
            </Button>
          ))}
        </div>
      </div>
    </section>
  )
}
