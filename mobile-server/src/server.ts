import 'dotenv/config'
import mongoose from 'mongoose'
import app from './app'
import { listLanIPv4 } from './utils/lanAddresses'

const PORT = Number(process.env.PORT) || 4001
/** 0.0.0.0 = all interfaces (phone on Wi-Fi). 127.0.0.1 = this machine only. */
const HOST = process.env.HOST?.trim() || '0.0.0.0'
const MONGODB_URI =
  process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/sleep-lock'

async function main() {
  await mongoose.connect(MONGODB_URI)
  console.log(`MongoDB connected: ${MONGODB_URI}`)

  app.listen(PORT, HOST, () => {
    const allowPublic =
      process.env.ALLOW_PUBLIC === 'true' || process.env.ALLOW_PUBLIC === '1'
    console.log(
      `mobile-server ${process.env.NODE_ENV ?? 'development'} listening on http://${HOST}:${PORT}`
    )
    console.log(
      allowPublic
        ? 'ALLOW_PUBLIC=true — WAN clients are permitted (not recommended)'
        : 'LAN-only: private/loopback clients accepted; public IPs → 403'
    )
    console.log('Local:  http://127.0.0.1:' + PORT + '/api/health')
    for (const ip of listLanIPv4()) {
      console.log(`LAN:    http://${ip}:${PORT}/api/health`)
    }
    console.log(
      'Phone on same Wi-Fi: use a LAN URL above. Cellular cannot reach private IPs (unless you port-forward — do not).'
    )
  })
}

main().catch((err) => {
  console.error('mobile-server failed to start:', err)
  process.exit(1)
})
