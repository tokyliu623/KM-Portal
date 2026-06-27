import { create } from 'zustand'
import type { StatsData } from '../services/stats'

interface StatsState {
  last7Days: StatsData | null
  last30Days: StatsData | null
  loading: boolean
  setStats: (last7Days: StatsData, last30Days: StatsData) => void
  setLoading: (loading: boolean) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  last7Days: null,
  last30Days: null,
  loading: false,
  setStats: (last7Days, last30Days) => set({ last7Days, last30Days }),
  setLoading: (loading) => set({ loading }),
}))