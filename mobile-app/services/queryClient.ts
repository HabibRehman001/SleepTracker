import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client for mobile-app (Step 120). */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
})
