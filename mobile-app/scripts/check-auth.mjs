/**
 * Mobile auth screen + store contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const screen = readFileSync(join(root, 'app/auth.tsx'), 'utf8')
const store = readFileSync(join(root, 'store/authStore.ts'), 'utf8')
const api = readFileSync(join(root, 'services/api.ts'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')

assert.ok(pkg.dependencies['expo-secure-store'], 'expo-secure-store')
assert.ok(existsSync(join(root, 'app/auth.tsx')))
assert.match(screen, /testID=["']auth-screen["']/)
assert.match(screen, /Create account|signup/)
assert.match(screen, /hydrate\(|auth-hydrating/)
assert.match(screen, /Redirect|token/)
assert.match(store, /signup|login|hydrate/)
assert.match(store, /setAuthTokenGetter/)
assert.match(api, /setAuthTokenGetter/)
assert.match(layout, /name=["']auth["']/)
assert.match(layout, /hydrate/)
assert.match(index, /useAuthStore|\/auth/)
assert.match(index, /syncAccountLockFromServer|lock-session/)

console.log('Mobile auth contract OK — account gate + secure token')
