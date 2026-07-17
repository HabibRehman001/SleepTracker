/**
 * Step 131 — LAN-only bind + private IP gate contract.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  isPrivateOrLocalIp,
  normalizeIp,
} from '../src/utils/network.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const serverSrc = readFileSync(join(root, 'src/server.ts'), 'utf8')
const appSrc = readFileSync(join(root, 'src/app.ts'), 'utf8')
const envExample = readFileSync(join(root, '.env.example'), 'utf8')

assert.match(serverSrc, /HOST/)
assert.match(serverSrc, /0\.0\.0\.0/)
assert.match(serverSrc, /listLanIPv4|LAN:/)
assert.match(appSrc, /lanOnlyMiddleware/)
assert.match(appSrc, /trust proxy/)
assert.match(envExample, /HOST=/)
assert.match(envExample, /ALLOW_PUBLIC=/)

assert.equal(normalizeIp('::ffff:192.168.1.10'), '192.168.1.10')

const privateOk = [
  '127.0.0.1',
  '::1',
  '10.0.0.5',
  '192.168.18.242',
  '172.16.0.1',
  '172.31.255.1',
  '169.254.1.1',
  '::ffff:192.168.0.2',
  'fe80::1',
  'fd12:3456:789a::1',
]
for (const ip of privateOk) {
  assert.equal(isPrivateOrLocalIp(ip), true, `expected private: ${ip}`)
}

const publicNo = [
  '8.8.8.8',
  '1.1.1.1',
  '203.0.113.10',
  '172.15.0.1',
  '172.32.0.1',
  '11.0.0.1',
]
for (const ip of publicNo) {
  assert.equal(isPrivateOrLocalIp(ip), false, `expected public: ${ip}`)
}

console.log('LAN-only contract OK — private IP gate + HOST bind')
