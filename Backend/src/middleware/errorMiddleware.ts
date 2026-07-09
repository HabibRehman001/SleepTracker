import { NextFunction, Request, Response } from 'express'
import { ZodError } from 'zod'

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 500) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}

export class ValidationError extends AppError {
  details: Array<{ path: string; message: string }>

  constructor(error: ZodError) {
    const details = error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join('.') : 'body',
      message: issue.message,
    }))

    const summary = details
      .map((detail) => `${detail.path}: ${detail.message}`)
      .join('; ')

    super(`Validation failed: ${summary}`, 400)
    this.name = 'ValidationError'
    this.details = details
  }
}

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Not Found - ${req.originalUrl}`, 404))
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err instanceof AppError ? err.statusCode : 500

  res.status(statusCode).json({
    message: err.message,
    ...(err instanceof ValidationError ? { details: err.details } : {}),
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  })
}
