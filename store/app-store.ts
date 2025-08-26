"use client"
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

type UserMeta = {
  userId?: string
  fullName?: string
  email?: string
  avatarUrl?: string
  plan?: string
  credits?: number
}

type AppState = {
  version: number
  expiresAt?: number
  user: UserMeta
  lastConversationId?: string
  lastVisitedRoute?: string
  sidebarOpen?: boolean
  sidebarWidth?: number // Resizable sidebar width percentage
  setUser: (user: Partial<UserMeta>) => void
  setLastConversationId: (id: string | undefined) => void
  setLastVisitedRoute: (path: string) => void
  setSidebarOpen: (open: boolean) => void
  setSidebarWidth: (w: number) => void
  reset: () => void
}

const STORE_VERSION = 1
const TTL_MS = 1000 * 60 * 60 * 6 // 6h

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      version: STORE_VERSION,
      expiresAt: Date.now() + TTL_MS,
      user: {},
      lastConversationId: undefined,
      lastVisitedRoute: undefined,
      sidebarOpen: true,
      sidebarWidth: 22,
      setUser: (user) => set((s) => ({ user: { ...s.user, ...user } })),
      setLastConversationId: (id) => set({ lastConversationId: id }),
      setLastVisitedRoute: (path) => set({ lastVisitedRoute: path }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setSidebarWidth: (w) => set({ sidebarWidth: w }),
      reset: () => set({
        version: STORE_VERSION,
        expiresAt: Date.now() + TTL_MS,
        user: {},
        lastConversationId: undefined,
        lastVisitedRoute: undefined,
        sidebarOpen: true,
        sidebarWidth: 22,
      }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      version: STORE_VERSION,
      migrate: (state: any, version) => {
        // simple forward migration
        return { ...state, version: STORE_VERSION }
      },
      partialize: (state) => ({
        version: state.version,
        expiresAt: state.expiresAt,
        user: state.user,
        lastConversationId: state.lastConversationId,
        lastVisitedRoute: state.lastVisitedRoute,
        sidebarOpen: state.sidebarOpen,
        sidebarWidth: state.sidebarWidth,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return
        if (!state.expiresAt || state.expiresAt < Date.now()) {
          // TTL expired: reset
          state.reset()
        }
      },
    }
  )
)


