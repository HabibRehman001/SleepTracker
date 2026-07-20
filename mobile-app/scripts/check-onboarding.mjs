/**
 * Step 133 — swipeable welcome / onboarding flow contract.
 */
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const onboarding = readFileSync(join(root, 'app/onboarding.tsx'), 'utf8')
const home = readFileSync(join(root, 'app/index.tsx'), 'utf8')
const layout = readFileSync(join(root, 'app/_layout.tsx'), 'utf8')
const slidesPath = join(root, 'components/onboarding/slides.ts')
const pagerPath = join(root, 'components/onboarding/OnboardingPager.tsx')

assert.ok(existsSync(slidesPath), 'slides.ts missing')
assert.ok(existsSync(pagerPath), 'OnboardingPager missing')

const slides = readFileSync(slidesPath, 'utf8')
const pager = readFileSync(pagerPath, 'utf8')

assert.match(onboarding, /OnboardingPager/)
assert.match(onboarding, /setOnboardingDone\(true\)/)
assert.match(home, /Redirect/)
assert.match(home, /onboardingDone/)
assert.match(layout, /headerShown:\s*false/)

assert.match(pager, /pagingEnabled/)
assert.match(pager, /ONBOARDING_SLIDES/)
assert.match(pager, /testID=["']onboarding-pager["']/)
assert.match(pager, /onboarding-done/)
assert.match(pager, /testID=["']onboarding-skip["']/)

assert.match(slides, /stats|account|permission/i)
assert.match(slides, /lock/i)
assert.match(slides, /schedule|soft lock/i)

const slideCount = (slides.match(/key:\s*['"]/g) ?? []).length
assert.ok(
  slideCount >= 3 && slideCount <= 4,
  `expected 3–4 slides, got ${slideCount}`
)

console.log('Onboarding flow contract OK — swipeable 3–4 screens')
