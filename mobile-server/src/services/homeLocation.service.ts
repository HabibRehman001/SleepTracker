import { HomeLocation } from '../models/HomeLocation'

export class HomeLocationNotFoundError extends Error {
  constructor() {
    super('Home location not set')
    this.name = 'HomeLocationNotFoundError'
  }
}

export type HomeLocationDTO = {
  id: string
  latitude: number
  longitude: number
  label: string
  updatedAt: string
  createdAt: string
}

function toDTO(doc: {
  _id: { toString(): string }
  latitude: number
  longitude: number
  label?: string | null
  updatedAt?: Date
  createdAt?: Date
}): HomeLocationDTO {
  return {
    id: doc._id.toString(),
    latitude: doc.latitude,
    longitude: doc.longitude,
    label: doc.label ?? 'home',
    updatedAt: (doc.updatedAt ?? new Date()).toISOString(),
    createdAt: (doc.createdAt ?? new Date()).toISOString(),
  }
}

export async function getHomeLocation(): Promise<HomeLocationDTO> {
  const doc = await HomeLocation.findOne().sort({ updatedAt: -1 }).lean()
  if (!doc) throw new HomeLocationNotFoundError()
  return toDTO(doc)
}

/** Prefer this for HTTP GET — never throws; null when unset (avoids noisy 404s). */
export async function getHomeLocationOrNull(): Promise<HomeLocationDTO | null> {
  const doc = await HomeLocation.findOne().sort({ updatedAt: -1 }).lean()
  if (!doc) return null
  return toDTO(doc)
}

export async function upsertHomeLocation(input: {
  latitude: number
  longitude: number
  label?: string
}): Promise<HomeLocationDTO> {
  const { latitude, longitude, label } = input
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('latitude and longitude must be finite numbers')
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('latitude out of range')
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('longitude out of range')
  }

  const existing = await HomeLocation.findOne().sort({ updatedAt: -1 })
  if (existing) {
    existing.latitude = latitude
    existing.longitude = longitude
    if (label != null && label.trim()) existing.label = label.trim()
    await existing.save()
    return toDTO(existing)
  }

  const created = await HomeLocation.create({
    latitude,
    longitude,
    label: label?.trim() || 'home',
  })
  return toDTO(created)
}
