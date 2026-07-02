import { useState } from 'react'
import { GeoMap } from '@/components/map/GeoMap'
import { EmissionBarChart } from '@/components/charts/EmissionBarChart'
import { EmissionTrendChart } from '@/components/charts/EmissionTrendChart'
import { FilterPanel } from '@/features/filters/FilterPanel'
import { EmissionSummary } from '@/features/greenhouse/EmissionSummary'
import { Card } from '@/components/common/Card'

export function Dashboard() {
  const [trendOpen, setTrendOpen] = useState(true)

  return (
    <div className="flex h-[calc(100vh-56px)]">
      {/* ── panel izquierdo ───────────────────────────── */}
      <aside className="w-[380px] min-w-[380px] bg-panel border-r border-border overflow-y-auto flex flex-col gap-4 p-4">
        <Card title="Filtros">
          <FilterPanel />
        </Card>

        <Card title="Resumen">
          <EmissionSummary />
        </Card>

        <Card title="Por departamento">
          <EmissionBarChart />
        </Card>
      </aside>

      {/* ── mapa + tendencia ──────────────────────────── */}
      <div className="relative flex-1">
        <GeoMap />

        {/* panel de tendencia colapsable */}
        <div className="absolute bottom-0 left-0 right-0 bg-panel/90 backdrop-blur-sm border-t border-border">
          <button
            onClick={() => setTrendOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <span className="font-semibold uppercase tracking-wider">
              Tendencia histórica (MtCO₂e)
            </span>
            <span className="text-base">{trendOpen ? '▼' : '▲'}</span>
          </button>

          {trendOpen && (
            <div className="px-4 pb-4">
              <EmissionTrendChart />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
