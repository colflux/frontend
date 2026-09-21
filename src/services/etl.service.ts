import type {
  AnalizarFuenteResponse,
  CamposDestinoResponse,
  ImportarSeccionResponse,
  MapeoColumnaPayload,
  PostMapeoResponse,
  PrevisualizarSeccionResponse,
  RegexSugeridoResponse,
  ValidacionSeccionError,
  VerificarExistenciaResponse,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data as T
}

// previsualizar/importar devuelven 400 con un cuerpo de errores de
// validación "esperado" (no una falla de red) — se retorna como valor, no
// como excepción, para que el llamador lo muestre inline igual que el
// resto del formulario.
async function fetchSeccion<T>(url: string, hastaGrupo: number): Promise<T | ValidacionSeccionError> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hasta_grupo: hastaGrupo }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 400 && data.ok === false) return data as ValidacionSeccionError
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data as T
}

export const etlService = {
  analizarFuente: (fuenteId: number, archivo?: File): Promise<AnalizarFuenteResponse> => {
    let body: FormData | undefined
    if (archivo) {
      body = new FormData()
      body.append('archivo', archivo)
    }
    return fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/upload/`, { method: 'POST', body })
  },

  getCamposDestino: (fuenteId: number | null): Promise<CamposDestinoResponse> => {
    const qs = fuenteId != null ? `?fuente=${encodeURIComponent(fuenteId)}` : ''
    return fetchJson(`${API_BASE}/etl/campos-destino/${qs}`)
  },

  postMapeo: (
    fuenteId: number,
    cargaId: number,
    mapeos: MapeoColumnaPayload[],
    parcial: boolean
  ): Promise<PostMapeoResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/mapeo/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mapeos, parcial }),
    }),

  previsualizarSeccion: (
    fuenteId: number,
    cargaId: number,
    hastaGrupo: number
  ): Promise<PrevisualizarSeccionResponse | ValidacionSeccionError> =>
    fetchSeccion(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/previsualizar/`, hastaGrupo),

  importarSeccion: (
    fuenteId: number,
    cargaId: number,
    hastaGrupo: number
  ): Promise<ImportarSeccionResponse | ValidacionSeccionError> =>
    fetchSeccion(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/importar/`, hastaGrupo),

  getRegexSugerido: (fuenteId: number, modelo: string, campo: string): Promise<RegexSugeridoResponse> =>
    fetchJson(
      `${API_BASE}/etl/regex-sugerido/?fuente=${encodeURIComponent(fuenteId)}&modelo=${encodeURIComponent(modelo)}&campo=${encodeURIComponent(campo)}`
    ),

  verificarExistencia: (
    fuenteId: number,
    modelo: string,
    campo: string,
    valores: string[]
  ): Promise<VerificarExistenciaResponse> =>
    fetchJson(`${API_BASE}/etl/verificar-existencia/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fuente_id: fuenteId, modelo, campo, valores }),
    }),
}
