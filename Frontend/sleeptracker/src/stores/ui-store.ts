import { format } from 'date-fns'
import { create } from 'zustand'

/**
 * Ephemeral UI state only.
 * Server data stays in TanStack Query — never duplicate entries/stats here.
 */
type UiState = {
  selectedDate: string
  setSelectedDate: (d: string) => void

  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void

  quickLogOpen: boolean
  setQuickLogOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  selectedDate: format(new Date(), 'yyyy-MM-dd'),
  setSelectedDate: (d) => set({ selectedDate: d }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  quickLogOpen: false,
  setQuickLogOpen: (open) => set({ quickLogOpen: open }),
}))
