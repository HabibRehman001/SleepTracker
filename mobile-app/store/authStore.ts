import * as SecureStore from 'expo-secure-store'
import { Platform } from 'react-native'
import { create } from 'zustand'

import { ApiError, mobileFetch, setAuthTokenGetter } from '../services/api'

const TOKEN_KEY = 'sleep_lock_auth_token'

export type AuthUser = {
  id: string
  email: string
  name: string
}

type AuthResponse = {
  user: AuthUser
  token: string
}

type AuthState = {
  user: AuthUser | null
  token: string | null
  /** False until SecureStore / storage hydrate finishes. */
  hydrated: boolean
  busy: boolean
  lastError: string | null
  hydrate: () => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<void>
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
}

async function readStoredToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return null
      return localStorage.getItem(TOKEN_KEY)
    }
    return await SecureStore.getItemAsync(TOKEN_KEY)
  } catch {
    return null
  }
}

async function writeStoredToken(token: string | null): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage === 'undefined') return
      if (token) localStorage.setItem(TOKEN_KEY, token)
      else localStorage.removeItem(TOKEN_KEY)
      return
    }
    if (token) await SecureStore.setItemAsync(TOKEN_KEY, token)
    else await SecureStore.deleteItemAsync(TOKEN_KEY)
  } catch {
    // Non-fatal — session still works in memory this launch.
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  busy: false,
  lastError: null,

  hydrate: async () => {
    const token = await readStoredToken()
    if (!token) {
      set({ token: null, user: null, hydrated: true })
      return
    }
    set({ token })
    try {
      const data = await mobileFetch<{ user: AuthUser }>('/auth/me')
      set({ token, user: data.user, hydrated: true, lastError: null })
    } catch {
      await writeStoredToken(null)
      set({ token: null, user: null, hydrated: true })
    }
  },

  signup: async (email, password, name) => {
    set({ busy: true, lastError: null })
    try {
      const data = await mobileFetch<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify({ email, password, name }),
      })
      await writeStoredToken(data.token)
      set({ user: data.user, token: data.token, busy: false })
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Signup failed'
      set({ busy: false, lastError: message })
      throw err
    }
  },

  login: async (email, password) => {
    set({ busy: true, lastError: null })
    try {
      const data = await mobileFetch<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      })
      await writeStoredToken(data.token)
      set({ user: data.user, token: data.token, busy: false })
    } catch (err: unknown) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Login failed'
      set({ busy: false, lastError: message })
      throw err
    }
  },

  logout: async () => {
    await writeStoredToken(null)
    set({ user: null, token: null, lastError: null })
  },

  clearError: () => set({ lastError: null }),
}))

setAuthTokenGetter(() => useAuthStore.getState().token)
