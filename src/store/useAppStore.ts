import { create } from 'zustand'
import type { DimensionBiomasa, FilterState, GasType, GeoDrillEntity, MapViewMode, Metodologia } from '@/types'

interface AppStore {
  filters: FilterState
  setYear: (year: number | null) => void
  setGas: (gas: GasType) => void
  setProyecto: (proyectoId: number | null) => void

  // Metodología elegida en el panel de filtros: controla qué recuadro de
  // filtros condicionales (Biomasa/COS/Flujos) se muestra.
  metodologia: Metodologia
  setMetodologia: (metodologia: Metodologia) => void

  // Drill-down geográfico compartido entre el panel de filtros y el mapa
  // (región → departamento → municipio → vereda), para que ambos queden sincronizados.
  mapViewMode: MapViewMode
  region: GeoDrillEntity | null
  departamento: GeoDrillEntity | null
  municipio: GeoDrillEntity | null
  vereda: GeoDrillEntity | null
  setMapViewMode: (mode: MapViewMode) => void
  setRegion: (region: GeoDrillEntity | null) => void
  setDepartamento: (departamento: GeoDrillEntity | null) => void
  setMunicipio: (municipio: GeoDrillEntity | null) => void
  setVereda: (vereda: GeoDrillEntity | null) => void
  resetDrill: () => void

  // Filtros condicionales por metodología (recuadro que aparece según
  // `metodologia`). Se resetean al cambiar de metodología.
  biomasaDimension: DimensionBiomasa
  setBiomasaDimension: (dimension: DimensionBiomasa) => void
  cosProfundidad: string | null
  setCosProfundidad: (rango: string | null) => void
  flujosAnalizadorId: number | string | null
  setFlujosAnalizadorId: (id: number | string | null) => void
  flujosCondicionLuzId: number | string | null
  setFlujosCondicionLuzId: (id: number | string | null) => void
}

export const useAppStore = create<AppStore>((set) => ({
  filters: {
    year: null,
    gas: 'CO2',
    proyectoId: null,
  },
  setYear: (year) => set((s) => ({ filters: { ...s.filters, year } })),
  setGas: (gas) => set((s) => ({ filters: { ...s.filters, gas } })),
  setProyecto: (proyectoId) => set((s) => ({ filters: { ...s.filters, proyectoId } })),

  metodologia: 'general',
  // Cambiar de metodología descarta los filtros condicionales de la anterior,
  // que dejan de ser visibles/aplicables.
  setMetodologia: (metodologia) =>
    set({
      metodologia,
      biomasaDimension: 'familia',
      cosProfundidad: null,
      flujosAnalizadorId: null,
      flujosCondicionLuzId: null,
    }),

  mapViewMode: 'sitios',
  region: null,
  departamento: null,
  municipio: null,
  vereda: null,
  setMapViewMode: (mapViewMode) => set({ mapViewMode }),
  // Elegir una región/departamento/municipio nuevo descarta la selección de
  // los niveles hijos, que ya no aplican.
  setRegion: (region) =>
    set({ region, departamento: null, municipio: null, vereda: null, mapViewMode: 'regiones' }),
  setDepartamento: (departamento) =>
    set({ departamento, municipio: null, vereda: null, mapViewMode: 'regiones' }),
  setMunicipio: (municipio) => set({ municipio, vereda: null, mapViewMode: 'regiones' }),
  setVereda: (vereda) => set({ vereda, mapViewMode: 'regiones' }),
  resetDrill: () => set({ region: null, departamento: null, municipio: null, vereda: null }),

  biomasaDimension: 'familia',
  setBiomasaDimension: (biomasaDimension) => set({ biomasaDimension }),
  cosProfundidad: null,
  setCosProfundidad: (cosProfundidad) => set({ cosProfundidad }),
  flujosAnalizadorId: null,
  setFlujosAnalizadorId: (flujosAnalizadorId) => set({ flujosAnalizadorId }),
  flujosCondicionLuzId: null,
  setFlujosCondicionLuzId: (flujosCondicionLuzId) => set({ flujosCondicionLuzId }),
}))
