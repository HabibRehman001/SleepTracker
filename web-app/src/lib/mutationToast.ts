import { toast } from 'sonner'

/** Clear user-facing message for mutation failures (Step 110). */
export function mutationErrorMessage(
  err: unknown,
  fallback = 'Something went wrong'
): string {
  if (err instanceof Error && err.message.trim()) {
    return err.message
  }
  return fallback
}

export function toastMutationSuccess(message: string): void {
  toast.success(message)
}

export function toastMutationError(
  err: unknown,
  fallback = 'Something went wrong'
): void {
  toast.error(mutationErrorMessage(err, fallback))
}
