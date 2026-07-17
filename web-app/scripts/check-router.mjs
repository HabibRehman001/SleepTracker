/**
 * Step 47 — React Router contract: sidebar NavLinks + declared routes, SPA (no full reload).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const app = readFileSync(join(root, 'src/App.tsx'), 'utf8')
const shell = readFileSync(join(root, 'src/components/layout/AppShell.tsx'), 'utf8')
const main = readFileSync(join(root, 'src/main.tsx'), 'utf8')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

assert.ok(pkg.dependencies['react-router'], 'react-router installed')
assert.match(main, /BrowserRouter/)
assert.match(shell, /NavLink/)
assert.match(shell, /Outlet/)
assert.match(shell, /path: '\/'/)
assert.match(shell, /path: '\/log'/)
assert.match(shell, /path: '\/analytics'/)
assert.match(shell, /path: '\/experiments'/)
assert.match(shell, /path: '\/reports'/)

for (const route of ['index', 'log', 'analytics', 'experiments', 'reports']) {
  if (route === 'index') {
    assert.match(app, /<Route index/)
  } else {
    assert.match(app, new RegExp(`path="${route}"`))
  }
}

assert.doesNotMatch(shell, /window\.location\.href/, 'no hard navigations')
assert.doesNotMatch(shell, /<a href=/, 'use NavLink/Link, not raw anchors')

console.log('React Router contract OK (/, /log, /analytics, /experiments, /reports)')
