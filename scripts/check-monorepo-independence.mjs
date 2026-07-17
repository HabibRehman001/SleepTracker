/**
 * Step 117 — web-app and mobile-app install/run independently (no workspace root).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = join(dirname(fileURLToPath(import.meta.url)), '..')
const webPkg = join(repo, 'web-app/package.json')
const mobilePkg = join(repo, 'mobile-app/package.json')
const rootPkg = join(repo, 'package.json')

assert.ok(existsSync(webPkg), 'web-app/package.json')
assert.ok(existsSync(mobilePkg), 'mobile-app/package.json')
assert.ok(!existsSync(rootPkg), 'no root package.json workspace (apps stay independent)')

const web = JSON.parse(readFileSync(webPkg, 'utf8'))
const mobile = JSON.parse(readFileSync(mobilePkg, 'utf8'))

assert.ok(web.scripts?.dev || web.scripts?.start, 'web-app has run script')
assert.ok(mobile.scripts?.start || mobile.scripts?.android, 'mobile-app has run script')
assert.ok(existsSync(join(repo, 'web-app/node_modules')), 'web-app npm install present')
assert.ok(existsSync(join(repo, 'mobile-app/node_modules')), 'mobile-app npm install present')
assert.ok(existsSync(join(repo, 'MONOREPO.md')), 'MONOREPO.md documents decision')

console.log('Monorepo independence contract OK — web-app + mobile-app separate')
