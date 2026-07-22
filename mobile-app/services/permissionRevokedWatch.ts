/**
 * Step 194 — re-check OS permissions on foreground; clear sticky setup flags
 * and surface a clear re-grant prompt (never fail silently).
 */
import { Alert, AppState, type AppStateStatus } from 'react-native'

import { getLocationPermissionSnapshot, openAppSettings } from './location'
import {
  detectRevokedPermissions,
  type PermissionRevokeFinding,
} from './permissionRevokedMath'
import { getMotionPermissionSnapshot } from './sensors'

export type PermissionRevokeHandlers = {
  locationSetupDone: boolean
  motionSetupDone: boolean
  setLocationSetupDone: (done: boolean) => void
  setMotionSetupDone: (done: boolean) => void
  /** Optional navigate after alert OK. */
  onNavigate?: (route: PermissionRevokeFinding['primaryRoute']) => void
  /** Called with finding (or null when all clear) so UI can show a banner. */
  onFinding?: (finding: PermissionRevokeFinding | null) => void
}

let lastAlertKey: string | null = null

/** Test helper — reset de-dupe between contract runs. */
export function resetPermissionRevokeAlertDedupe(): void {
  lastAlertKey = null
}

export function showPermissionRevokedAlert(
  finding: PermissionRevokeFinding,
  onNavigate?: PermissionRevokeHandlers['onNavigate']
): void {
  if (lastAlertKey === finding.alertKey) return
  lastAlertKey = finding.alertKey

  Alert.alert(finding.title, finding.body, [
    {
      text: 'Open Settings',
      style: 'default',
      onPress: () => {
        void openAppSettings()
      },
    },
    {
      text: 'Re-grant in app',
      style: 'default',
      onPress: () => {
        onNavigate?.(finding.primaryRoute)
      },
    },
  ], { cancelable: false })
}

/**
 * Snapshot OS permissions vs sticky setup flags.
 * Clears flags when revoked so home redirects to permission screens.
 */
export async function reconcileRevokedPermissions(
  handlers: PermissionRevokeHandlers
): Promise<PermissionRevokeFinding | null> {
  const [location, motion] = await Promise.all([
    getLocationPermissionSnapshot(),
    getMotionPermissionSnapshot(),
  ])

  const finding = detectRevokedPermissions({
    locationSetupDone: handlers.locationSetupDone,
    motionSetupDone: handlers.motionSetupDone,
    locationPhase: location.phase,
    motionPhase: motion.phase,
  })

  if (!finding) {
    lastAlertKey = null
    handlers.onFinding?.(null)
    return null
  }

  if (finding.clearLocationSetup) {
    handlers.setLocationSetupDone(false)
  }
  if (finding.clearMotionSetup) {
    handlers.setMotionSetupDone(false)
  }

  handlers.onFinding?.(finding)
  showPermissionRevokedAlert(finding, handlers.onNavigate)
  return finding
}

/**
 * Subscribe to AppState: when returning from system Settings, re-check.
 * Returns unsubscribe.
 */
export function watchPermissionRevokes(
  getHandlers: () => PermissionRevokeHandlers
): () => void {
  const run = () => {
    const h = getHandlers()
    if (!h.locationSetupDone && !h.motionSetupDone) return
    void reconcileRevokedPermissions(h).catch((err) => {
      console.warn('[PERMISSION_REVOKE] check failed', err)
    })
  }

  run()

  const onChange = (next: AppStateStatus) => {
    if (next === 'active') run()
  }
  const sub = AppState.addEventListener('change', onChange)
  return () => sub.remove()
}
