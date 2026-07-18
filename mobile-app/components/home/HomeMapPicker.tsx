/**
 * Platform entry: Metro picks `.web.tsx` / `.native.tsx` at bundle time.
 * This file is the TypeScript fallback (same as web — no maps import).
 */
export { HomeMapPicker } from './HomeMapPicker.web'
export type {
  HomeMapCoords,
  HomeMapPickerProps,
  MapRegion,
} from './homeMapTypes'
export { DEFAULT_MAP_REGION } from './homeMapTypes'
