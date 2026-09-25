import type {
  AnalizarFuenteResponse,
  CamposDestinoResponse,
  EstadoImportacionResponse,
  FkChoicesResponse,
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
async function fetchSeccion<T>(url: string, token: string, hastaGrupo: number): Promise<T | ValidacionSeccionError> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ hasta_grupo: hastaGrupo }),
  })
  const data = await res.json().catch(() => ({}))
  if (res.status === 400 && data.ok === false) return data as ValidacionSeccionError
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data as T
}

export const etlService = {
  analizarFuente: (token: string, fuenteId: number, archivo?: File, hoja?: string): Promise<AnalizarFuenteResponse> => {
    let body: FormData | undefined
    if (archivo || hoja) {
      body = new FormData()
      if (archivo) body.append('archivo', archivo)
      if (hoja) body.append('hoja', hoja)
    }
    return fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/upload/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body,
    })
  },

  getCamposDestino: (fuenteId: number | null): Promise<CamposDestinoResponse> => {
    const qs = fuenteId != null ? `?fuente=${encodeURIComponent(fuenteId)}` : ''
    return fetchJson(`${API_BASE}/etl/campos-destino/${qs}`)
  },

  getFkChoices: (modelo: string, campo: string, fuenteId: number | null): Promise<FkChoicesResponse> => {
    const fuenteQs = fuenteId != null ? `&fuente=${encodeURIComponent(fuenteId)}` : ''
    return fetchJson(
      `${API_BASE}/etl/fk-choices/?modelo=${encodeURIComponent(modelo)}&campo=${encodeURIComponent(campo)}${fuenteQs}`
    )
  },

  postMapeo: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hoja: string,
    mapeos: MapeoColumnaPayload[],
    parcial: boolean
  ): Promise<PostMapeoResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/mapeo/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoja, mapeos, parcial }),
    }),

  vaciarMapeoHoja: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hoja: string
  ): Promise<{ ok: true; borrados: number }> =>
    fetchJson(
      `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/mapeo/?hoja=${encodeURIComponent(hoja)}`,
      { method: 'DELETE', headers: { Authorization: `Token ${token}` } }
    ),

  previsualizarSeccion: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hastaGrupo: number
  ): Promise<PrevisualizarSeccionResponse | ValidacionSeccionError> =>
    fetchSeccion(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/previsualizar/`, token, hastaGrupo),

  // El guardado corre en un hilo en background del servidor (sin
  // Celery/worker separado); esta llamada solo lo dispara — devuelve 202 de
  // inmediato — y `estadoImportacion` se usa para hacer polling del avance.
  iniciarImportarSeccion: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hastaGrupo: number
  ): Promise<{ job_iniciado: true }> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/importar/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hasta_grupo: hastaGrupo }),
    }),

  estadoImportacion: (token: string, fuenteId: number, cargaId: number): Promise<EstadoImportacionResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/importar/estado/`, {
      headers: { Authorization: `Token ${token}` },
    }),

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
