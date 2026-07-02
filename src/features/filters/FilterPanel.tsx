import { Select } from '@/components/common/Select'
import { useAppStore } from '@/store/useAppStore'
import { useRegions } from '@/hooks/useGreenhouseData'
import { AVAILABLE_YEARS } from '@/data/mockData'
import { GAS_LABELS } from '@/utils/formatters'
import type { GasType } from '@/types'

const GAS_OPTIONS: { value: GasType; label: string }[] = [
  { value: 'total', label: GAS_LABELS.total },
  { value: 'CO2', label: GAS_LABELS.CO2 },
  { value: 'CH4', label: GAS_LABELS.CH4 },
  { value: 'N2O', label: GAS_LABELS.N2O },
]

export function FilterPanel() {
  const { filters, setYear, setGas, setRegion } = useAppStore()
  const { data: regions = [] } = useRegions()

  const regionOptions = [
    { value: '', label: 'Todos los departamentos' },
    ...regions.map((r) => ({ value: r.id, label: r.name })),
  ]

  return (
    <div className="flex flex-col gap-4">
      <Select
        label="Año"
        value={String(filters.year)}
        options={AVAILABLE_YEARS.map((y) => ({ value: String(y), label: String(y) }))}
        onChange={(v) => setYear(Number(v))}
      />
      <Select
        label="Gas"
        value={filters.gas}
        options={GAS_OPTIONS}
        onChange={(v) => setGas(v as GasType)}
      />
      <Select
        label="Departamento"
        value={filters.regionId ?? ''}
        options={regionOptions}
        onChange={(v) => setRegion(v || null)}
      />
    </div>
  )
}
