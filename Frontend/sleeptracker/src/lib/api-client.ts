const BASE = 'http://localhost:4000/api'

async function parseJson<T>(r: Response): Promise<T> {
  if (r.status === 204) {
    return undefined as T
  }
  return r.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) =>
    fetch(`${BASE}${path}`).then((r) => parseJson<T>(r)),

  put: <T>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => parseJson<T>(r)),

  post: <T>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => parseJson<T>(r)),

  delete: <T = void>(path: string) =>
    fetch(`${BASE}${path}`, { method: 'DELETE' }).then((r) => parseJson<T>(r)),
}
