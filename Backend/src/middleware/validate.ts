import { NextFunction, Request, Response } from 'express'
import type { ZodType } from 'zod'
import { ValidationError } from './errorMiddleware'

export const validateBody =
  <T>(schema: ZodType<T>) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body)

    if (!result.success) {
      return next(new ValidationError(result.error))
    }

    req.body = result.data
    return next()
  }
