import { useEmissions, useRegions } from '@/hooks/useGreenhouseData'
import { useAppStore } from '@/store/useAppStore'
import { formatMtCO2e, GAS_COLORS } from '@/utils/formatters'
import { Badge } from '@/components/common/Badge'

const GAS_LIST = ['CO2', 'CH4', 'N2O'] as const

export function EmissionSummary() {
  const { data: emissions = [] } = useEmissions()
  const { data: regions = [] } = useRegions()
  const { filters } = useAppStore()

  const total = emissions.reduce((a, e) => a + e.value, 0)
  const byGas = GAS_LIST.map((gas) => ({
    gas,
    value: emissions.filter((e) => e.gas === gas).reduce((a, e) => a + e.value, 0),
  }))

  const selectedRegion = filters.regionId
    ? regions.find((r) => r.id === filters.regionId)
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">
          {selectedRegion ? selectedRegion.name : 'Nacional'} · {filters.year}
        </span>
        {selectedRegion && <Badge label={selectedRegion.name} color={GAS_COLORS.CO2} />}
      </div>

      <div className="bg-surface rounded-md p-3 text-center border border-border">
        <p className="text-2xl font-bold text-white">{formatMtCO2e(total)}</p>
        <p className="text-xs text-slate-400 mt-1">emisiones totales</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {byGas.map(({ gas, value }) => (
          <div key={gas} className="bg-surface rounded-md p-2 text-center border border-border">
            <p className="text-xs font-semibold mb-1" style={{ color: GAS_COLORS[gas] }}>
              {gas}
            </p>
            <p className="text-sm font-bold text-white">{value.toFixed(1)}</p>
            <p className="text-xs text-slate-500">MtCO₂e</p>
          </div>
        ))}
      </div>
    </div>
  )
}
