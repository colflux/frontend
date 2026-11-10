import { create } from 'zustand'
import type { FuenteDatos, MetodologiaFuente } from '@/types'

// Submecanismo elegido en la card de "Flujos" en Participacion.tsx (único
// caso con más de una fuente física por metodología: cámaras GEI vs. torre
// EC/Eddypro) — determina si el drawer debe saltarse el adjunto de archivo
// genérico y mandar al usuario directo al wizard torre-aware de EtlUpload.
export type FuenteTipoContext = 'equipo' | 'torre' | null

interface FuenteDrawerStore {
  open: boolean
  editingFuente: FuenteDatos | null
  proyectoContextId: number | null
  metodologiaContext: MetodologiaFuente | null
  fuenteTipoContext: FuenteTipoContext
  openDrawer: (options?: {
    fuente?: FuenteDatos
    proyectoContextId?: number | null
    metodologiaContext?: MetodologiaFuente | null
    fuenteTipoContext?: FuenteTipoContext
  }) => void
  closeDrawer: () => void
}

export const useFuenteDrawerStore = create<FuenteDrawerStore>((set) => ({
  open: false,
  editingFuente: null,
  proyectoContextId: null,
  metodologiaContext: null,
  fuenteTipoContext: null,
  openDrawer: ({
    fuente = undefined,
    proyectoContextId = null,
    metodologiaContext = null,
    fuenteTipoContext = null,
  } = {}) =>
    set({ open: true, editingFuente: fuente ?? null, proyectoContextId, metodologiaContext, fuenteTipoContext }),
  closeDrawer: () =>
    set({
      open: false,
      editingFuente: null,
      proyectoContextId: null,
      metodologiaContext: null,
      fuenteTipoContext: null,
    }),
}))
