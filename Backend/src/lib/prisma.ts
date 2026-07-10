import path from 'node:path'
import { config } from 'dotenv'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import { PrismaClient } from '../../generated/prisma/client'

// Always load Backend/.env regardless of process cwd (tests/tsx may run elsewhere)
config({ path: path.resolve(__dirname, '../../.env') })

const absoluteDbPath = path.resolve(__dirname, '../../dev.db')
const url = `file:${absoluteDbPath}`

const adapter = new PrismaBetterSqlite3({ url })

export const prisma = new PrismaClient({ adapter })
