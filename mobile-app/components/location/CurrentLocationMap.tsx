/**
 * Platform entry: Metro picks `.web.tsx` / `.native.tsx` at bundle time.
 * This file is the TypeScript fallback (same as web — no maps import).
 */
export { CurrentLocationMap } from './CurrentLocationMap.web'
export type { CurrentLocationMapProps } from './currentLocationMapTypes'
