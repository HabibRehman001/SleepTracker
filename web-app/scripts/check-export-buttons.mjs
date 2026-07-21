/**
 * Step 108 — Export buttons: blob download + sleep-export-YYYY-MM.* filenames.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import {
  buildExportFilename,
  downloadBlobViaAnchor,
  downloadExportFile,
  exportApiPath,
} from '../src/features/reports/exportDownload.ts'
import { ExportPanel } from '../src/features/reports/ExportPanel.tsx'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const page = readFileSync(
  join(root, 'src/features/reports/ReportsPage.tsx'),
  'utf8'
)
const panel = readFileSync(
  join(root, 'src/features/reports/ExportPanel.tsx'),
  'utf8'
)
const helpers = readFileSync(
  join(root, 'src/features/reports/exportDownload.ts'),
  'utf8'
)

assert.match(page, /ExportPanel/)
assert.match(panel, /export-panel/)
assert.match(panel, /export-month-selector/)
assert.match(panel, /export-btn-\$\{format\}/)
assert.match(panel, /format: 'csv'/)
assert.match(panel, /format: 'json'/)
assert.match(panel, /format: 'md'/)
assert.match(panel, /format: 'pdf'/)
assert.match(panel, /format: 'xlsx'|Excel/)
assert.match(helpers, /createObjectURL/)
assert.match(helpers, /createElement\('a'\)/)
assert.match(helpers, /sleep-export-/)

assert.equal(buildExportFilename('csv', '2026-07'), 'sleep-export-2026-07.csv')
assert.equal(buildExportFilename('json', '2026-07'), 'sleep-export-2026-07.json')
assert.equal(buildExportFilename('md', '2026-07'), 'sleep-export-2026-07.md')
assert.equal(buildExportFilename('pdf', '2026-07'), 'sleep-export-2026-07.pdf')
assert.equal(buildExportFilename('xlsx', '2026-07'), 'sleep-export-2026-07.xlsx')

assert.equal(
  exportApiPath('csv', '2026-07'),
  'http://localhost:4000/api/export/csv?month=2026-07'
)
assert.equal(
  exportApiPath('xlsx', '2026-07'),
  'http://localhost:4000/api/export/xlsx?month=2026-07'
)

// Simulate temporary <a> + blob: URL download for each format.
const clicked = []
const fakeDoc = {
  body: {
    appendChild(node) {
      this._last = node
    },
  },
  createElement(tag) {
    assert.equal(tag, 'a')
    const el = {
      href: '',
      download: '',
      rel: '',
      style: {},
      click() {
        clicked.push({ href: this.href, download: this.download })
      },
      remove() {},
    }
    return el
  },
}

const blob = new Blob(['id,date\n'], { type: 'text/csv' })
const name = downloadBlobViaAnchor(blob, 'sleep-export-2026-07.csv', fakeDoc)
assert.equal(name, 'sleep-export-2026-07.csv')
assert.equal(clicked.length, 1)
assert.equal(clicked[0].download, 'sleep-export-2026-07.csv')
assert.match(clicked[0].href, /^blob:/)

const formats = ['csv', 'json', 'md', 'pdf', 'xlsx']
for (const format of formats) {
  clicked.length = 0
  const filename = await downloadExportFile(
    format,
    '2026-07',
    async () =>
      new Response(new Blob(['ok']), {
        status: 200,
        headers: { 'Content-Type': 'application/octet-stream' },
      }),
    fakeDoc
  )
  assert.equal(filename, buildExportFilename(format, '2026-07'))
  assert.equal(clicked[0].download, filename)
  assert.match(clicked[0].href, /^blob:/)
}

const html = renderToStaticMarkup(
  createElement(ExportPanel, { defaultMonth: '2026-07' })
)
assert.match(html, /export-panel/)
assert.match(html, /export-month-selector/)
assert.match(html, /export-btn-csv/)
assert.match(html, /export-btn-json/)
assert.match(html, /export-btn-md/)
assert.match(html, /export-btn-pdf/)
assert.match(html, /export-btn-xlsx/)
assert.match(html, /Excel/)
assert.match(html, /sleep-export-2026-07\.csv/)
assert.match(html, /sleep-export-2026-07\.pdf/)
assert.match(html, /sleep-export-2026-07\.xlsx/)

console.log('Export buttons contract OK (blob downloads + sleep-export-YYYY-MM.*)')
