import { CategoricalChart } from '@/components/charts/CategoricalChart'
import { useAppStore } from '@/store/useAppStore'

export function EmissionBarChart() {
  const { filters, setProyecto } = useAppStore()

  return (
    <CategoricalChart
      dimension="proyecto"
      tipo="barras"
      alturaPx={180}
      filters={{ gas: filters.gas, anio: filters.year ?? undefined }}
      selectedId={filters.proyectoId}
      onSelect={(id) => setProyecto(id === filters.proyectoId ? null : (id as number))}
    />
  )
}
