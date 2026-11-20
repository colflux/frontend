import { useMemo, useState, type ReactNode } from 'react'
import { CATALOGO, ENTIDAD_MAP } from '@/utils/catalogoModel'
import type { CampoDestino, EntidadCatalogo } from '@/types'

function resaltar(texto: string, query: string): ReactNode {
  if (!query) return texto
  const idx = texto.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return texto
  return (
    <>
      {texto.slice(0, idx)}
      <mark className="bg-yellow-200 dark:bg-yellow-500/40 rounded-sm">{texto.slice(idx, idx + query.length)}</mark>
      {texto.slice(idx + query.length)}
    </>
  )
}

const TIPO_CLASES: Record<string, string> = {
  Texto: 'bg-green-100 text-green-800',
  TextoLargo: 'bg-green-100 text-green-800',
  Decimal: 'bg-blue-100 text-blue-800',
  Entero: 'bg-blue-100 text-blue-800',
  Fecha: 'bg-purple-100 text-purple-800',
  FechaHora: 'bg-purple-100 text-purple-800',
  Booleano: 'bg-amber-100 text-amber-800',
  FK: 'bg-slate-100 text-slate-700',
  URL: 'bg-blue-100 text-blue-800',
  Correo: 'bg-blue-100 text-blue-800',
}

function tipoClase(tipo: string): string {
  return TIPO_CLASES[tipo] ?? 'bg-slate-100 text-slate-700'
}

function CampoRow({ campo, query }: { campo: CampoDestino; query: string }) {
  const [choicesAbierto, setChoicesAbierto] = useState(false)
  const [copiado, setCopiado] = useState(false)

  function copiar() {
    navigator.clipboard.writeText(campo.nombre).then(() => {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1200)
    })
  }

  return (
    <tr className="hover:bg-surface group">
      <td className="px-3.5 py-2.5 border-b border-border align-top">
        <div className="font-mono text-[.8rem] text-brand-teal-dark dark:text-brand-teal-bright font-semibold flex items-center gap-1.5">
          {resaltar(campo.nombre, query)}
          <button
            onClick={copiar}
            title="Copiar nombre"
            className="hidden group-hover:inline border border-border rounded px-1.5 py-0.5 text-xs text-fg-muted hover:border-brand-teal hover:text-brand-teal-dark hover:bg-brand-teal-light"
          >
            {copiado ? '✓' : '📋'}
          </button>
        </div>
      </td>
      <td className="px-3.5 py-2.5 border-b border-border align-top text-sm">{resaltar(campo.verbose_name, query)}</td>
      <td className="px-3.5 py-2.5 border-b border-border align-top">
        <span className={`inline-block px-2 py-0.5 rounded-full text-[.72rem] font-bold ${tipoClase(campo.tipo)}`}>
          {campo.tipo}
        </span>
      </td>
      <td className="px-3.5 py-2.5 border-b border-border align-top text-center">
        {campo.requerido && <span className="text-brand-teal-dark font-bold">✓</span>}
      </td>
      <td className="px-3.5 py-2.5 border-b border-border align-top text-sm space-y-1">
        {campo.max_length != null && <span className="text-fg-muted text-xs block">máx. {campo.max_length} chars</span>}
        {campo.choices.length > 0 && (
          <div>
            <button
              onClick={() => setChoicesAbierto((v) => !v)}
              className="border border-border rounded px-2 py-0.5 text-xs text-fg-muted hover:border-brand-teal hover:text-brand-teal-dark"
            >
              ▼ {campo.choices.length} opciones
            </button>
            {choicesAbierto && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {campo.choices.map((c) => (
                  <span key={c.valor} title={c.etiqueta} className="bg-surface rounded px-2 py-0.5 text-xs text-fg">
                    {c.valor}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
        {campo.es_fk && campo.modelo_fk && <span className="text-fg-muted text-xs block">→ {campo.modelo_fk}</span>}
      </td>
    </tr>
  )
}

function TablaSemilla({ entidad }: { entidad: EntidadCatalogo }) {
  const filas = entidad.datos_semilla
  if (!filas || filas.length === 0) return null
  const columnas = Object.keys(filas[0])

  return (
    <div className="mt-7">
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-fg-muted mb-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-brand-teal shrink-0" />
        Datos disponibles ({filas.length} registros)
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-panel border border-border rounded-xl overflow-hidden text-[.82rem]">
          <thead>
            <tr>
              {columnas.map((c) => (
                <th
                  key={c}
                  className="bg-brand-teal-light dark:bg-brand-teal/10 px-3.5 py-2 text-left text-[.73rem] font-bold uppercase tracking-wider text-brand-teal-dark dark:text-brand-teal-bright border-b border-border"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i} className="hover:bg-surface">
                {columnas.map((c) => (
                  <td key={c} className="px-3.5 py-2 border-b border-border align-top last:border-b-0">
                    {fila[c] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface Props {
  entidadSeleccionada: string
  onSeleccionar: (nombre: string) => void
}

export function CatalogoCampos({ entidadSeleccionada, onSeleccionar }: Props) {
  const [query, setQuery] = useState('')
  const [grupoFiltro, setGrupoFiltro] = useState('')

  const queryLower = query.toLowerCase()
  const entidad = ENTIDAD_MAP[entidadSeleccionada]?.entidad ?? null

  const camposFiltrados = useMemo(() => {
    if (!entidad) return []
    if (!queryLower) return entidad.campos
    return entidad.campos.filter(
      (c) => c.nombre.toLowerCase().includes(queryLower) || c.verbose_name.toLowerCase().includes(queryLower)
    )
  }, [entidad, queryLower])

  return (
    <div>
      <div className="bg-panel border-b border-border py-3.5 sticky top-14 z-20 -mx-6 px-6 mb-6">
        <div className="flex gap-3 items-center max-w-5xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="🔍  Buscar campo o entidad…"
            className="flex-1 border border-border rounded-lg px-3.5 py-2 text-sm bg-surface focus:outline-none focus:border-brand-teal"
          />
          <select
            value={grupoFiltro}
            onChange={(e) => setGrupoFiltro(e.target.value)}
            className="border border-border rounded-lg px-3 py-2 text-sm bg-surface focus:outline-none focus:border-brand-teal"
          >
            <option value="">Todos los grupos</option>
            {CATALOGO.grupos.map((g) => (
              <option key={g.nombre} value={g.nombre}>
                {g.icono} {g.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-[260px_1fr] gap-6 items-start max-md:grid-cols-1">
        <aside className="sticky top-32 max-h-[calc(100vh-140px)] overflow-y-auto max-md:static max-md:max-h-none">
          {CATALOGO.grupos
            .filter((g) => !grupoFiltro || g.nombre === grupoFiltro)
            .map((g) => {
              const entidadesFiltradas = g.entidades.filter(
                (e) =>
                  !queryLower ||
                  e.nombre.toLowerCase().includes(queryLower) ||
                  e.verbose_name.toLowerCase().includes(queryLower) ||
                  e.campos.some(
                    (c) => c.nombre.toLowerCase().includes(queryLower) || c.verbose_name.toLowerCase().includes(queryLower)
                  )
              )
              if (entidadesFiltradas.length === 0) return null
              return (
                <div key={g.nombre} className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-fg-muted mb-1.5 flex items-center gap-1.5">
                    {g.icono} {g.nombre}
                  </div>
                  {entidadesFiltradas.map((e) => (
                    <button
                      key={e.nombre}
                      onClick={() => onSeleccionar(e.nombre)}
                      className={`block w-full text-left rounded-md px-3 py-1.5 text-sm transition-colors ${
                        entidadSeleccionada === e.nombre
                          ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright font-bold'
                          : 'text-fg hover:bg-surface'
                      }`}
                    >
                      {e.verbose_name || e.nombre}
                    </button>
                  ))}
                </div>
              )
            })}
        </aside>

        <main>
          {!entidad ? (
            <p className="text-fg-muted py-10 text-center">Sin resultados</p>
          ) : (
            <>
              <div className="mb-5">
                <h3 className="text-xl font-extrabold text-fg">{entidad.verbose_name || entidad.nombre}</h3>
                <p className="text-sm text-fg-muted mt-1">
                  {entidad.verbose_name_plural} · {camposFiltrados.length} campo
                  {camposFiltrados.length !== 1 ? 's' : ''}
                  {query ? ' (filtrados)' : ''}
                </p>
                {entidad.descripcion && (
                  <div className="text-sm text-fg mt-2.5 bg-brand-teal-light dark:bg-brand-teal/10 border-l-[3px] border-brand-teal rounded-r-lg px-3.5 py-2.5">
                    {entidad.descripcion}
                  </div>
                )}
              </div>

              {camposFiltrados.length === 0 ? (
                <p className="text-fg-muted py-10 text-center">Ningún campo coincide con la búsqueda</p>
              ) : (
                <table className="w-full border-collapse bg-panel border border-border rounded-xl overflow-hidden">
                  <thead>
                    <tr>
                      <th className="bg-surface px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                        Campo
                      </th>
                      <th className="bg-surface px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                        Nombre legible
                      </th>
                      <th className="bg-surface px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                        Tipo
                      </th>
                      <th className="bg-surface px-3.5 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                        Req.
                      </th>
                      <th className="bg-surface px-3.5 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-fg-muted border-b border-border">
                        Restricciones / Opciones
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {camposFiltrados.map((c) => (
                      <CampoRow key={c.nombre} campo={c} query={query} />
                    ))}
                  </tbody>
                </table>
              )}

              <TablaSemilla entidad={entidad} />
            </>
          )}
        </main>
      </div>
    </div>
  )
}
