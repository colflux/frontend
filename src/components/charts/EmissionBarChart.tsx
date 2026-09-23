import { useMemo } from 'react'
import { CategoricalChart } from '@/components/charts/CategoricalChart'
import { useAppStore } from '@/store/useAppStore'
import { useFlujosFiltros } from '@/hooks/useGlobalFilters'
import type { GeoResumenFilters } from '@/types'

export function EmissionBarChart() {
  const { filters, setProyecto } = useAppStore()
  const flujosFiltros = useFlujosFiltros()
  // "proyecto" no se manda como filtro: es la dimensión que agrupa este
  // gráfico -filtrar por el proyecto ya seleccionado colapsaría la barra a
  // una sola-. selectedId/onSelect ya cubren esa selección como resaltado.
  const filtrosSinProyecto = useMemo<GeoResumenFilters>(() => {
    const f = { ...flujosFiltros }
    delete f.proyecto
    return f
  }, [flujosFiltros])

  return (
    <CategoricalChart
      dimension="proyecto"
      tipo="barras"
      alturaPx={180}
      filters={filtrosSinProyecto}
      selectedId={filters.proyectoId}
      onSelect={(id) => setProyecto(id === filters.proyectoId ? null : (id as number))}
    />
  )
}
