import type { IaCargaSubirResponse } from '@/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8001/api'

// Endpoint dedicado al Formulario web (carga con mapeo asistido por IA) —
// separado a propósito de `etlService` (upload manual de Gestión de Datos)
// y de los endpoints de consulta, ver
// personal/tasks/backlog/formulario-web-carga-datos-ia.md en `context`.
export const iaCargaService = {
  subirArchivo: async (
    token: string,
    archivo: File,
    nombreFuente: string,
    proyectoId?: number
  ): Promise<IaCargaSubirResponse> => {
    const body = new FormData()
    body.append('archivo', archivo)
    body.append('nombre_fuente', nombreFuente)
    if (proyectoId != null) body.append('proyecto_id', String(proyectoId))

    const res = await fetch(`${API_BASE}/ia-carga/subir/`, {
      method: 'POST',
      headers: { Authorization: `Token ${token}` },
      body,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
    return data as IaCargaSubirResponse
  },
}
