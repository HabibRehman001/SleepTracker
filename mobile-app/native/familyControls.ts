/**
 * iOS Family Controls / Screen Time entitlement (Step 139).
 * Cannot be automated — Apple must approve before soft lock builds work.
 */

/** Official Apple request form for Family Controls distribution entitlement. */
export const FAMILY_CONTROLS_REQUEST_URL =
  'https://developer.apple.com/contact/request/family-controls-distribution'

export const IOS_BUNDLE_ID = 'com.sleeptracker.sleeplock'

/**
 * Checklist before Family Controls soft lock is usable in a release build.
 */
export const FAMILY_CONTROLS_CHECKLIST = [
  {
    id: 'account',
    label: 'Sign in to an Apple Developer Program account (paid membership).',
  },
  {
    id: 'request',
    label:
      'Submit the Family Controls entitlement request (Screen Time / Managed Settings).',
  },
  {
    id: 'wait',
    label:
      'Wait for Apple approval (often several days; free request, manual review).',
  },
  {
    id: 'capability',
    label:
      'Enable Family Controls on the App ID / provisioning profile for this bundle.',
  },
  {
    id: 'rebuild',
    label:
      'Rebuild the iOS custom dev client / release binary with the new profile.',
  },
  {
    id: 'authorize',
    label:
      'On device, authorize Screen Time / FamilyActivityPicker when the app prompts.',
  },
] as const

/** Shown until entitlement is approved — lock windows are alerts only. */
export const NOTIFICATION_ONLY_MODE_LABEL = 'Notification-only mode'

export const NOTIFICATION_ONLY_MODE_BODY =
  'Soft lock from your sleep stats: countdown alerts and schedule help. Full phone lockdown needs Device Owner (Android) or Family Controls (iOS) — optional, not required to use the app.'

export const SOFT_LOCK_ENABLED_LABEL = 'Soft lock ready (from your stats)'
