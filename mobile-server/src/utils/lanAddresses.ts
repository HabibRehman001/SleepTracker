import { networkInterfaces } from 'node:os'

/** Non-internal IPv4 addresses suitable for phone → home-server URLs. */
export function listLanIPv4(): string[] {
  const nets = networkInterfaces()
  const out: string[] = []
  for (const entries of Object.values(nets)) {
    if (!entries) continue
    for (const entry of entries) {
      if (entry.internal) continue
      if (entry.family !== 'IPv4' && entry.family !== 4) continue
      // Prefer home Wi-Fi / ethernet; still list docker bridges for visibility
      out.push(entry.address)
    }
  }
  return out
}
