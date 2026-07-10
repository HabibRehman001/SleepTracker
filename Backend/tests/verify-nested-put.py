#!/usr/bin/env python3
"""Verify one PUT populates SleepEntry + 5 child tables. Used by manual curl test."""
import json
import sqlite3
import sys
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:4000"
DATE = "2099-04-04"
payload = {
    "bedTime": "2099-04-04T22:00:00.000Z",
    "mood": {"mood": 7, "stress": 3, "anxiety": 2, "motivation": 8},
    "food": {"mealBeforeSleep": True, "caffeineAmountMg": 90},
    "exercise": {"exercise": True, "exerciseType": "walk", "duration": 35},
    "environment": {
        "phoneUsedBeforeSleep": False,
        "minutesPhoneBeforeSleep": 0,
        "roomTemp": 22.0,
    },
    "health": {"weight": 71.0, "restingHeartRate": 60, "bloodPressure": "118/76"},
}

req = urllib.request.Request(
    f"{BASE}/api/sleep-entries/{DATE}",
    data=json.dumps(payload).encode(),
    headers={"Content-Type": "application/json"},
    method="PUT",
)
with urllib.request.urlopen(req) as res:
    body = json.load(res)

missing = [
    name
    for name in ("mood", "food", "exercise", "environment", "health")
    if not body.get(name)
]
if missing:
    raise SystemExit(f"response missing children: {missing}")

conn = sqlite3.connect("dev.db")
sid = body["id"]
counts = {
    table: conn.execute(
        f'SELECT COUNT(*) FROM "{table}" WHERE sleepEntryId=?', (sid,)
    ).fetchone()[0]
    for table in (
        "MoodEntry",
        "FoodEntry",
        "ExerciseEntry",
        "EnvironmentEntry",
        "HealthEntry",
    )
}
sleep = conn.execute('SELECT COUNT(*) FROM "SleepEntry" WHERE id=?', (sid,)).fetchone()[0]
conn.close()

print("SleepEntry:", sleep)
for table, count in counts.items():
    print(f"{table}: {count}")

if sleep != 1 or any(c != 1 for c in counts.values()):
    raise SystemExit("FAILED: expected 1 row in SleepEntry and each of 5 child tables")

print("OK: single PUT populated SleepEntry + all 5 child tables")
