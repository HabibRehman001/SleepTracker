/**
 * Step 115 — Expo custom development build (not Expo Go) is the locked tooling.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const app = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))

assert.ok(pkg.dependencies.expo, 'expo present')
assert.ok(pkg.dependencies['expo-dev-client'], 'expo-dev-client (not Expo Go)')
assert.match(pkg.scripts.android, /expo run:android/)
assert.match(pkg.scripts.ios, /expo run:ios/)
assert.match(pkg.scripts.start, /dev-client/)
assert.equal(pkg.main, 'expo-router/entry')

assert.equal(app.expo.slug, 'sleep-lock-app')
assert.ok(pkg.name === 'mobile-app' || pkg.name === 'sleep-lock-app')
assert.ok(app.expo.android?.package, 'android package for native build')
assert.ok(app.expo.ios?.bundleIdentifier, 'ios bundle id for native build')
assert.ok(
  (app.expo.plugins ?? []).includes('expo-dev-client'),
  'expo-dev-client plugin'
)
assert.ok(
  (app.expo.plugins ?? []).includes('expo-router'),
  'expo-router plugin'
)

assert.ok(existsSync(join(root, 'app/index.tsx')))
assert.ok(existsSync(join(root, 'tsconfig.json')))

console.log('Expo tooling contract OK — custom development build (not Expo Go)')
