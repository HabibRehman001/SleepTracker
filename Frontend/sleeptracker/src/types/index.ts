export type User = {
  _id: string
  name: string
  email: string
  createdAt?: string
  updatedAt?: string
}

export type AuthResponse = User & {
  token: string
}

export type SleepEntry = {
  _id: string
  userId: string
  sleepStart: string
  sleepEnd: string
  quality?: number
  notes?: string
  createdAt?: string
  updatedAt?: string
}
