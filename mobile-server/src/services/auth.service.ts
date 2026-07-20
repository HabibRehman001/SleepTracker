import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import type { Types } from 'mongoose'

import { User, type UserDoc } from '../models/User'

const JWT_SECRET = process.env.JWT_SECRET ?? 'sleep-lock-dev-secret-change-me'
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '30d'
const SALT_ROUNDS = 10

export type AuthTokenPayload = {
  sub: string
  email: string
}

export type PublicUser = {
  id: string
  email: string
  name: string
}

function toPublic(user: UserDoc): PublicUser {
  return {
    id: String(user._id),
    email: user.email,
    name: user.name ?? '',
  }
}

export function signToken(userId: Types.ObjectId | string, email: string): string {
  const payload: AuthTokenPayload = {
    sub: String(userId),
    email,
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  })
}

export function verifyToken(token: string): AuthTokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET)
  if (
    typeof decoded !== 'object' ||
    decoded === null ||
    typeof decoded.sub !== 'string' ||
    typeof decoded.email !== 'string'
  ) {
    throw new Error('Invalid token')
  }
  return { sub: decoded.sub, email: decoded.email }
}

export async function signup(
  email: string,
  password: string,
  name?: string
): Promise<{ user: PublicUser; token: string }> {
  const normalized = email.trim().toLowerCase()
  if (!normalized || !password || password.length < 6) {
    const err = new Error('Email and password (min 6 chars) are required')
    ;(err as Error & { status: number }).status = 400
    throw err
  }

  const existing = await User.findOne({ email: normalized }).lean()
  if (existing) {
    const err = new Error('An account with this email already exists')
    ;(err as Error & { status: number }).status = 409
    throw err
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)
  const user = await User.create({
    email: normalized,
    passwordHash,
    name: name?.trim() ?? '',
  })

  return {
    user: toPublic(user),
    token: signToken(user._id, user.email),
  }
}

export async function login(
  email: string,
  password: string
): Promise<{ user: PublicUser; token: string }> {
  const normalized = email.trim().toLowerCase()
  const user = await User.findOne({ email: normalized })
  if (!user) {
    const err = new Error('Invalid email or password')
    ;(err as Error & { status: number }).status = 401
    throw err
  }

  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    const err = new Error('Invalid email or password')
    ;(err as Error & { status: number }).status = 401
    throw err
  }

  return {
    user: toPublic(user),
    token: signToken(user._id, user.email),
  }
}

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await User.findById(id)
  return user ? toPublic(user) : null
}
