/**
 * Step 122 — mobile dark tokens match web-app `.dark` (#0a0a0a background).
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { darkTokens } from '../theme/tokens.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const webCss = readFileSync(
  join(root, '../web-app/src/index.css'),
  'utf8'
)
const tw = readFileSync(join(root, 'tailwind.config.js'), 'utf8')
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const onboarding = readFileSync(join(root, 'app/onboarding.tsx'), 'utf8')
const appJson = JSON.parse(readFileSync(join(root, 'app.json'), 'utf8'))
const cjs = readFileSync(join(root, 'theme/tokens.cjs'), 'utf8')

assert.match(webCss, /\.dark\s*\{[\s\S]*--background:\s*#0a0a0a/)
assert.equal(darkTokens.background, '#0a0a0a')
assert.equal(darkTokens.foreground, '#fafafa')
assert.match(cjs, /background:\s*'#0a0a0a'/)

assert.match(tw, /darkTokens/)
assert.match(tw, /background:\s*darkTokens\.background/)
assert.equal(appJson.expo.userInterfaceStyle, 'dark')

assert.match(home, /bg-background/)
assert.match(home, /text-foreground/)
assert.match(home, /text-muted-foreground/)
assert.match(home, /bg-primary/)
assert.match(onboarding, /bg-background/)
assert.match(onboarding, /text-foreground/)

console.log('Dark theme contract OK — tokens match web-app #0a0a0a')
