/**
 * Step 112 — Playwright e2e smoke is wired.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const cfg = readFileSync(join(root, 'playwright.config.ts'), 'utf8')
const smoke = readFileSync(join(root, 'e2e/smoke.spec.ts'), 'utf8')

assert.ok(
  pkg.devDependencies['@playwright/test'] || pkg.devDependencies.playwright,
  'playwright installed'
)
assert.match(pkg.scripts['test:e2e'] ?? '', /playwright test/)
assert.match(cfg, /headless:\s*true/)
assert.match(cfg, /webServer/)
assert.ok(existsSync(join(root, 'e2e/smoke.spec.ts')))

assert.match(smoke, /save entry/i)
assert.match(smoke, /today-notes/)
assert.match(smoke, /analytics-page/)
assert.match(smoke, /analytics-charts|sleep-duration-chart/)

console.log('Playwright e2e smoke contract OK')
