/**
 * Step 116/118 — mock SleepLockModule under native/ (no platform APIs).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createMockSleepLock } from '../native/mockSleepLock.ts'
import { getSleepLockModule } from '../native/getSleepLockModule.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const indexSrc = readFileSync(join(root, 'native/index.ts'), 'utf8')

assert.match(indexSrc, /export interface SleepLockModule/)
assert.match(indexSrc, /enableLock\(\):\s*Promise<void>/)
assert.match(indexSrc, /disableLock\(\):\s*Promise<void>/)
assert.match(indexSrc, /isLocked\(\):\s*Promise<boolean>/)

const lock = createMockSleepLock(false)
assert.equal(await lock.isLocked(), false)
await lock.enableLock()
assert.equal(await lock.isLocked(), true)
await lock.disableLock()
assert.equal(await lock.isLocked(), false)

const viaFactory = getSleepLockModule('mock')
await viaFactory.enableLock()
assert.equal(await viaFactory.isLocked(), true)

assert.throws(() => getSleepLockModule('android'), /not implemented yet/)
assert.throws(() => getSleepLockModule('ios'), /not implemented yet/)

console.log('native/ mock contract OK — shared interface, no native code')
