import { create } from 'zustand'
import type { FilterState, GasType } from '@/types'

interface AppStore {
  filters: FilterState
  setYear: (year: number) => void
  setGas: (gas: GasType) => void
  setRegion: (regionId: string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  filters: {
    year: 2023,
    gas: 'total',
    regionId: null,
  },
  setYear: (year) => set((s) => ({ filters: { ...s.filters, year } })),
  setGas: (gas) => set((s) => ({ filters: { ...s.filters, gas } })),
  setRegion: (regionId) => set((s) => ({ filters: { ...s.filters, regionId } })),
}))
