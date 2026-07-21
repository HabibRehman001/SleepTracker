/**
 * Session flag so the countdown can be soft-dismissed until next app cold start
 * / next lock occurrence — avoids trapping the user (soft-lock UX).
 */
let dismissedThisSession = false

export function dismissLockCountdownThisSession(): void {
  dismissedThisSession = true
}

export function isLockCountdownDismissedThisSession(): boolean {
  return dismissedThisSession
}

/** Test / wake-cycle helper. */
export function resetLockCountdownSession(): void {
  dismissedThisSession = false
}
