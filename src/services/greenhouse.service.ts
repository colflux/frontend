import { MOCK_EMISSIONS, REGIONS, AVAILABLE_YEARS } from '@/data/mockData'
import type { EmissionRecord, Region, FilterState, TrendPoint } from '@/types'

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? ''

// ── mock helpers ──────────────────────────────────────────────────

function filterMock(filters: Partial<FilterState>): EmissionRecord[] {
  return MOCK_EMISSIONS.filter((e) => {
    if (filters.year && e.year !== filters.year) return false
    if (filters.gas && filters.gas !== 'total' && e.gas !== filters.gas) return false
    if (filters.regionId && e.regionId !== filters.regionId) return false
    return true
  })
}

// ── API fetch helper (ready when the real API is available) ───────

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`)
  return res.json() as Promise<T>
}

// ── public service ────────────────────────────────────────────────

export const greenhouseService = {
  getRegions: (): Promise<Region[]> => {
    if (USE_MOCK) return Promise.resolve(REGIONS)
    return apiFetch<Region[]>('/regions')
  },

  getEmissions: (filters: Partial<FilterState>): Promise<EmissionRecord[]> => {
    if (USE_MOCK) return Promise.resolve(filterMock(filters))
    const params = new URLSearchParams(
      Object.entries(filters)
        .filter(([, v]) => v != null)
        .map(([k, v]) => [k, String(v)])
    )
    return apiFetch<EmissionRecord[]>(`/emissions?${params}`)
  },

  getTrend: (regionId?: string): Promise<TrendPoint[]> => {
    if (USE_MOCK) {
      const points = AVAILABLE_YEARS.map((year) => {
        const records = filterMock({ year, regionId: regionId ?? undefined })
        const sum = (gas: string) =>
          records.filter((r) => r.gas === gas).reduce((a, r) => a + r.value, 0)
        const co2 = sum('CO2')
        const ch4 = sum('CH4')
        const n2o = sum('N2O')
        return {
          year,
          CO2: parseFloat(co2.toFixed(2)),
          CH4: parseFloat(ch4.toFixed(2)),
          N2O: parseFloat(n2o.toFixed(2)),
          total: parseFloat((co2 + ch4 + n2o).toFixed(2)),
        }
      })
      return Promise.resolve(points)
    }
    const query = regionId ? `?regionId=${regionId}` : ''
    return apiFetch<TrendPoint[]>(`/emissions/trend${query}`)
  },
}
