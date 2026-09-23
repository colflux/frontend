import { create } from 'zustand'
import type { Proyecto } from '@/types'

interface ProyectoDrawerStore {
  open: boolean
  editingProyecto: Proyecto | null
  openDrawer: (options?: { proyecto?: Proyecto }) => void
  closeDrawer: () => void
}

export const useProyectoDrawerStore = create<ProyectoDrawerStore>((set) => ({
  open: false,
  editingProyecto: null,
  openDrawer: ({ proyecto = undefined } = {}) => set({ open: true, editingProyecto: proyecto ?? null }),
  closeDrawer: () => set({ open: false, editingProyecto: null }),
}))
