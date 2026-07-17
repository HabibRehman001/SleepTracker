const BASE = 'http://localhost:4000/api'

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function readErrorMessage(r: Response): Promise<string> {
  try {
    const body = (await r.json()) as { message?: string }
    if (body?.message && typeof body.message === 'string') {
      return body.message
    }
  } catch {
    // ignore non-JSON error bodies
  }
  if (r.status >= 500) return 'Server error — try again'
  if (r.status === 404) return 'Not found'
  if (r.status === 400) return 'Invalid request'
  return `Request failed (${r.status})`
}

async function parseJson<T>(r: Response): Promise<T> {
  if (!r.ok) {
    throw new ApiError(await readErrorMessage(r), r.status)
  }
  if (r.status === 204) {
    return undefined as T
  }
  return r.json() as Promise<T>
}

function networkError(err: unknown): never {
  if (err instanceof ApiError) throw err
  const message =
    err instanceof TypeError ||
    (err instanceof Error && /failed to fetch|networkerror|load failed/i.test(err.message))
      ? 'Cannot reach the server — is the backend running?'
      : err instanceof Error
        ? err.message
        : 'Request failed'
  throw new Error(message)
}

async function request<T>(fn: () => Promise<Response>): Promise<T> {
  try {
    const r = await fn()
    return await parseJson<T>(r)
  } catch (err) {
    networkError(err)
  }
}

export const api = {
  get: <T>(path: string) =>
    request<T>(() => fetch(`${BASE}${path}`)),

  put: <T>(path: string, body: unknown) =>
    request<T>(() =>
      fetch(`${BASE}${path}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ),

  post: <T>(path: string, body: unknown) =>
    request<T>(() =>
      fetch(`${BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    ),

  delete: <T = void>(path: string) =>
    request<T>(() => fetch(`${BASE}${path}`, { method: 'DELETE' })),
}
