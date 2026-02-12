'use client'
import { create } from 'zustand'

type UiState = {
  isSidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUiState = create<UiState>(set => ({
  isSidebarOpen: false,
  setSidebarOpen: open => set({ isSidebarOpen: open }),
  toggleSidebar: () => set(state => ({ isSidebarOpen: !state.isSidebarOpen }))
}))
