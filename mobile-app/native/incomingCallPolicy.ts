/**
 * Incoming call policy during lock (Step 162) — mirrors IncomingCallGate.kt.
 */

export type IncomingCallPolicy = 'allowlist_only' | 'decline_non_favorites'

export type IncomingCallDecision =
  | 'allow'
  | 'reject_silent'
  | 'reject_decline'

export const ASLEEP_CALLBACK_MESSAGE = 'Asleep — will call back.'

export const INCOMING_CALL_POLICY_LABELS: Record<IncomingCallPolicy, string> = {
  allowlist_only: 'Only favorites ring',
  decline_non_favorites: 'Favorites ring; others auto-declined',
}

export function parseIncomingCallPolicy(raw: unknown): IncomingCallPolicy {
  if (raw === 'decline_non_favorites' || raw === 'decline-non-favorites' || raw === 'b') {
    return 'decline_non_favorites'
  }
  return 'allowlist_only'
}

export function normalizePhoneDigits(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/\D/g, '')
}

export function isAllowlistedNumber(
  caller: string | null | undefined,
  allowlist: readonly string[]
): boolean {
  const needle = normalizePhoneDigits(caller)
  if (needle.length < 7) return false
  for (const entry of allowlist) {
    const hay = normalizePhoneDigits(entry)
    if (hay.length < 7) continue
    if (needle === hay || needle.endsWith(hay) || hay.endsWith(needle)) {
      return true
    }
  }
  return false
}

export function decideIncomingCall(args: {
  locked: boolean
  isFavorite: boolean
  policy: IncomingCallPolicy
  /** Step 164 — emergency / emergency-callback must always ring. */
  isEmergency?: boolean
}): IncomingCallDecision {
  if (!args.locked) return 'allow'
  if (args.isEmergency) return 'allow'
  if (args.isFavorite) return 'allow'
  return args.policy === 'allowlist_only' ? 'reject_silent' : 'reject_decline'
}

/** Well-known emergency short codes — classify only; never auto-dial. */
export const WELL_KNOWN_EMERGENCY_DIGITS = [
  '911',
  '112',
  '999',
  '000',
  '110',
  '119',
  '118',
  '122',
  '15',
  '16',
  '1122',
] as const

export const EMERGENCY_MANUAL_TEST_NOTE =
  "Use carrier official test line or lab stub — never dial real emergency numbers."

export const LOW_BATTERY_LOCKED_HINT =
  'Battery low. Emergency calling still works.'

/** Show calm low-battery hint on locked UI at or below this fraction. */
export const LOW_BATTERY_THRESHOLD = 0.15

export function isEmergencyNumber(raw: string | null | undefined): boolean {
  const d = normalizePhoneDigits(raw)
  if (!d) return false
  if ((WELL_KNOWN_EMERGENCY_DIGITS as readonly string[]).includes(d)) return true
  for (const code of WELL_KNOWN_EMERGENCY_DIGITS) {
    if (d.length <= code.length + 2 && d.endsWith(code)) return true
  }
  return false
}
