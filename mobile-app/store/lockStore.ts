type Listener = () => void

/**
 * Minimal lock UI store (Step 118). No Zustand yet — swap later if needed.
 * Screens subscribe; services/native stay free of React.
 */
let locked = false
let busy = false
const listeners = new Set<Listener>()

function emit() {
  for (const listener of listeners) listener()
}

export function getLockSnapshot() {
  return { locked, busy }
}

export function subscribeLockStore(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function setLockBusy(next: boolean) {
  busy = next
  emit()
}

export function setLockLocked(next: boolean) {
  locked = next
  emit()
}
