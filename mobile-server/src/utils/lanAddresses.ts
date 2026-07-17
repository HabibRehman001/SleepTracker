import { networkInterfaces } from 'node:os'

/** Non-internal IPv4 addresses suitable for phone → home-server URLs. */
export function listLanIPv4(): string[] {
  const nets = networkInterfaces()
  const out: string[] = []
  for (const entries of Object.values(nets)) {
    if (!entries) continue
    for (const entry of entries) {
      if (entry.internal) continue
      // Node typings use string 'IPv4' | 'IPv6'; older runtimes used numeric 4 | 6
      const family = String(entry.family)
      if (family !== 'IPv4' && family !== '4') continue
      out.push(entry.address)
    }
  }
  return out
}
