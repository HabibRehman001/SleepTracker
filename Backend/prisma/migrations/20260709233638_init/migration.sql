-- CreateTable
CREATE TABLE "SleepEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "date" DATETIME NOT NULL,
    "bedTime" DATETIME,
    "attemptSleepTime" DATETIME,
    "estimatedSleepTime" DATETIME,
    "wakeTime" DATETIME,
    "outOfBedTime" DATETIME,
    "numberOfAwakenings" INTEGER,
    "sleepQuality" INTEGER,
    "energyMorning" INTEGER,
    "energyWork" INTEGER,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MoodEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sleepEntryId" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "stress" INTEGER NOT NULL,
    "anxiety" INTEGER NOT NULL,
    "motivation" INTEGER NOT NULL,
    CONSTRAINT "MoodEntry_sleepEntryId_fkey" FOREIGN KEY ("sleepEntryId") REFERENCES "SleepEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FoodEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sleepEntryId" TEXT NOT NULL,
    "mealBeforeSleep" BOOLEAN NOT NULL,
    "mealTime" DATETIME,
    "mealType" TEXT,
    "caffeineAmountMg" INTEGER,
    "caffeineLastConsumed" DATETIME,
    CONSTRAINT "FoodEntry_sleepEntryId_fkey" FOREIGN KEY ("sleepEntryId") REFERENCES "SleepEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ExerciseEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sleepEntryId" TEXT NOT NULL,
    "exercise" BOOLEAN NOT NULL,
    "exerciseType" TEXT,
    "duration" INTEGER,
    "workoutTime" DATETIME,
    CONSTRAINT "ExerciseEntry_sleepEntryId_fkey" FOREIGN KEY ("sleepEntryId") REFERENCES "SleepEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EnvironmentEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sleepEntryId" TEXT NOT NULL,
    "roomTemp" REAL,
    "fanOn" BOOLEAN,
    "acOn" BOOLEAN,
    "blackoutCurtains" BOOLEAN,
    "eyeMask" BOOLEAN,
    "whiteNoise" BOOLEAN,
    "phoneUsedBeforeSleep" BOOLEAN,
    "minutesPhoneBeforeSleep" INTEGER,
    "sunlightSeenBeforeSleep" BOOLEAN,
    "birdsHeard" BOOLEAN,
    "fajrHeard" BOOLEAN,
    "screenBrightness" INTEGER,
    CONSTRAINT "EnvironmentEntry_sleepEntryId_fkey" FOREIGN KEY ("sleepEntryId") REFERENCES "SleepEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "HealthEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sleepEntryId" TEXT NOT NULL,
    "weight" REAL,
    "restingHeartRate" INTEGER,
    "bloodPressure" TEXT,
    CONSTRAINT "HealthEntry_sleepEntryId_fkey" FOREIGN KEY ("sleepEntryId") REFERENCES "SleepEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Experiment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "SleepEntry_date_key" ON "SleepEntry"("date");

-- CreateIndex
CREATE UNIQUE INDEX "MoodEntry_sleepEntryId_key" ON "MoodEntry"("sleepEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "FoodEntry_sleepEntryId_key" ON "FoodEntry"("sleepEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "ExerciseEntry_sleepEntryId_key" ON "ExerciseEntry"("sleepEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "EnvironmentEntry_sleepEntryId_key" ON "EnvironmentEntry"("sleepEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "HealthEntry_sleepEntryId_key" ON "HealthEntry"("sleepEntryId");
