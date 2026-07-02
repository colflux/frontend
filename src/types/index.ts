export type GasType = 'CO2' | 'CH4' | 'N2O' | 'total'

export interface Region {
  id: string
  name: string
  lat: number
  lng: number
}

export interface EmissionRecord {
  regionId: string
  year: number
  gas: GasType
  value: number // MtCO2e
}

export interface FilterState {
  year: number
  gas: GasType
  regionId: string | null
}

export interface TrendPoint {
  year: number
  CO2: number
  CH4: number
  N2O: number
  total: number
}
