import type { Region, EmissionRecord, GasType } from '@/types'

export const REGIONS: Region[] = [
  { id: 'cundinamarca', name: 'Cundinamarca', lat: 4.711,  lng: -74.072 },
  { id: 'antioquia',    name: 'Antioquia',    lat: 6.244,  lng: -75.581 },
  { id: 'valle',        name: 'Valle del Cauca', lat: 3.452, lng: -76.532 },
  { id: 'atlantico',   name: 'Atlántico',    lat: 10.969, lng: -74.781 },
  { id: 'bolivar',     name: 'Bolívar',      lat: 9.030,  lng: -74.781 },
  { id: 'santander',   name: 'Santander',    lat: 7.125,  lng: -73.120 },
  { id: 'narino',      name: 'Nariño',       lat: 1.214,  lng: -77.281 },
  { id: 'meta',        name: 'Meta',         lat: 3.988,  lng: -73.569 },
  { id: 'huila',       name: 'Huila',        lat: 2.535,  lng: -75.528 },
  { id: 'cauca',       name: 'Cauca',        lat: 2.570,  lng: -76.826 },
]

export const AVAILABLE_YEARS = [2019, 2020, 2021, 2022, 2023]

const GASES: GasType[] = ['CO2', 'CH4', 'N2O']

// Base emissions per region per gas (MtCO2e)
const BASE: Record<string, Record<string, number>> = {
  cundinamarca: { CO2: 18.4, CH4: 4.2, N2O: 1.8 },
  antioquia:    { CO2: 22.1, CH4: 5.8, N2O: 2.3 },
  valle:        { CO2: 14.7, CH4: 3.1, N2O: 1.4 },
  atlantico:    { CO2: 8.9,  CH4: 1.9, N2O: 0.8 },
  bolivar:      { CO2: 11.2, CH4: 2.6, N2O: 1.1 },
  santander:    { CO2: 9.8,  CH4: 2.2, N2O: 0.9 },
  narino:       { CO2: 6.3,  CH4: 1.4, N2O: 0.6 },
  meta:         { CO2: 15.6, CH4: 6.1, N2O: 1.2 },
  huila:        { CO2: 7.4,  CH4: 2.8, N2O: 0.7 },
  cauca:        { CO2: 5.9,  CH4: 1.6, N2O: 0.5 },
}

// Adds slight year-over-year growth + noise to simulate real data
function simulate(base: number, year: number, seed: number): number {
  const growth = 1 + (year - 2019) * 0.02
  const noise = 1 + Math.sin(seed * 7.3 + year) * 0.04
  return parseFloat((base * growth * noise).toFixed(2))
}

export const MOCK_EMISSIONS: EmissionRecord[] = REGIONS.flatMap((region, ri) =>
  AVAILABLE_YEARS.flatMap((year, yi) =>
    GASES.map((gas) => ({
      regionId: region.id,
      year,
      gas,
      value: simulate(BASE[region.id][gas], year, ri + yi),
    }))
  )
)
