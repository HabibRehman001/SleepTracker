/**
 * Platform modules boundary (Step 116 → Step 118 `native/`).
 * UI / forms / stats depend only on this — never on Device Owner or FamilyControls APIs.
 */
export interface SleepLockModule {
  enableLock(): Promise<void>
  disableLock(): Promise<void>
  isLocked(): Promise<boolean>
}

export { createMockSleepLock } from './mockSleepLock'
export {
  getSleepLockModule,
  type SleepLockPlatform,
} from './getSleepLockModule'
