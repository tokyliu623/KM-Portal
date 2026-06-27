import { create } from 'zustand'
import type { KMToken } from '../services/admin'

interface TokenState {
  tokens: KMToken[]
  loading: boolean
  setTokens: (tokens: KMToken[]) => void
  setLoading: (loading: boolean) => void
  addToken: (token: KMToken) => void
  removeToken: (id: string) => void
}

export const useTokenStore = create<TokenState>((set) => ({
  tokens: [],
  loading: false,
  setTokens: (tokens) => set({ tokens }),
  setLoading: (loading) => set({ loading }),
  addToken: (token) => set((state) => ({ tokens: [...state.tokens, token] })),
  removeToken: (id) => set((state) => ({ tokens: state.tokens.filter((t) => t.id !== id) })),
}))