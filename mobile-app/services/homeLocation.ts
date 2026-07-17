import { ApiError, mobileFetch } from './api'

export type HomeLocation = {
  id: string
  latitude: number
  longitude: number
  label: string
  updatedAt: string
  createdAt: string
}

/** GET persisted home — null if never saved (404). */
export async function fetchHomeLocation(): Promise<HomeLocation | null> {
  try {
    return await mobileFetch<HomeLocation>('/home-location')
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null
    throw err
  }
}

/** Upsert home pin on the backend (survives reinstall). */
export async function saveHomeLocation(
  latitude: number,
  longitude: number,
  label = 'home'
): Promise<HomeLocation> {
  return mobileFetch<HomeLocation>('/home-location', {
    method: 'PUT',
    body: JSON.stringify({ latitude, longitude, label }),
  })
}
