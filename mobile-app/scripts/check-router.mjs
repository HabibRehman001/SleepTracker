/**
 * Step 119 — Expo Router file-based routes navigate (index ↔ onboarding).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const onboarding = readFileSync(join(root, 'app/onboarding.tsx'), 'utf8')

assert.ok(pkg.dependencies['expo-router'], 'expo-router installed')
assert.equal(pkg.main, 'expo-router/entry')
assert.ok((appJson.expo.plugins ?? []).includes('expo-router'))

assert.ok(existsSync(join(root, 'app/index.tsx')))
assert.ok(existsSync(join(root, 'app/onboarding.tsx')))

assert.match(layout, /name=["']index["']/)
assert.match(layout, /name=["']onboarding["']/)

assert.match(home, /from ['"]expo-router['"]/)
assert.match(home, /href=["']\/onboarding["']/)
assert.match(home, /testID=["']open-onboarding["']/)
assert.match(home, /testID=["']home-screen["']/)

assert.match(onboarding, /from ['"]expo-router['"]/)
assert.match(
  onboarding,
  /router\.(replace|push)\(['"]\/(location-permission)?['"]\)|href=["']\/["']/
)
assert.match(onboarding, /OnboardingPager|testID=["']onboarding-screen["']/)
assert.match(
  readFileSync(join(root, 'components/onboarding/OnboardingPager.tsx'), 'utf8'),
  /onboarding-done/
)
assert.match(layout, /location-permission/)

console.log('Expo Router navigation contract OK — index ↔ onboarding')
