/**
 * Base URL for Phase 2 mobile-server (LAN). Override with EXPO_PUBLIC_MOBILE_API_URL.
 * Web/dev default: localhost. Phone on Wi-Fi: use the host's LAN IP (see server startup log).
 */
export const MOBILE_API_BASE =
  (typeof process !== 'undefined' &&
    process.env?.EXPO_PUBLIC_MOBILE_API_URL?.replace(/\/$/, '')) ||
  'http://127.0.0.1:4001'

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let tokenGetter: (() => string | null) | null = null

/** Registered by authStore so mobileFetch can attach Bearer without circular imports. */
export function setAuthTokenGetter(getter: () => string | null): void {
  tokenGetter = getter
}

export async function mobileFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${MOBILE_API_BASE}${path.startsWith('/') ? path : `/${path}`}`
  const token = tokenGetter?.() ?? null
  const res = await fetch(url, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  })
  const text = await res.text()
  let body: unknown = null
  if (text) {
    try {
      body = JSON.parse(text) as unknown
    } catch {
      body = { message: text }
    }
  }
  if (!res.ok) {
    const message =
      body &&
      typeof body === 'object' &&
      'message' in body &&
      typeof (body as { message: unknown }).message === 'string'
        ? (body as { message: string }).message
        : `Request failed (${res.status})`
    throw new ApiError(res.status, message)
  }
  return body as T
}
