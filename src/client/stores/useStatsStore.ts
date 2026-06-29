import { create } from 'zustand'
import type { StatsOverview } from '../services/stats'

interface StatsState {
  last7Days: StatsOverview | null
  last30Days: StatsOverview | null
  loading: boolean
  setStats: (last7Days: StatsOverview, last30Days: StatsOverview) => void
  setLoading: (loading: boolean) => void
}

export const useStatsStore = create<StatsState>((set) => ({
  last7Days: null,
  last30Days: null,
  loading: false,
  setStats: (last7Days, last30Days) => set({ last7Days, last30Days }),
  setLoading: (loading) => set({ loading }),
}))