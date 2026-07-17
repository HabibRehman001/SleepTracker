/**
 * Step 54 — Food toggle hides fields but parent RHF keeps last values.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const formSrc = readFileSync(
  join(root, 'src/features/sleep-entry/SleepEntryForm.tsx'),
  'utf8'
)
const foodSrc = readFileSync(
  join(root, 'src/features/sleep-entry/FoodSection.tsx'),
  'utf8'
)
const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)

assert.match(formSrc, /<FoodSection\s*\/>/)
assert.match(formSrc, /shouldUnregister:\s*false/)
assert.match(formSrc, /food:\s*\{/)
assert.match(foodSrc, /Switch/)
assert.match(foodSrc, /mealBeforeSleep/)
assert.match(foodSrc, /Ate before sleep\?/)
assert.match(foodSrc, /mealBeforeSleep \?/)
assert.match(foodSrc, /food\.mealTime/)
assert.match(foodSrc, /useFormContext/)
assert.match(foodSrc, /useWatch/)
assert.doesNotMatch(
  foodSrc,
  /setValue\(\s*['"]food\.(mealTime|mealType)/,
  'toggle must not clear detail fields'
)
assert.match(schemaSrc, /food:\s*foodSchema/)

const {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
} = await import('../src/features/sleep-entry/sleepEntryForm.schema.ts')

// Values survive when mealBeforeSleep flips false — still valid on parent schema
const withMeal = {
  ...sleepEntryFormDefaults,
  food: {
    mealBeforeSleep: true,
    mealTime: '20:30',
    mealType: 'dinner',
    caffeineAmountMg: 80,
    caffeineLastConsumed: '16:00',
  },
}
const on = sleepEntryFormSchema.safeParse(withMeal)
assert.equal(on.success, true)

const toggledOff = {
  ...withMeal,
  food: { ...withMeal.food, mealBeforeSleep: false },
}
const off = sleepEntryFormSchema.safeParse(toggledOff)
assert.equal(off.success, true)
assert.equal(off.data?.food.mealTime, '20:30', 'mealTime preserved when toggled off')
assert.equal(off.data?.food.mealType, 'dinner')
assert.equal(off.data?.food.caffeineAmountMg, 80)

console.log(
  'Food section contract OK — Switch hides fields; parent form keeps values'
)
