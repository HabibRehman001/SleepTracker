import { prisma } from "../src/lib/prisma";

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

function jitter(base: number, spread: number): number {
  return base + Math.round((Math.random() * 2 - 1) * spread);
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

  for (let i = 13; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);

    const lateNight = i % 5 === 0;
    const workoutDay = i % 3 === 0;
    const highCaffeine = i % 4 === 2;

    const bedHour = lateNight ? 0 : 23;
    const bedMinute = lateNight ? 20 + (i % 3) * 10 : 15 + (i % 4) * 10;
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
    const estimatedSleepTime = new Date(
      attemptSleepTime.getTime() + (15 + (i % 4) * 5) * 60_000
    );

    const wakeHour = lateNight ? 8 : 6;
    const wakeMinute = 10 + (i % 5) * 7;
    const wakeDay = new Date(date);
    wakeDay.setDate(date.getDate() + 1);
    const wakeTime = atTime(wakeDay, wakeHour, wakeMinute);
    const outOfBedTime = new Date(wakeTime.getTime() + (8 + (i % 3) * 4) * 60_000);

    const sleepQuality = clamp(jitter(lateNight ? 5 : 7, 2), 1, 10);
    const energyMorning = clamp(jitter(sleepQuality - 1, 2), 1, 10);
    const energyWork = clamp(jitter(energyMorning - (highCaffeine ? 0 : 1), 2), 1, 10);

    const mood = clamp(jitter(sleepQuality, 2), 1, 10);
    const stress = clamp(jitter(lateNight || highCaffeine ? 7 : 4, 2), 1, 10);
    const anxiety = clamp(jitter(stress - 1, 2), 1, 10);
    const motivation = clamp(jitter(11 - stress, 2), 1, 10);

    const mealBeforeSleep = i % 2 === 0;
    const caffeineAmountMg = highCaffeine ? 180 + (i % 3) * 40 : 60 + (i % 4) * 20;

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
        notes: NOTES[13 - i],
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
            mealType: mealBeforeSleep ? MEAL_TYPES[i % MEAL_TYPES.length] : null,
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
            workoutTime: workoutDay ? atTime(date, 18, 0 + (i % 3) * 15) : null,
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
            phoneUsedBeforeSleep: lateNight || i % 2 === 1,
            minutesPhoneBeforeSleep:
              lateNight || i % 2 === 1 ? 20 + (i % 5) * 8 : 0,
            sunlightSeenBeforeSleep: true,
            birdsHeard: wakeHour <= 7,
            fajrHeard: wakeHour <= 6 || i % 2 === 0,
            screenBrightness: lateNight ? 70 + (i % 3) * 5 : 30 + (i % 4) * 5,
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
  experimentStart.setDate(today.getDate() - 7);
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
  const moodCount = await prisma.moodEntry.count();
  const foodCount = await prisma.foodEntry.count();
  const exerciseCount = await prisma.exerciseEntry.count();
  const environmentCount = await prisma.environmentEntry.count();
  const healthCount = await prisma.healthEntry.count();

  console.log("Seed complete:");
  console.log(`  SleepEntry: ${sleepCount}`);
  console.log(`  MoodEntry: ${moodCount}`);
  console.log(`  FoodEntry: ${foodCount}`);
  console.log(`  ExerciseEntry: ${exerciseCount}`);
  console.log(`  EnvironmentEntry: ${environmentCount}`);
  console.log(`  HealthEntry: ${healthCount}`);
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
