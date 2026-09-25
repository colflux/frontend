import type { CategoriaDato } from '@/types'

export const GAS_COLORS: Record<string, string> = {
  CO2: '#198A77',
  CH4: '#DF5B26',
  N2O: '#57270F',
}

// Color y etiqueta de las categorías sin sub-filtro de gas (biomasa/cos),
// para pintar el mapa en modo "sitios" cuando esa es la metodología activa.
export const CATEGORIA_COLORS: Record<'biomasa' | 'cos', string> = {
  biomasa: '#739E5B',
  cos: '#57270F',
}

export const CATEGORIA_LABELS: Record<CategoriaDato, string> = {
  flujos: 'Flujos',
  biomasa: 'Biomasa',
  cos: 'COS',
}

// Paleta general para gráficas categóricas (torta/barras) sin un color de
// dominio propio (proyecto, ecosistema, estado de conservación, …).
export const PIE_COLORS = ['#198A77', '#739E5B', '#F2B91B', '#DF5B26', '#57270F', '#94a3b8']

export const GAS_LABELS: Record<string, string> = {
  CO2: 'CO₂ — Dióxido de carbono',
  CH4: 'CH₄ — Metano',
  N2O: 'N₂O — Óxido nitroso (próximamente)',
}

// Fórmula corta de cada gas, para títulos y etiquetas.
export const GAS_CORTO: Record<string, string> = {
  CO2: 'CO₂',
  CH4: 'CH₄',
  N2O: 'N₂O',
}

export const UNIDAD_LABELS: Record<string, string> = {
  g_m2_h: 'g/m²/h',
  umol_m2_s: 'µmol/m²/s',
  nmol_m2_s: 'nmol/m²/s',
  tonc_ha: 'TonC/ha',
  pct: '%',
}

export const formatUnidad = (unidad: string): string => UNIDAD_LABELS[unidad] ?? unidad

export const formatValor = (valor: number | null, unidad: string): string =>
  valor == null
    ? 'Sin datos'
    : `${valor.toLocaleString('es-CO', { maximumFractionDigits: 3 })} ${formatUnidad(unidad)}`
