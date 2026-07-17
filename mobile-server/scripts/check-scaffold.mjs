/**
 * Step 125 — mobile-server is a separate Express/Mongo service on :4001.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const server = readFileSync(join(root, 'src/server.ts'), 'utf8')
const app = readFileSync(join(root, 'src/app.ts'), 'utf8')
const envExample = readFileSync(join(root, '.env.example'), 'utf8')

assert.ok(pkg.dependencies.express)
assert.ok(pkg.dependencies.mongoose)
assert.ok(pkg.dependencies.cors)
assert.ok(pkg.dependencies.dotenv)
assert.match(server, /4001|PORT/)
assert.match(server, /mongoose\.connect/)
assert.match(app, /\/api\/health/)
assert.match(envExample, /4001/)
assert.match(envExample, /MONGODB_URI/)
assert.ok(existsSync(join(root, 'tsconfig.json')))

console.log('mobile-server scaffold contract OK — Express/Mongo on :4001')
