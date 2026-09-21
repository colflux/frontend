export interface TabDef {
  id: string
  label: string
  vista: 'submuestra_gei' | 'unidad_muestreo' | 'clima' | 'mom' | 'cos' | 'biomasa'
  gas: 'CO2' | 'CH4' | null
}

// CO₂/CH₄ son la vista "submuestra_gei" con un filtro de gas fijo, no una
// vista aparte — la exportación del backend (_HOJAS_EXPORT) usa la misma
// partición.
export const TABS: TabDef[] = [
  { id: 'unidad_muestreo', label: 'Unidad de Muestreo / Experimental', vista: 'unidad_muestreo', gas: null },
  { id: 'CO2', label: 'CO₂', vista: 'submuestra_gei', gas: 'CO2' },
  { id: 'CH4', label: 'CH₄', vista: 'submuestra_gei', gas: 'CH4' },
  { id: 'clima', label: 'Clima', vista: 'clima', gas: null },
  { id: 'mom', label: 'MOM', vista: 'mom', gas: null },
  { id: 'cos', label: 'COS', vista: 'cos', gas: null },
  { id: 'biomasa', label: 'Biomasa', vista: 'biomasa', gas: null },
]

interface Props {
  activeId: string
  onChange: (tabId: string) => void
}

export function DatosTabs({ activeId, onChange }: Props) {
  return (
    <div data-tour="etl-tabs" className="flex gap-1.5 flex-wrap">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`px-4 py-2 text-sm font-semibold rounded-t-lg border border-b-0 transition-colors ${
            t.id === activeId
              ? 'text-brand-teal-dark dark:text-brand-teal-bright bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal'
              : 'text-fg-muted bg-panel border-border hover:text-fg'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
