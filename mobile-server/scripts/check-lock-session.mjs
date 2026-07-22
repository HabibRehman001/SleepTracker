/**
 * Account-wide lock-session API contract.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const routes = readFileSync(join(root, 'src/routes/lockSession.routes.ts'), 'utf8')
const service = readFileSync(
  join(root, 'src/services/lockSession.service.ts'),
  'utf8'
)
const model = readFileSync(join(root, 'src/models/LockSession.ts'), 'utf8')

assert.match(appSrc, /lock-session/)
assert.match(routes, /requireAuth/)
assert.match(routes, /getLockSession|upsertLockSession/)
assert.match(service, /isEffectivelyLocked|unlockAt/)
assert.match(model, /userId|locked/)

const base = process.env.MOBILE_API_URL ?? 'http://127.0.0.1:4001'

async function signupOrLogin() {
  const email = `locksession_${Date.now()}@test.local`
  const password = 'demo1234'
  let res = await fetch(`${base}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name: 'Lock Session' }),
  })
  if (!(res.status === 200 || res.status === 201)) {
    res = await fetch(`${base}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
  }
  const text = await res.text()
  assert.ok(res.status === 200 || res.status === 201, text)
  const body = JSON.parse(text)
  assert.ok(body.token)
  return body.token
}

const token = await signupOrLogin()
const headers = {
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
}

const getEmpty = await fetch(`${base}/lock-session`, { headers })
assert.equal(getEmpty.status, 200)
const emptyBody = await getEmpty.json()
assert.equal(emptyBody.session, null)

const unlockAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
const put = await fetch(`${base}/lock-session`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ locked: true, unlockAt }),
})
const putText = await put.text()
assert.equal(put.status, 200, putText)
const putBody = JSON.parse(putText)
assert.equal(putBody.session.locked, true)
assert.ok(putBody.session.unlockAt)

const getLocked = await fetch(`${base}/lock-session`, { headers })
assert.equal(getLocked.status, 200)
const lockedBody = await getLocked.json()
assert.equal(lockedBody.session.locked, true)

const unlock = await fetch(`${base}/lock-session`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ locked: false }),
})
const unlockText = await unlock.text()
assert.equal(unlock.status, 200, unlockText)
const unlockBody = JSON.parse(unlockText)
assert.equal(unlockBody.session.locked, false)

const noAuth = await fetch(`${base}/lock-session`)
assert.equal(noAuth.status, 401)

console.log('Lock session API contract OK — account-wide sleep lock')
