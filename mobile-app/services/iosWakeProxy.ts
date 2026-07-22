/**
 * Step 199 — AppState → active proxy for iOS wake (approximation).
 */
import AsyncStorage from '@react-native-async-storage/async-storage'
import { AppState, Platform, type AppStateStatus } from 'react-native'

import { listContinuousNights } from './continuousDetection'
import {
  buildIosWakeEvent,
  decideIosWakeProxy,
  type IosWakeEvent,
} from './iosWakeProxyMath'

export const IOS_WAKE_EVENTS_STORAGE_KEY = '@sleep_lock/ios_wake_proxy_v1'

async function loadEvents(): Promise<IosWakeEvent[]> {
  try {
    const raw = await AsyncStorage.getItem(IOS_WAKE_EVENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as IosWakeEvent[]) : []
  } catch {
    return []
  }
}

async function saveEvents(events: IosWakeEvent[]): Promise<void> {
  await AsyncStorage.setItem(
    IOS_WAKE_EVENTS_STORAGE_KEY,
    JSON.stringify(events.slice(-50))
  )
}

export async function listIosWakeEvents(): Promise<IosWakeEvent[]> {
  return loadEvents()
}

export async function clearIosWakeEvents(): Promise<void> {
  await AsyncStorage.removeItem(IOS_WAKE_EVENTS_STORAGE_KEY)
}

export async function getLastIosWakeEvent(): Promise<IosWakeEvent | null> {
  const events = await loadEvents()
  return events.length ? events[events.length - 1] : null
}

/**
 * Latest finalized continuous static window end (ms), if any.
 */
export async function loadLatestStaticWindowEndMs(): Promise<number | null> {
  const nights = await listContinuousNights()
  if (!nights.length) return null
  const last = nights[nights.length - 1]
  const end = new Date(last.endIso).getTime()
  return Number.isFinite(end) ? end : null
}

/**
 * Handle one AppState change. Records wake only when decideIosWakeProxy says so.
 */
export async function handleIosAppStateForWake(
  next: AppStateStatus,
  nowMs: number = Date.now()
): Promise<IosWakeEvent | null> {
  // Android uses UnlockReceiver (Step 198); iOS/web use AppState proxy.
  if (Platform.OS === 'android') return null

  const staticWindowEndMs = await loadLatestStaticWindowEndMs()
  const events = await loadEvents()
  const recordedForWindowEndMs = events.length
    ? events[events.length - 1].staticWindowEndMs
    : null

  const decision = decideIosWakeProxy({
    nextAppState: next,
    staticWindowEndMs,
    nowMs,
    recordedForWindowEndMs,
  })

  if (!decision.shouldRecord || decision.wakeMs == null || staticWindowEndMs == null) {
    return null
  }

  const event = buildIosWakeEvent(decision.wakeMs, staticWindowEndMs)
  await saveEvents([...events, event])
  console.log(
    '[IOS_WAKE_PROXY] recorded',
    event.atMs,
    'delayMs',
    event.delayMs,
    '(approximation)'
  )
  return event
}

/**
 * Subscribe on iOS (and web for UX/dev). Returns unsubscribe.
 */
export function watchIosWakeProxy(): () => void {
  if (Platform.OS === 'android') {
    return () => {}
  }

  const onChange = (next: AppStateStatus) => {
    void handleIosAppStateForWake(next).catch((err) => {
      console.warn('[IOS_WAKE_PROXY] failed', err)
    })
  }

  // Cold start already active — evaluate once.
  if (AppState.currentState === 'active') {
    onChange('active')
  }

  const sub = AppState.addEventListener('change', onChange)
  return () => sub.remove()
}
