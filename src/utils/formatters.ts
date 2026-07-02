export const formatMtCO2e = (value: number): string =>
  `${value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} MtCO₂e`

export const GAS_COLORS: Record<string, string> = {
  CO2: '#22c55e',
  CH4: '#f59e0b',
  N2O: '#3b82f6',
  total: '#22c55e',
}

export const GAS_LABELS: Record<string, string> = {
  CO2: 'CO₂ — Dióxido de carbono',
  CH4: 'CH₄ — Metano',
  N2O: 'N₂O — Óxido nitroso',
  total: 'Todos los gases',
}
