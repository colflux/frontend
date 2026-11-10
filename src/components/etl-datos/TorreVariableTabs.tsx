// Mismos códigos que MuestraTorre.TIPO_VARIABLE_CHOICES en el backend
// (app/models/torre.py) — si se agrega una variable nueva ahí, agregarla acá también.
export const VARIABLES_TORRE: { value: string; label: string }[] = [
  { value: 'co2_flux', label: 'Flujo de CO₂' },
  { value: 'ch4_flux', label: 'Flujo de CH₄' },
  { value: 'h2o_flux', label: 'Flujo de H₂O' },
  { value: 'h_flux', label: 'Calor sensible (H)' },
  { value: 'le_flux', label: 'Calor latente (LE)' },
  { value: 'tau', label: 'Esfuerzo cortante (Tau)' },
  { value: 'ustar', label: 'Velocidad de fricción (u*)' },
  { value: 'tke', label: 'Energía cinética turbulenta (TKE)' },
  { value: 'monin_obukhov_length', label: 'Longitud de Monin-Obukhov (L)' },
  { value: 'bowen_ratio', label: 'Razón de Bowen' },
  { value: 'footprint_x_peak', label: 'Footprint x_peak' },
  { value: 'footprint_x_70', label: 'Footprint x_70%' },
  { value: 'footprint_x_90', label: 'Footprint x_90%' },
  { value: 'air_temperature', label: 'Temperatura del aire' },
  { value: 'air_pressure', label: 'Presión atmosférica' },
  { value: 'relative_humidity', label: 'Humedad relativa' },
  { value: 'vpd', label: 'Déficit de presión de vapor (VPD)' },
  { value: 'air_density', label: 'Densidad del aire' },
  { value: 'wind_speed', label: 'Velocidad del viento' },
  { value: 'wind_dir', label: 'Dirección del viento' },
  { value: 'nee_f', label: 'NEE con gap-filling' },
  { value: 'reco', label: 'Respiración del ecosistema (Reco)' },
  { value: 'gpp_f', label: 'Productividad primaria bruta (GPP)' },
  { value: 'ustar_used', label: 'Umbral de u* usado en el filtrado' },
]

const LABEL_POR_VALOR = new Map(VARIABLES_TORRE.map((v) => [v.value, v.label]))

interface Props {
  value: string
  onChange: (value: string) => void
  // Valores de `tipo_variable` que de verdad existen en la carga actual
  // (ver `facetas` en DatosProyectoResponse) — si todavía no llegaron,
  // no se muestra ninguna pestaña de variable.
  disponibles: string[]
}

export function TorreVariableTabs({ value, onChange, disponibles }: Props) {
  if (!disponibles.length) return null

  return (
    <div data-tour="etl-tabs-variable" className="flex gap-1.5 flex-wrap -mt-1">
      <button
        type="button"
        onClick={() => onChange('')}
        className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
          value === ''
            ? 'text-brand-teal-dark dark:text-brand-teal-bright bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal'
            : 'text-fg-muted bg-panel border-border hover:text-fg'
        }`}
      >
        Todas
      </button>
      {disponibles.map((valor) => (
        <button
          key={valor}
          type="button"
          onClick={() => onChange(valor)}
          className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
            value === valor
              ? 'text-brand-teal-dark dark:text-brand-teal-bright bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal'
              : 'text-fg-muted bg-panel border-border hover:text-fg'
          }`}
        >
          {LABEL_POR_VALOR.get(valor) ?? valor}
        </button>
      ))}
    </div>
  )
}
