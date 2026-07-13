const BASE = 'http://localhost:4000/api'

export const api = {
  get: <T>(path: string) =>
    fetch(`${BASE}${path}`).then((r) => r.json() as Promise<T>),

  put: <T>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json() as Promise<T>),

  post: <T>(path: string, body: unknown) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then((r) => r.json() as Promise<T>),
}
