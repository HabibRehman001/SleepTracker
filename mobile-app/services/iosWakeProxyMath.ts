/**
 * Step 199 — iOS wake approximation (no system unlock broadcast for 3P apps).
 * Proxy: first AppState → active after a qualifying static window ends.
 * Honesty: approximation only if the user opens this app soon after waking;
 * never invent a wake time when they do not.
 */

/** Open Sleep Lock within this delay after static window end to count as wake. */
export const IOS_WAKE_PROXY_MAX_DELAY_MS = 15 * 60 * 1000

/** Beyond this we still refuse to guess (hours later → no event). */
export const IOS_WAKE_PROXY_TOO_LATE_MS = 2 * 60 * 60 * 1000

export const IOS_WAKE_PROXY_ACTION = 'APP_STATE_ACTIVE'

export const IOS_WAKE_PROXY_HONESTY_TITLE = 'Wake time is approximate on iOS'

/**
 * Same honesty pattern as soft-lock / notification-only limitations:
 * say what we cannot do, and what the proxy is.
 */
export const IOS_WAKE_PROXY_HONESTY_BODY =
  'Apple does not let third-party apps see when you unlock your phone. Sleep Lock records wake only when you open this app soon after a detected sleep window ends — an approximation, not a guarantee. If you do not open the app after waking, we show no wake event rather than guessing.'

export const IOS_WAKE_PROXY_HONESTY_SHORT =
  'iOS wake ≈ first open of Sleep Lock after sleep ends (not unlock). Approximation only.'

export type IosWakeProxyDecision = {
  shouldRecord: boolean
  wakeMs: number | null
  reason:
    | 'recorded'
    | 'not-active'
    | 'no-static-window'
    | 'already-recorded'
    | 'too-late-no-guess'
    | 'still-within-window'
    | 'outside-proxy-window'
}

/**
 * Decide whether AppState → active should record an approximate wake.
 * Hours after the window with no open → no event (never a wrong guess).
 */
export function decideIosWakeProxy(input: {
  nextAppState: string
  staticWindowEndMs: number | null
  nowMs: number
  /** Window end already paired with a wake record. */
  recordedForWindowEndMs: number | null
  maxDelayMs?: number
}): IosWakeProxyDecision {
  if (input.nextAppState !== 'active') {
    return {
      shouldRecord: false,
      wakeMs: null,
      reason: 'not-active',
    }
  }

  const end = input.staticWindowEndMs
  if (end == null || !Number.isFinite(end)) {
    return {
      shouldRecord: false,
      wakeMs: null,
      reason: 'no-static-window',
    }
  }

  if (input.nowMs < end) {
    return {
      shouldRecord: false,
      wakeMs: null,
      reason: 'still-within-window',
    }
  }

  if (
    input.recordedForWindowEndMs != null &&
    input.recordedForWindowEndMs === end
  ) {
    return {
      shouldRecord: false,
      wakeMs: null,
      reason: 'already-recorded',
    }
  }

  const delay = input.nowMs - end
  const maxDelay = input.maxDelayMs ?? IOS_WAKE_PROXY_MAX_DELAY_MS

  if (delay > maxDelay) {
    // Explicit: late open must not invent a wake at window end or "now".
    return {
      shouldRecord: false,
      wakeMs: null,
      reason: delay >= IOS_WAKE_PROXY_TOO_LATE_MS
        ? 'too-late-no-guess'
        : 'outside-proxy-window',
    }
  }

  return {
    shouldRecord: true,
    wakeMs: input.nowMs,
    reason: 'recorded',
  }
}

export type IosWakeEvent = {
  atMs: number
  action: typeof IOS_WAKE_PROXY_ACTION
  staticWindowEndMs: number
  delayMs: number
}

export function buildIosWakeEvent(
  wakeMs: number,
  staticWindowEndMs: number
): IosWakeEvent {
  return {
    atMs: wakeMs,
    action: IOS_WAKE_PROXY_ACTION,
    staticWindowEndMs,
    delayMs: wakeMs - staticWindowEndMs,
  }
}
