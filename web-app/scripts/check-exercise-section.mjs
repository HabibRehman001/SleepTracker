/**
 * Step 55 — Exercise toggle hides fields; parent RHF keeps last values.
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
const exerciseSrc = readFileSync(
  join(root, 'src/features/sleep-entry/ExerciseSection.tsx'),
  'utf8'
)
const schemaSrc = readFileSync(
  join(root, 'src/features/sleep-entry/sleepEntryForm.schema.ts'),
  'utf8'
)

assert.match(formSrc, /<ExerciseSection\s*\/>/)
assert.match(formSrc, /exercise:\s*\{/)
assert.match(exerciseSrc, /Switch/)
assert.match(exerciseSrc, /Exercised today\?/)
assert.match(exerciseSrc, /exercise\.exerciseType/)
assert.match(exerciseSrc, /exercise\.duration/)
assert.match(exerciseSrc, /exercise\.workoutTime/)
assert.match(exerciseSrc, /exercised \?/)
assert.doesNotMatch(
  exerciseSrc,
  /setValue\(\s*['"]exercise\.(exerciseType|duration|workoutTime)/,
  'toggle must not clear detail fields'
)
assert.match(schemaSrc, /exercise:\s*exerciseSchema/)

const {
  sleepEntryFormDefaults,
  sleepEntryFormSchema,
} = await import('../src/features/sleep-entry/sleepEntryForm.schema.ts')

const withWorkout = {
  ...sleepEntryFormDefaults,
  exercise: {
    exercise: true,
    exerciseType: 'run',
    duration: 45,
    workoutTime: '17:30',
  },
}
assert.equal(sleepEntryFormSchema.safeParse(withWorkout).success, true)

const toggledOff = {
  ...withWorkout,
  exercise: { ...withWorkout.exercise, exercise: false },
}
const off = sleepEntryFormSchema.safeParse(toggledOff)
assert.equal(off.success, true)
assert.equal(off.data?.exercise.exerciseType, 'run')
assert.equal(off.data?.exercise.duration, 45)
assert.equal(off.data?.exercise.workoutTime, '17:30')

console.log(
  'Exercise section contract OK — Switch hides fields; values preserved'
)
