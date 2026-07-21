import AsyncStorage from '@react-native-async-storage/async-storage'

import {
  ASLEEP_CALLBACK_MESSAGE,
  parseIncomingCallPolicy,
  type IncomingCallPolicy,
} from '../native/incomingCallPolicy'
import * as lockService from './lockService'

const STORAGE_ALLOWLIST = '@sleep_lock/call_allowlist'
const STORAGE_POLICY = '@sleep_lock/incoming_call_policy'

/**
 * Step 162 — local favorites/emergency allow-list + policy.
 * Persists in AsyncStorage and mirrors to native SharedPreferences when available.
 */
export async function getCallAllowlist(): Promise<string[]> {
  try {
    const native = await lockService.getCallAllowlist()
    if (native.length > 0) return native
  } catch {
    // mock / no native
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_ALLOWLIST)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed)
      ? parsed.filter((n): n is string => typeof n === 'string' && n.trim().length > 0)
      : []
  } catch {
    return []
  }
}

export async function setCallAllowlist(numbers: string[]): Promise<void> {
  const cleaned = numbers.map((n) => n.trim()).filter(Boolean)
  await AsyncStorage.setItem(STORAGE_ALLOWLIST, JSON.stringify(cleaned))
  try {
    await lockService.setCallAllowlist(cleaned)
  } catch {
    // mock / no native bridge methods
  }
}

export async function getIncomingCallPolicy(): Promise<IncomingCallPolicy> {
  try {
    const native = await lockService.getIncomingCallPolicy()
    return parseIncomingCallPolicy(native)
  } catch {
    // fall through
  }
  try {
    const raw = await AsyncStorage.getItem(STORAGE_POLICY)
    return parseIncomingCallPolicy(raw)
  } catch {
    return 'allowlist_only'
  }
}

export async function setIncomingCallPolicy(
  policy: IncomingCallPolicy
): Promise<void> {
  await AsyncStorage.setItem(STORAGE_POLICY, policy)
  try {
    await lockService.setIncomingCallPolicy(policy)
  } catch {
    // mock / no native
  }
}

export async function addCallAllowlistNumber(number: string): Promise<string[]> {
  const list = await getCallAllowlist()
  const trimmed = number.trim()
  if (!trimmed) return list
  if (list.some((n) => n === trimmed)) return list
  const next = [...list, trimmed]
  await setCallAllowlist(next)
  return next
}

export async function removeCallAllowlistNumber(
  number: string
): Promise<string[]> {
  const next = (await getCallAllowlist()).filter((n) => n !== number)
  await setCallAllowlist(next)
  return next
}

export { ASLEEP_CALLBACK_MESSAGE }
export type { IncomingCallPolicy }
