/**
 * Pure permission-status row helpers (Step 140) — no expo imports.
 */

export type PermissionTone = 'ok' | 'warn' | 'denied' | 'na'

export type PermissionStatusRowModel = {
  id: string
  title: string
  /** e.g. "Always", "While Using", "Off" */
  detail: string
  tone: PermissionTone
  /** Platform note, e.g. "Android only" */
  platformNote?: string
}

export function toneGlyph(tone: PermissionTone): string {
  switch (tone) {
    case 'ok':
      return '✅'
    case 'warn':
      return '⚠️'
    case 'denied':
      return '❌'
    case 'na':
      return '—'
    default: {
      const _exhaustive: never = tone
      return _exhaustive
    }
  }
}

/** Location line: Always ✅ / While Using ⚠️ / Off ❌ */
export function classifyLocationRow(
  foreground: string,
  background: string
): Pick<PermissionStatusRowModel, 'detail' | 'tone'> {
  if (foreground === 'granted' && background === 'granted') {
    return { detail: 'Always', tone: 'ok' }
  }
  if (foreground === 'granted') {
    return { detail: 'While Using', tone: 'warn' }
  }
  if (foreground === 'undetermined' && background === 'undetermined') {
    return { detail: 'Not Determined', tone: 'warn' }
  }
  return { detail: 'Off', tone: 'denied' }
}

export function classifyBinaryRow(
  granted: boolean,
  labels: { ok: string; denied: string; undetermined?: string },
  undetermined = false
): Pick<PermissionStatusRowModel, 'detail' | 'tone'> {
  if (granted) return { detail: labels.ok, tone: 'ok' }
  if (undetermined) {
    return { detail: labels.undetermined ?? 'Not Determined', tone: 'warn' }
  }
  return { detail: labels.denied, tone: 'denied' }
}

export function classifyMotionRow(
  phase: string
): Pick<PermissionStatusRowModel, 'detail' | 'tone'> {
  if (phase === 'granted') return { detail: 'Allowed', tone: 'ok' }
  if (phase === 'undetermined') return { detail: 'Not Determined', tone: 'warn' }
  if (phase === 'accelerometer_denied') {
    return { detail: 'Motion Off', tone: 'denied' }
  }
  if (phase === 'activity_denied') {
    return { detail: 'Steps Off', tone: 'warn' }
  }
  return { detail: 'Off', tone: 'denied' }
}
