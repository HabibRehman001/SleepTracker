import { ApiError, mobileFetch } from './api'

export type HomeLocation = {
  id: string
  latitude: number
  longitude: number
  label: string
  updatedAt: string
  createdAt: string
}

type HomeLocationGetResponse = {
  home: HomeLocation | null
}

function isHomeLocation(value: unknown): value is HomeLocation {
  if (!value || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.latitude === 'number' &&
    typeof v.longitude === 'number' &&
    typeof v.id === 'string'
  )
}

/** GET persisted home — null if never saved (200 { home: null }, not 404). */
export async function fetchHomeLocation(): Promise<HomeLocation | null> {
  try {
    const body = await mobileFetch<HomeLocationGetResponse | HomeLocation>(
      '/home-location'
    )
    // New shape: { home: dto | null }
    if (body && typeof body === 'object' && 'home' in body) {
      const wrapped = body as HomeLocationGetResponse
      return wrapped.home ?? null
    }
    // Legacy flat dto
    if (isHomeLocation(body)) return body
    return null
  } catch (err) {
    // Legacy servers returned 404 when unset
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
