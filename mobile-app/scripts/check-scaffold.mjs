/**
 * Step 118 — Expo Router scaffold folders: app/, native/, services/, store/.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))

assert.equal(pkg.main, 'expo-router/entry')
assert.ok(pkg.dependencies['expo-router'], 'expo-router installed')
assert.ok(
  (appJson.expo.plugins ?? []).includes('expo-router'),
  'expo-router plugin'
)

for (const rel of [
  'app/_layout.tsx',
  'app/index.tsx',
  'app/onboarding.tsx',
  'native/index.ts',
  'native/mockSleepLock.ts',
  'native/getSleepLockModule.ts',
  'services/lockService.ts',
  'services/index.ts',
  'store/lockStore.ts',
  'store/index.ts',
]) {
  assert.ok(existsSync(join(root, rel)), `missing ${rel}`)
}

assert.ok(!existsSync(join(root, 'App.tsx')), 'legacy App.tsx removed')
assert.ok(!existsSync(join(root, 'index.ts')), 'legacy index.ts removed')
assert.ok(!existsSync(join(root, 'nativeLock')), 'nativeLock/ migrated to native/')

console.log('Expo scaffold contract OK — app/ native/ services/ store/')
