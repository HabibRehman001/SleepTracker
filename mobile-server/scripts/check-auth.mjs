/**
 * Auth signup/login/me contract (mobile-server).
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const app = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/auth.routes.ts'), 'utf8')
const service = readFileSync(join(root, 'src/services/auth.service.ts'), 'utf8')
const model = readFileSync(join(root, 'src/models/User.ts'), 'utf8')
const envExample = readFileSync(join(root, '.env.example'), 'utf8')

assert.ok(pkg.dependencies.bcryptjs, 'bcryptjs')
assert.ok(pkg.dependencies.jsonwebtoken, 'jsonwebtoken')
assert.ok(existsSync(join(root, 'src/models/User.ts')))
assert.match(model, /passwordHash/)
assert.match(model, /email/)
assert.match(service, /signup|login|signToken/)
assert.match(routes, /\/signup/)
assert.match(routes, /\/login/)
assert.match(routes, /\/me/)
assert.match(app, /authRoutes|\/auth/)
assert.match(envExample, /JWT_SECRET/)

console.log('Auth contract OK — User model + signup/login/me')
