/**
 * Step 140 — permissions status checklist contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  classifyLocationRow,
  classifyMotionRow,
  toneGlyph,
} from '../services/permissionStatusPhase.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const screen = readFileSync(join(root, 'app/permissions-status.tsx'), 'utf8')
const row = readFileSync(
  join(root, 'components/permissions/PermissionStatusRow.tsx'),
  'utf8'
)
const service = readFileSync(
  join(root, 'services/permissionsStatus.ts'),
  'utf8'
)
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const index = readFileSync(join(root, 'app/index.tsx'), 'utf8')

assert.ok(existsSync(join(root, 'app/permissions-status.tsx')))
assert.match(screen, /loadPermissionsStatus/)
assert.match(screen, /testID=["']permissions-status-screen["']/)
assert.match(screen, /PermissionStatusRow/)
assert.match(row, /toneGlyph/)
assert.match(row, /testID=\{`permission-row-\$\{row\.id\}`\}|permission-row/)
assert.match(service, /Location|Motion|Device Owner|Notifications/)
assert.match(service, /isDeviceOwner|loadPermissionsStatus/)
assert.match(layout, /permissions-status/)
assert.match(index, /permissions-status/)

assert.equal(toneGlyph('ok'), '✅')
assert.equal(toneGlyph('warn'), '⚠️')
assert.equal(toneGlyph('denied'), '❌')

const always = classifyLocationRow('granted', 'granted')
assert.equal(always.detail, 'Always')
assert.equal(always.tone, 'ok')

const whileUsing = classifyLocationRow('granted', 'denied')
assert.equal(whileUsing.detail, 'While Using')
assert.equal(whileUsing.tone, 'warn')

const motionOk = classifyMotionRow('granted')
assert.equal(motionOk.tone, 'ok')

console.log('Permissions status contract OK — Settings-style ✅/⚠️/❌ checklist')
