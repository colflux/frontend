export const GAS_COLORS: Record<string, string> = {
  CO2: '#198A77',
  CH4: '#DF5B26',
  N2O: '#57270F',
}

// Paleta general para gráficas categóricas (torta/barras) sin un color de
// dominio propio (proyecto, ecosistema, estado de conservación, …).
export const PIE_COLORS = ['#198A77', '#739E5B', '#F2B91B', '#DF5B26', '#57270F', '#94a3b8']

export const GAS_LABELS: Record<string, string> = {
  CO2: 'CO₂ — Dióxido de carbono',
  CH4: 'CH₄ — Metano',
  N2O: 'N₂O — Óxido nitroso (próximamente)',
}

export const UNIDAD_LABELS: Record<string, string> = {
  g_m2_h: 'g/m²/h',
  umol_m2_s: 'µmol/m²/s',
  nmol_m2_s: 'nmol/m²/s',
}

export const formatUnidad = (unidad: string): string => UNIDAD_LABELS[unidad] ?? unidad

export const formatValor = (valor: number | null, unidad: string): string =>
  valor == null
    ? 'Sin datos'
    : `${valor.toLocaleString('es-CO', { maximumFractionDigits: 3 })} ${formatUnidad(unidad)}`
