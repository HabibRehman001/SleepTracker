/**
 * Step 108 — Export download helpers (blob: URL + temporary <a>).
 */

export type ExportFormat = 'csv' | 'json' | 'md' | 'pdf' | 'xlsx'

export const EXPORT_API_BASE = 'http://localhost:4000/api/export'

/** e.g. sleep-export-2026-07.csv */
export function buildExportFilename(
  format: ExportFormat,
  month: string
): string {
  const ext = format === 'md' ? 'md' : format
  return `sleep-export-${month}.${ext}`
}

export function exportApiPath(format: ExportFormat, month: string): string {
  const qs = `?month=${encodeURIComponent(month)}`
  switch (format) {
    case 'csv':
      return `${EXPORT_API_BASE}/csv${qs}`
    case 'json':
      return `${EXPORT_API_BASE}/json${qs}`
    case 'md':
      return `${EXPORT_API_BASE}/markdown${qs}`
    case 'pdf':
      return `${EXPORT_API_BASE}/pdf${qs}`
    case 'xlsx':
      return `${EXPORT_API_BASE}/xlsx${qs}`
  }
}

/**
 * Trigger a browser file download via a temporary anchor + blob: URL.
 * Returns the filename used for `download=`.
 */
export function downloadBlobViaAnchor(
  blob: Blob,
  filename: string,
  doc: Document = document
): string {
  const objectUrl = URL.createObjectURL(blob)
  const a = doc.createElement('a')
  a.href = objectUrl
  a.download = filename
  a.rel = 'noopener'
  a.style.display = 'none'
  doc.body.appendChild(a)
  a.click()
  a.remove()
  // Revoke on next tick so the browser can start the download.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 0)
  return filename
}

/** Fetch an export endpoint and save it as sleep-export-YYYY-MM.ext */
export async function downloadExportFile(
  format: ExportFormat,
  month: string,
  fetchImpl: typeof fetch = fetch,
  doc: Document = document
): Promise<string> {
  let res: Response
  try {
    res = await fetchImpl(exportApiPath(format, month))
  } catch {
    throw new Error('Cannot reach the server — is the backend running?')
  }
  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`)
  }
  const blob = await res.blob()
  const filename = buildExportFilename(format, month)
  return downloadBlobViaAnchor(blob, filename, doc)
}
