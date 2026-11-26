import type {
  AnalizarFuenteResponse,
  CamposDestinoResponse,
  EditarCeldaBronceResponse,
  EstadoImportacionResponse,
  FkChoicesResponse,
  ImportarTorreResponse,
  ListarBronceResponse,
  MapeoAutomaticoResponse,
  MapeoColumnaPayload,
  PostMapeoResponse,
  RegexSugeridoResponse,
  ValoresColumnaBronceResponse,
  VerificarExistenciaResponse,
} from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.detail || data.error || `HTTP ${res.status}`)
  return data as T
}

export const etlService = {
  analizarFuente: (
    token: string,
    fuenteId: number,
    archivo?: File,
    hoja?: string,
    headerFila?: number
  ): Promise<AnalizarFuenteResponse> => {
    let body: FormData | undefined
    if (archivo || hoja || headerFila) {
      body = new FormData()
      if (archivo) body.append('archivo', archivo)
      if (hoja) body.append('hoja', hoja)
      if (headerFila) body.append('header_fila', String(headerFila))
    }
    return fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/upload/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body,
    })
  },

  // Torre EC/Eddypro no pasa por el wizard genérico de mapeo: el archivo
  // crudo (semihorario, ancho) siempre trae las mismas columnas en el mismo
  // orden, así que el backend lo agrega a diario, lo aplana a formato largo
  // e importa directo a MuestraTorre/SubMuestraTorre en una sola llamada
  // (ver app/api/etl/preprocesamiento_torre.py e importar_torre en views.py).
  importarTorre: (
    token: string,
    fuenteId: number,
    torreId: number,
    archivo: File
  ): Promise<ImportarTorreResponse> => {
    const body = new FormData()
    body.append('archivo', archivo)
    body.append('torre_id', String(torreId))
    return fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/importar-torre/`, {
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

  // Sugerencia de mapeo 1:1 cuando el archivo ya trae los encabezados
  // exactos de la plantilla descargable -ver "Ya tiene el formato de la
  // plantilla" en FuenteDrawer-: el llamador decide si aplicarla posteando
  // cada hoja "ok" a postMapeo y disparando la importación.
  getMapeoAutomatico: (token: string, fuenteId: number, cargaId: number): Promise<MapeoAutomaticoResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/mapeo-automatico/`, {
      headers: { Authorization: `Token ${token}` },
    }),

  estadoImportacion: (token: string, fuenteId: number, cargaId: number): Promise<EstadoImportacionResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/importar/estado/`, {
      headers: { Authorization: `Token ${token}` },
    }),

  getRegexSugerido: (fuenteId: number, modelo: string, campo: string): Promise<RegexSugeridoResponse> =>
    fetchJson(
      `${API_BASE}/etl/regex-sugerido/?fuente=${encodeURIComponent(fuenteId)}&modelo=${encodeURIComponent(modelo)}&campo=${encodeURIComponent(campo)}`
    ),

  // Capa bronce/staging (vista tipo Excel, Flujos CO2) — ver
  // tasks/inprogress/rediseno-carga-flujos-co2-staging-bronce.md en el repo
  // `context`. Dispara el pipeline completo (poblar → mapear automático →
  // validar → promover) en background; el avance se sigue con
  // `estadoImportacion` (mismo endpoint/campos que la importación clásica).
  procesarBronce: (token: string, fuenteId: number, cargaId: number): Promise<{ job_iniciado: true }> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/bronce/procesar/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
    }),

  listarBronce: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hoja: string,
    filtros: Record<string, string>,
    offset: number,
    limit: number
  ): Promise<ListarBronceResponse> => {
    const params = new URLSearchParams({ hoja, offset: String(offset), limit: String(limit) })
    Object.entries(filtros).forEach(([clave, valor]) => {
      if (valor) params.set(clave, valor)
    })
    return fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/bronce/?${params.toString()}`, {
      headers: { Authorization: `Token ${token}` },
    })
  },

  // URL de descarga del Excel con la capa bronce completa de la carga (una
  // pestaña por hoja, columnas en el orden de la plantilla) — se usa con
  // `downloadFile` (ver `utils/download.ts`), no con `fetchJson`, porque la
  // respuesta es un archivo binario, no JSON.
  getExportarBronceUrl: (fuenteId: number, cargaId: number): string =>
    `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/bronce/exportar/`,

  // Valores únicos (con conteo) de una columna bronce — alimenta el selector
  // "valor de origen → choice destino" (mapeo_valores) cuando el campo
  // destino elegido es FK/choices (ej. CoberturaManual.valor), igual que
  // ChoicesPanel.tsx en el asistente manual.
  valoresColumnaBronce: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hoja: string,
    columna: string
  ): Promise<ValoresColumnaBronceResponse> =>
    fetchJson(
      `${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/bronce/valores-columna/?hoja=${encodeURIComponent(hoja)}&columna=${encodeURIComponent(columna)}`,
      { headers: { Authorization: `Token ${token}` } }
    ),

  editarCeldaBronce: (
    token: string,
    fuenteId: number,
    cargaId: number,
    hoja: string,
    filaIdx: number,
    columna: string,
    valor: string
  ): Promise<EditarCeldaBronceResponse> =>
    fetchJson(`${API_BASE}/fuentes-datos/${fuenteId}/carga/${cargaId}/bronce/celda/`, {
      method: 'PATCH',
      headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoja, fila_idx: filaIdx, columna, valor }),
    }),

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
