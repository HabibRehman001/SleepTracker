import { prisma } from "../src/lib/prisma";

/** Step 68 — 30 nights with phone / no-phone and weekday / weekend coverage. */
export const SEED_DAY_COUNT = 30;

const NOTES = [
  "Slept through most of the night.",
  "Woke once for water, fell back quickly.",
  "Mind was racing before bed.",
  "Felt rested after morning walk.",
  "Late dinner — sleep felt lighter.",
  "Good stretch of deep sleep.",
  "Phone scrolling delayed bedtime.",
  "Cool room helped a lot.",
  "Woke early for Fajr, then dozed.",
  "Solid night overall.",
  "Stress from work carried into bed.",
  "Workout day — fell asleep faster.",
  "Caffeine after 4pm was a mistake.",
  "Quiet night, no awakenings.",
  "Nap-free day paid off.",
  "Travel day — odd schedule.",
  "Early bedtime for once.",
  "Woke refreshed.",
  "Tossed and turned until late.",
  "Cool breeze from the fan.",
];

const MEAL_TYPES = ["light snack", "dinner", "protein shake", "fruit", null];
const EXERCISE_TYPES = ["walk", "gym", "run", "yoga", "cycling"];

function atTime(day: Date, hours: number, minutes: number): Date {
  const d = new Date(day);
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Deterministic variation (no Math.random) so dashboard e2e is reproducible. */
function vary(base: number, i: number, spread: number): number {
  const delta = ((i * 7) % (spread * 2 + 1)) - spread;
  return base + delta;
}

async function main() {
  await prisma.moodEntry.deleteMany();
  await prisma.foodEntry.deleteMany();
  await prisma.exerciseEntry.deleteMany();
  await prisma.environmentEntry.deleteMany();
  await prisma.healthEntry.deleteMany();
  await prisma.sleepEntry.deleteMany();
  await prisma.experiment.deleteMany();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let phoneYes = 0;
  let phoneNo = 0;
  let weekend = 0;
  let weekday = 0;

  for (let i = SEED_DAY_COUNT - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const dow = date.getDay(); // 0 Sun … 6 Sat
    const isWeekend = dow === 0 || dow === 6;
    if (isWeekend) weekend += 1;
    else weekday += 1;

    const lateNight = i % 5 === 0;
    const workoutDay = i % 3 === 0;
    const highCaffeine = i % 4 === 2;
    // Explicit mix: ~half phone nights (and late nights always phone)
    const phoneUsedBeforeSleep = lateNight || i % 2 === 1;
    if (phoneUsedBeforeSleep) phoneYes += 1;
    else phoneNo += 1;
    // Mix sunlight so correlation groups are both populated
    const sunlightSeenBeforeSleep = i % 3 !== 0;
    const mealBeforeSleep = i % 2 === 0;

    const bedHour = lateNight ? 0 : isWeekend ? 23 : 22;
    const bedMinute = lateNight
      ? 20 + (i % 3) * 10
      : 15 + (i % 4) * 10;
    const bedTime = atTime(
      lateNight
        ? (() => {
            const next = new Date(date);
            next.setDate(date.getDate() + 1);
            return next;
          })()
        : date,
      bedHour,
      bedMinute
    );

    const attemptSleepTime = new Date(bedTime.getTime() + 10 * 60_000);
    // Phone nights: longer latency (plausible A/B gap on dashboard)
    const latencyMinutes = phoneUsedBeforeSleep
      ? 35 + (i % 5) * 8
      : 8 + (i % 4) * 4;
    const estimatedSleepTime = new Date(
      attemptSleepTime.getTime() + latencyMinutes * 60_000
    );

    const wakeHour = lateNight ? 8 : isWeekend ? 7 : 6;
    const wakeMinute = 10 + (i % 5) * 7;
    const wakeDay = new Date(date);
    wakeDay.setDate(date.getDate() + 1);
    const wakeTime = atTime(wakeDay, wakeHour, wakeMinute);
    const outOfBedTime = new Date(
      wakeTime.getTime() + (8 + (i % 3) * 4) * 60_000
    );

    const sleepQuality = clamp(vary(lateNight ? 5 : 7, i, 2), 1, 10);
    const energyMorning = clamp(vary(sleepQuality - 1, i, 2), 1, 10);
    const energyWork = clamp(
      vary(energyMorning - (highCaffeine ? 0 : 1), i, 2),
      1,
      10
    );

    const mood = clamp(vary(sleepQuality, i, 2), 1, 10);
    const stress = clamp(
      vary(lateNight || highCaffeine ? 7 : 4, i, 2),
      1,
      10
    );
    const anxiety = clamp(vary(stress - 1, i, 2), 1, 10);
    const motivation = clamp(vary(11 - stress, i, 2), 1, 10);

    const caffeineAmountMg = highCaffeine
      ? 180 + (i % 3) * 40
      : 60 + (i % 4) * 20;

    await prisma.sleepEntry.create({
      data: {
        date,
        bedTime,
        attemptSleepTime,
        estimatedSleepTime,
        wakeTime,
        outOfBedTime,
        numberOfAwakenings: lateNight ? 2 + (i % 2) : i % 3,
        sleepQuality,
        energyMorning,
        energyWork,
        notes: NOTES[i % NOTES.length],
        mood: {
          create: {
            mood,
            stress,
            anxiety,
            motivation,
          },
        },
        food: {
          create: {
            mealBeforeSleep,
            mealTime: mealBeforeSleep
              ? atTime(date, 21, 30 + (i % 3) * 10)
              : null,
            mealType: mealBeforeSleep
              ? MEAL_TYPES[i % MEAL_TYPES.length]
              : null,
            caffeineAmountMg,
            caffeineLastConsumed: atTime(
              date,
              highCaffeine ? 17 : 14,
              15 + (i % 4) * 10
            ),
          },
        },
        exercise: {
          create: {
            exercise: workoutDay,
            exerciseType: workoutDay
              ? EXERCISE_TYPES[i % EXERCISE_TYPES.length]
              : null,
            duration: workoutDay ? 30 + (i % 4) * 15 : null,
            workoutTime: workoutDay
              ? atTime(date, 18, 0 + (i % 3) * 15)
              : null,
          },
        },
        environment: {
          create: {
            roomTemp: 21 + (i % 5) * 0.4,
            fanOn: i % 2 === 0,
            acOn: i % 3 === 0,
            blackoutCurtains: true,
            eyeMask: i % 4 === 0,
            whiteNoise: i % 3 !== 0,
            phoneUsedBeforeSleep,
            minutesPhoneBeforeSleep: phoneUsedBeforeSleep
              ? 20 + (i % 5) * 8
              : 0,
            sunlightSeenBeforeSleep,
            birdsHeard: wakeHour <= 7,
            fajrHeard: wakeHour <= 6 || i % 2 === 0,
            screenBrightness: lateNight
              ? 70 + (i % 3) * 5
              : 30 + (i % 4) * 5,
          },
        },
        health: {
          create: {
            weight: 72.5 + (i % 7) * 0.15,
            restingHeartRate: 58 + (i % 6),
            bloodPressure: `${118 + (i % 5)}/${74 + (i % 4)}`,
          },
        },
      },
    });
  }

  const experimentStart = new Date(today);
  experimentStart.setDate(today.getDate() - 14);
  const experimentEnd = new Date(today);
  experimentEnd.setDate(today.getDate() - 1);

  await prisma.experiment.create({
    data: {
      name: "No phone after work",
      startDate: experimentStart,
      endDate: experimentEnd,
    },
  });

  const sleepCount = await prisma.sleepEntry.count();
  console.log("Seed complete:");
  console.log(`  SleepEntry: ${sleepCount} (target ${SEED_DAY_COUNT})`);
  console.log(`  phone yes/no: ${phoneYes}/${phoneNo}`);
  console.log(`  weekend/weekday: ${weekend}/${weekday}`);
  console.log(`  MoodEntry: ${await prisma.moodEntry.count()}`);
  console.log(`  FoodEntry: ${await prisma.foodEntry.count()}`);
  console.log(`  ExerciseEntry: ${await prisma.exerciseEntry.count()}`);
  console.log(`  EnvironmentEntry: ${await prisma.environmentEntry.count()}`);
  console.log(`  HealthEntry: ${await prisma.healthEntry.count()}`);
  console.log(`  Experiment: ${await prisma.experiment.count()}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
