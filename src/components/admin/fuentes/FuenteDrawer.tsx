import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFuenteDrawerStore } from '@/store/useFuenteDrawerStore'
import { useProyectoDrawerStore } from '@/store/useProyectoDrawerStore'
import { useProyectos } from '@/hooks/useProyectoMutations'
import { useInstituciones, useCrearInstitucion } from '@/hooks/useUsuarioMutations'
import { useCrearFuente, useActualizarFuente, useSubirArchivoFuente } from '@/hooks/useFuenteMutations'
import { useAuthStore } from '@/store/useAuthStore'
import type { MetodologiaFuente } from '@/types'

const METODOLOGIAS_FUENTE: { key: MetodologiaFuente; label: string }[] = [
  { key: 'flujos', label: 'Flujos (CO2/CH4)' },
  { key: 'cos', label: 'Carbono Orgánico del Suelo (COS)' },
  { key: 'biomasa', label: 'Biomasa' },
  { key: 'mom', label: 'Materia Orgánica Muerta (MOM)' },
]

// Tipo y nombre ya no se eligen a mano: se infieren del archivo/enlace que
// se sube (decisión de equipo, 2026-11-02) — ver EXTENSION_A_TIPO abajo.
const EXTENSION_A_TIPO: Record<string, string> = {
  xlsx: 'excel',
  xls: 'excel',
  csv: 'csv',
  shp: 'shapefile',
  geojson: 'geojson',
  json: 'geojson',
}

function inferirTipo(nombreOUrl: string): string {
  const match = nombreOUrl.toLowerCase().match(/\.([a-z0-9]+)(?:\?.*)?$/)
  const extension = match?.[1]
  if (extension && EXTENSION_A_TIPO[extension]) return EXTENSION_A_TIPO[extension]
  if (/^https?:\/\//i.test(nombreOUrl)) return 'api'
  return 'otro'
}

function inferirNombre(archivo: File | null, url: string): string {
  if (archivo) return archivo.name
  const limpio = url.trim().split('?')[0]
  const partes = limpio.split('/').filter(Boolean)
  return partes[partes.length - 1] || url.trim()
}

const inputClass =
  'bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal w-full'
const labelClass = 'text-xs font-bold text-fg'

export function FuenteDrawer() {
  const { open, editingFuente, proyectoContextId, metodologiaContext, fuenteTipoContext, closeDrawer } =
    useFuenteDrawerStore()
  const navigate = useNavigate()
  const openProyectoDrawer = useProyectoDrawerStore((s) => s.openDrawer)
  const { data: proyectos } = useProyectos()
  const { data: instituciones } = useInstituciones()
  const crearInstitucion = useCrearInstitucion()
  const usuarioActual = useAuthStore((s) => s.usuario)
  const crearFuente = useCrearFuente()
  const actualizarFuente = useActualizarFuente()
  const subirArchivo = useSubirArchivoFuente()

  const [metodologia, setMetodologia] = useState<MetodologiaFuente>('')
  const [proyectoId, setProyectoId] = useState('')
  const [institucionId, setInstitucionId] = useState('')
  const [url, setUrl] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)
  const [descripcion, setDescripcion] = useState('')
  const [yaTienePlantilla, setYaTienePlantilla] = useState(false)
  const [error, setError] = useState('')
  const [nuevaEntidadAbierta, setNuevaEntidadAbierta] = useState(false)
  const [nuevaEntidadNombre, setNuevaEntidadNombre] = useState('')

  // Torre EC (Eddypro) no se puede adjuntar acá como archivo crudo: necesita
  // elegir a qué TorreEc corresponde y pasar por el preprocesamiento
  // (agregado diario + aplanado) antes de poder mapearse — eso ya lo resuelve
  // el Paso 1 de EtlUpload.tsx. Este drawer solo crea la FuenteDatos y manda
  // para allá.
  const esTorre = metodologia === 'flujos' && fuenteTipoContext === 'torre'

  // El mapeo automático solo existe hoy para la plantilla de Flujos CO2
  // (única metodología con hojas Metadato/Dato definidas en
  // `_HOJAS_PLANTILLA`, backend/app/api/etl/views.py) — para las demás
  // metodologías la casilla no se muestra, el archivo sigue pasando por el
  // asistente manual de siempre.
  const soportaMapeoAutomatico = metodologia === 'flujos' && !esTorre

  useEffect(() => {
    if (!open) return
    if (editingFuente) {
      setMetodologia(editingFuente.metodologia || '')
      setProyectoId(editingFuente.proyecto?.id ? String(editingFuente.proyecto.id) : '')
      setInstitucionId(editingFuente.institucion?.id ? String(editingFuente.institucion.id) : '')
      setUrl(editingFuente.url || '')
      setDescripcion(editingFuente.descripcion || '')
    } else {
      // Predeterminada a la metodología de la card desde la que se abrió el
      // modal (decisión de equipo, 2026-11-02), pero se puede cambiar.
      setMetodologia(metodologiaContext || '')
      setProyectoId(proyectoContextId ? String(proyectoContextId) : '')
      // Predeterminada a la entidad del usuario que inició sesión (decisión
      // de equipo, 2026-11-02), pero se puede cambiar.
      setInstitucionId(usuarioActual?.institucion ? String(usuarioActual.institucion) : '')
      setUrl('')
      setDescripcion('')
    }
    setArchivo(null)
    setYaTienePlantilla(false)
    setError('')
    setNuevaEntidadAbierta(false)
    setNuevaEntidadNombre('')
  }, [open, editingFuente, proyectoContextId, metodologiaContext, usuarioActual])

  // Al elegir entidad, el desplegable de Proyecto se acota a los proyectos
  // asociados a esa entidad (decisión de equipo, 2026-11-02). Sin entidad
  // elegida, se muestran todos.
  const proyectosFiltrados = useMemo(() => {
    if (!proyectos) return []
    if (!institucionId) return proyectos
    const institucionNum = Number(institucionId)
    return proyectos.filter((p) => p.instituciones.includes(institucionNum))
  }, [proyectos, institucionId])

  useEffect(() => {
    if (!proyectoId || !proyectos) return
    if (proyectosFiltrados.some((p) => String(p.id) === proyectoId)) return
    setProyectoId('')
  }, [proyectosFiltrados, proyectoId, proyectos])

  async function handleCrearEntidad() {
    const nombreTrim = nuevaEntidadNombre.trim()
    if (!nombreTrim) return
    try {
      const nueva = await crearInstitucion.mutateAsync({ nombre: nombreTrim })
      setInstitucionId(String(nueva.id))
      setNuevaEntidadAbierta(false)
      setNuevaEntidadNombre('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la entidad.')
    }
  }

  const guardando = crearFuente.isPending || actualizarFuente.isPending || subirArchivo.isPending

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const urlTrim = url.trim()
    if (!esTorre && !archivo && !urlTrim) {
      setError('Sube un archivo o indica un enlace/ruta.')
      return
    }
    setError('')

    const nombre = editingFuente?.nombre || (esTorre ? 'Torre EC (Eddypro)' : inferirNombre(archivo, urlTrim))
    const tipo = esTorre ? 'csv' : inferirTipo(archivo?.name || urlTrim)

    const payload = {
      nombre,
      descripcion: descripcion.trim(),
      metodologia,
      url: esTorre ? '' : urlTrim,
      tipo,
      proyecto_id: proyectoId ? Number(proyectoId) : null,
      institucion_id: institucionId ? Number(institucionId) : null,
    }

    try {
      const fuente = editingFuente
        ? await actualizarFuente.mutateAsync({ id: editingFuente.id, payload })
        : await crearFuente.mutateAsync(payload)

      if (esTorre) {
        closeDrawer()
        navigate(`/etl/upload-torre?fuente=${fuente.id}`)
        return
      }

      if (archivo) {
        await subirArchivo.mutateAsync({ fuenteId: fuente.id, archivo })
      }

      if (yaTienePlantilla && soportaMapeoAutomatico) {
        closeDrawer()
        navigate(`/etl/upload?fuente=${fuente.id}&auto=1`)
        return
      }

      closeDrawer()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar. Intenta de nuevo.')
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 bg-black/40 z-[200] transition-opacity ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeDrawer}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 w-[440px] max-w-full bg-panel z-[201] shadow-2xl flex flex-col transition-transform duration-300 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="px-6 pt-5 pb-4 border-b border-border flex items-center justify-between">
          <h3 className="text-base font-extrabold text-fg">
            📂 {editingFuente ? 'Editar fuente de datos' : 'Nueva fuente de datos'}
          </h3>
          <button
            type="button"
            onClick={closeDrawer}
            className="text-fg-muted hover:text-fg hover:bg-surface rounded-md p-1 text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Metodología</label>
            <select
              value={metodologia}
              onChange={(e) => setMetodologia(e.target.value as MetodologiaFuente)}
              className={inputClass}
            >
              <option value="">— Sin metodología —</option>
              {METODOLOGIAS_FUENTE.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Entidad</label>
            <div className="flex gap-2 items-start">
              <select
                value={institucionId}
                onChange={(e) => setInstitucionId(e.target.value)}
                className={inputClass}
              >
                <option value="">— Sin entidad —</option>
                {instituciones?.map((inst) => (
                  <option key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNuevaEntidadAbierta((v) => !v)}
                title="Agregar entidad"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-brand-teal hover:border-brand-teal text-lg font-bold leading-none"
              >
                +
              </button>
            </div>
            {nuevaEntidadAbierta && (
              <div className="flex gap-2 items-center pt-1">
                <input
                  type="text"
                  value={nuevaEntidadNombre}
                  onChange={(e) => setNuevaEntidadNombre(e.target.value)}
                  placeholder="Nombre de la nueva entidad"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleCrearEntidad}
                  disabled={crearInstitucion.isPending || !nuevaEntidadNombre.trim()}
                  className="shrink-0 bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-xs font-bold px-3 py-2 rounded-md"
                >
                  {crearInstitucion.isPending ? 'Guardando…' : 'Guardar'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Proyecto</label>
            <div className="flex gap-2 items-start">
              <select value={proyectoId} onChange={(e) => setProyectoId(e.target.value)} className={inputClass}>
                <option value="">— Sin proyecto —</option>
                {proyectosFiltrados.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => openProyectoDrawer()}
                title="Agregar proyecto"
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-md border border-border text-fg-muted hover:text-brand-teal hover:border-brand-teal text-lg font-bold leading-none"
              >
                +
              </button>
            </div>
            {institucionId && proyectosFiltrados.length === 0 && (
              <span className="text-xs text-fg-muted">Esta entidad no tiene proyectos asociados todavía.</span>
            )}
          </div>

          {esTorre ? (
            <div className="bg-surface border border-border rounded-md px-3.5 py-3">
              <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1">
                Archivo de Eddypro
              </p>
              <p className="text-xs text-fg-muted">
                El archivo crudo de Eddypro no se sube acá: en el siguiente paso vas a elegir a qué torre
                corresponde y subirlo — el sistema lo agrega a promedios diarios antes de guardarlo.
              </p>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Enlace o ruta al archivo</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/… o ./data/test.xlsx"
                  className={inputClass}
                />
                <span className="text-xs text-fg-muted">
                  Acepta una URL http(s) descargable o una ruta de archivo accesible por el backend.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>O sube el archivo directamente</label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                  className="text-sm text-fg"
                />
                <span className="text-xs text-fg-muted">
                  Si seleccionas un archivo aquí, reemplaza el enlace/ruta anterior de la fuente.
                </span>
              </div>

              {soportaMapeoAutomatico && (
                <label className="flex items-start gap-2 bg-surface border border-border rounded-md px-3.5 py-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yaTienePlantilla}
                    onChange={(e) => setYaTienePlantilla(e.target.checked)}
                    className="mt-0.5"
                  />
                  <span className="text-xs text-fg">
                    <span className="font-bold">Ya tiene el formato de la plantilla</span>
                    <br />
                    <span className="text-fg-muted">
                      El archivo trae los encabezados exactos de "Descargar plantilla" (Metadato/Dato de Flujos
                      CO2) — se intenta mapear y subir directo a la base de datos, sin pasar por el asistente
                      manual de columnas. Si alguna hoja no calza exacto, cae de vuelta al asistente para esa hoja.
                    </span>
                  </span>
                </label>
              )}
            </>
          )}

          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>Descripción</label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={3}
              placeholder="¿Qué contiene este archivo? ¿De qué campaña de campo es?"
              className={`${inputClass} resize-y`}
            />
          </div>

          {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
        </form>

        <div className="px-6 py-4 border-t border-border flex gap-2.5 items-center">
          <button
            type="button"
            onClick={closeDrawer}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={guardando}
            className="flex-1 bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
          >
            {guardando
              ? 'Guardando…'
              : esTorre
                ? 'Continuar →'
                : editingFuente
                  ? 'Guardar cambios'
                  : 'Guardar fuente'}
          </button>
        </div>
      </div>
    </>
  )
}
