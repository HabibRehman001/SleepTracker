/**
 * Keep AsyncStorage + SCHEDULED_LOCK registration in sync with the Zustand schedule.
 */
import { registerScheduledLockTask } from './backgroundTasks'
import { persistEnforcedSchedule } from './scheduledLock'
import { useScheduleStore } from '../store/scheduleStore'

/** Persist enforced times and ensure the background trigger is registered. */
export async function syncScheduledLockTrigger(): Promise<void> {
  const state = useScheduleStore.getState()
  const enforced = state.getEnforcedTimes()
  if (!state.lockedIn || !enforced) {
    await persistEnforcedSchedule(null)
    return
  }
  await persistEnforcedSchedule({
    sleepTime: enforced.bedtime,
    wakeTime: enforced.waketime,
    lockedIn: true,
  })
  await registerScheduledLockTask()
}
