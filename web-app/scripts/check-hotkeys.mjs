/**
 * Step 49 — keyboard shortcut contract (g>d, g>l, n) + React Router navigation.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const hotkeys = readFileSync(join(root, 'src/hooks/useAppHotkeys.ts'), 'utf8')
const shell = readFileSync(join(root, 'src/components/layout/AppShell.tsx'), 'utf8')

assert.ok(pkg.dependencies['react-hotkeys-hook'], 'react-hotkeys-hook installed')
assert.match(hotkeys, /useHotkeys/)
assert.match(hotkeys, /['"]g>d['"]/, 'g then d → dashboard')
assert.match(hotkeys, /['"]g>l['"]/, 'g then l → log')
assert.match(hotkeys, /useHotkeys\(\s*['"]n['"]/, 'n → new entry today')
assert.match(hotkeys, /navigate\(\s*['"]\/['"]\s*\)/)
assert.match(hotkeys, /navigate\(\s*['"]\/log['"]\s*\)/)
assert.match(hotkeys, /setSelectedDate/)
assert.match(shell, /useAppHotkeys\(\)/, 'mounted in AppShell (app-wide)')

console.log('Keyboard shortcuts contract OK (g>d dashboard, g>l log, n today)')
