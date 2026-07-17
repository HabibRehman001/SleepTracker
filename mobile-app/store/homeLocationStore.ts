import { create } from 'zustand'

import {
  fetchHomeLocation,
  saveHomeLocation,
  type HomeLocation,
} from '../services/homeLocation'

type HomeLocationState = {
  latitude: number | null
  longitude: number | null
  label: string | null
  hydrated: boolean
  saving: boolean
  lastError: string | null
  setCoords: (lat: number, lng: number) => void
  hydrateFromBackend: () => Promise<HomeLocation | null>
  persistToBackend: () => Promise<HomeLocation>
  clearLocal: () => void
}

/**
 * Home pin for geofencing (Step 137).
 * Source of truth is Mongo via mobile-server — local state is a cache.
 */
export const useHomeLocationStore = create<HomeLocationState>((set, get) => ({
  latitude: null,
  longitude: null,
  label: null,
  hydrated: false,
  saving: false,
  lastError: null,

  setCoords: (latitude, longitude) =>
    set({ latitude, longitude, lastError: null }),

  hydrateFromBackend: async () => {
    try {
      const home = await fetchHomeLocation()
      if (home) {
        set({
          latitude: home.latitude,
          longitude: home.longitude,
          label: home.label,
          hydrated: true,
          lastError: null,
        })
      } else {
        set({
          latitude: null,
          longitude: null,
          label: null,
          hydrated: true,
          lastError: null,
        })
      }
      return home
    } catch (err: unknown) {
      set({
        hydrated: true,
        lastError: err instanceof Error ? err.message : 'Failed to load home',
      })
      return null
    }
  },

  persistToBackend: async () => {
    const { latitude, longitude } = get()
    if (latitude == null || longitude == null) {
      throw new Error('Pick a location on the map first')
    }
    set({ saving: true, lastError: null })
    try {
      const home = await saveHomeLocation(latitude, longitude)
      set({
        latitude: home.latitude,
        longitude: home.longitude,
        label: home.label,
        saving: false,
        hydrated: true,
      })
      return home
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Save failed'
      set({ saving: false, lastError: message })
      throw err
    }
  },

  clearLocal: () =>
    set({
      latitude: null,
      longitude: null,
      label: null,
      lastError: null,
    }),
}))
