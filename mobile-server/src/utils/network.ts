/**
 * Step 131 — private / loopback address checks (LAN-only API).
 */

/** Strip IPv4-mapped IPv6 prefix (`::ffff:192.168.1.1` → `192.168.1.1`). */
export function normalizeIp(raw: string): string {
  const trimmed = raw.trim().replace(/^\[|\]$/g, '')
  if (trimmed.toLowerCase().startsWith('::ffff:')) {
    return trimmed.slice(7)
  }
  return trimmed
}

/**
 * True for loopback, RFC1918, link-local, and IPv6 ULA / link-local.
 * Public internet addresses return false.
 */
export function isPrivateOrLocalIp(ip: string): boolean {
  const n = normalizeIp(ip).toLowerCase()
  if (!n || n === 'unknown') return false

  if (n === '::1' || n === '127.0.0.1' || n.startsWith('127.')) return true
  if (n.startsWith('10.')) return true
  if (n.startsWith('192.168.')) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(n)) return true
  if (n.startsWith('169.254.')) return true
  if (n.startsWith('fe80:')) return true
  if (n.startsWith('fc') || n.startsWith('fd')) return true

  return false
}
