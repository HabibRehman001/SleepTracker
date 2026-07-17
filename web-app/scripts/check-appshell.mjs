/**
 * Step 46 — responsive shell contract (no browser needed).
 * Desktop sidebar uses Tailwind md: (≥768px); mobile uses Sheet + hamburger.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shell = readFileSync(join(root, 'src/components/layout/AppShell.tsx'), 'utf8')

assert.match(shell, /hidden w-56[\s\S]*md:flex/, 'desktop sidebar hidden below md')
assert.match(shell, /md:hidden/, 'mobile header hidden at md+')
assert.match(shell, /SheetContent/, 'mobile nav uses shadcn Sheet')
assert.match(shell, /min-width: 768px/, 'closes sheet when crossing 768px')
assert.match(shell, /Dashboard/)
assert.match(shell, /Log Entry/)
assert.match(shell, /Analytics/)
assert.match(shell, /Experiments/)
assert.match(shell, /Reports/)
assert.match(shell, /Settings/)
assert.match(shell, /mobile-nav-trigger/)
assert.match(shell, /desktop-sidebar/)

console.log('AppShell responsive contract OK (collapse <768px → hamburger + Sheet)')
