/**
 * Step 111 — vitest + Testing Library component suite is wired.
 */
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const vitestCfg = readFileSync(join(root, 'vitest.config.ts'), 'utf8')

assert.ok(pkg.devDependencies.vitest, 'vitest installed')
assert.ok(
  pkg.devDependencies['@testing-library/react'],
  '@testing-library/react installed'
)
assert.match(pkg.scripts.test, /vitest run/)
assert.match(vitestCfg, /environment:\s*['"]jsdom['"]/)

for (const rel of [
  'src/features/sleep-entry/SleepEntryForm.test.tsx',
  'src/features/dashboard/CorrelationCard.test.tsx',
  'src/features/dashboard/DashboardPage.test.tsx',
  'src/test/setup.ts',
]) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
}

const formTest = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.test.tsx'),
  'utf8'
)
const cardTest = readFileSync(
  join(root, 'src/features/dashboard/CorrelationCard.test.tsx'),
  'utf8'
)
const dashTest = readFileSync(
  join(root, 'src/features/dashboard/DashboardPage.test.tsx'),
  'utf8'
)

assert.match(formTest, /force-invalid-quality|Must be at least 1|Required/)
assert.match(cardTest, /correlation-group-A/)
assert.match(cardTest, /correlation-group-B/)
assert.match(cardTest, /not enough data/)
assert.match(dashTest, /setQueryData/)
assert.match(dashTest, /DashboardPage/)

console.log('Component tests contract OK (vitest + RTL critical UI)')
