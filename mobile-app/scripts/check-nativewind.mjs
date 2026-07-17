/**
 * Step 121 — NativeWind configured; screens use Tailwind className.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const babel = readFileSync(join(root, 'babel.config.js'), 'utf8')
const metro = readFileSync(join(root, 'metro.config.js'), 'utf8')
const tw = readFileSync(join(root, 'tailwind.config.js'), 'utf8')

assert.ok(pkg.dependencies.nativewind, 'nativewind')
assert.ok(pkg.dependencies.tailwindcss, 'tailwindcss')
assert.ok(existsSync(join(root, 'global.css')))
assert.ok(existsSync(join(root, 'nativewind-env.d.ts')))

assert.match(tw, /nativewind\/preset/)
assert.match(babel, /nativewind\/babel/)
assert.match(metro, /withNativeWind/)
assert.match(layout, /global\.css/)

assert.match(home, /className=/)
assert.match(home, /bg-background|bg-black/)
assert.match(home, /text-foreground|text-white/)
assert.match(home, /<View[\s\S]*className=/)
assert.match(home, /<Text[\s\S]*className=/)

console.log('NativeWind contract OK — className styling wired')
