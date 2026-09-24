import { useEffect, useState } from 'react'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { useFkChoices } from '@/hooks/useFkChoices'
import { useRegexSugerido } from '@/hooks/useRegexSugerido'
import { columnaEsCompleja } from '@/utils/etlMapeo'
import { ChoicesPanel } from './ChoicesPanel'
import { RegexPreview } from './RegexPreview'
import { ReviewModal } from './ReviewModal'
import type { CampoDestino } from '@/types'

interface Props {
  modelo: string
  campoMeta: CampoDestino
  colIdxsMapeados: number[]
}

export function AtributoRow({ modelo, campoMeta, colIdxsMapeados }: Props) {
  const {
    fuenteId,
    columnas,
    mapeoSeleccion,
    atributosManuales,
    camposDestino,
    ultimosErroresPorColumna,
    setTipoCoberturaColumna,
    setAplicarRegexColumna,
    setRegexPatronColumna,
    reasignarOrigenAtributo,
    activarAtributoManualDeCampo,
    quitarAtributoManualDeCampo,
    actualizarAtributoManual,
  } = useEtlUploadStore()
  const tiposCobertura = camposDestino?.tipos_cobertura ?? []

  const [abierto, setAbierto] = useState(false)
  const [revisionAbierta, setRevisionAbierta] = useState(false)
  const [sugerenciaRegexMsg, setSugerenciaRegexMsg] = useState('')
  const regexSugerido = useRegexSugerido()

  const idxsKey = colIdxsMapeados.join(',')
  useEffect(() => {
    if (colIdxsMapeados.length > 1) {
      reasignarOrigenAtributo(modelo, campoMeta.nombre, colIdxsMapeados[0], colIdxsMapeados.slice(1))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idxsKey, modelo, campoMeta.nombre])

  const activo = colIdxsMapeados[0] ?? null
  const col = activo != null ? columnas[activo] : null
  const seleccion = activo != null ? mapeoSeleccion[activo] : undefined
  const muestraCompleta = (col?.muestra ?? []).slice(0, 5)

  const manualIdx = atributosManuales.findIndex((a) => a.modelo === modelo && a.campo === campoMeta.nombre)
  const manualActivo = manualIdx !== -1
  const manualAttr = manualActivo ? atributosManuales[manualIdx] : null
  const tieneManual = Boolean(manualAttr?.valor)
  const cubierto = activo != null || tieneManual

  const mostrarTipoCobertura = modelo === 'Cobertura' && campoMeta.nombre === 'nombre'
  const fkChoices = useFkChoices(modelo, campoMeta.nombre, fuenteId, campoMeta.es_fk)
  const choicesEfectivos = campoMeta.es_fk ? fkChoices.data?.choices ?? [] : campoMeta.choices ?? []
  const mostrarChoices = Boolean(
    activo != null && choicesEfectivos.length > 0 && (col?.valores_unicos?.length ?? 0) > 0
  )
  const esCompleja =
    activo != null && col
      ? columnaEsCompleja(activo, col, mapeoSeleccion, ultimosErroresPorColumna, campoMeta.requerido)
      : false
  const tieneNulosOpcionales = Boolean(!esCompleja && activo != null && col?.nulls)
  const mostrarPreviewIdentidad = activo != null && !mostrarChoices && !seleccion?.aplicarRegex

  const partesRevisar: string[] = []
  if (esCompleja && col) {
    const nHoras = Object.keys(col.sugerencias_hora ?? {}).length
    const erroresPrevios = ultimosErroresPorColumna[col.nombre] ?? []
    if (nHoras) partesRevisar.push(`${nHoras} hora${nHoras > 1 ? 's' : ''} ambigua${nHoras > 1 ? 's' : ''}`)
    if (col.nulls) partesRevisar.push(`${col.nulls} fila${col.nulls > 1 ? 's' : ''} vacía${col.nulls > 1 ? 's' : ''}`)
    if (erroresPrevios.length) {
      partesRevisar.push(`${erroresPrevios.length} error${erroresPrevios.length > 1 ? 'es' : ''}`)
    }
  }

  function toggleRegex() {
    if (activo == null) return
    const activar = !seleccion?.aplicarRegex
    setAplicarRegexColumna(activo, activar)
    setSugerenciaRegexMsg('')
    if (activar && !seleccion?.regexPatron && fuenteId != null) {
      regexSugerido.mutate(
        { fuenteId, modelo, campo: campoMeta.nombre },
        {
          onSuccess: (data) => {
            if (!data.regex_patron) return
            setRegexPatronColumna(activo, data.regex_patron)
            setSugerenciaRegexMsg(
              `💡 Sugerido a partir de "${data.columna_origen}" en la fuente "${data.fuente_nombre}" — puedes editarlo.`
            )
          },
        }
      )
    }
  }

  function otroDestinoDe(idx: number): string | null {
    const s = mapeoSeleccion[idx]
    if (!s?.modelo || !s?.campo) return null
    if (s.modelo === modelo && s.campo === campoMeta.nombre) return null
    return `${s.modelo}.${s.campo}`
  }

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-surface transition-colors"
      >
        <span
          className={`text-brand-teal-dark dark:text-brand-teal-bright text-xs transition-transform ${abierto ? 'rotate-45' : ''}`}
        >
          ◆
        </span>
        <span className="text-sm font-semibold text-fg flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {campoMeta.verbose_name || campoMeta.nombre}
          <span className="text-[10px] font-bold text-fg-subtle bg-surface px-1.5 py-0.5 rounded">
            {campoMeta.requerido ? 'obligatorio' : 'opcional'}
          </span>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
              cubierto
                ? 'text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-950/40'
                : 'text-fg-subtle bg-surface'
            }`}
          >
            {cubierto ? 'mapeado' : 'sin mapear'}
          </span>
          {campoMeta.requerido && !cubierto && (
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">⚠️ falta mapear</span>
          )}
          {esCompleja && (
            <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">🔍 revisar</span>
          )}
        </span>
      </button>

      {abierto && (
        <div className="px-4 pb-3">
          {campoMeta.help_text && (
            <p className="text-xs text-brand-teal-dark dark:text-brand-teal-bright mb-2">{campoMeta.help_text}</p>
          )}
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <div className="flex-1 min-w-0 bg-surface border border-border rounded-lg p-3">
              <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">
                Atributo en fuente de datos
              </p>
              <select
                value={manualActivo ? '__manual__' : activo ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '__manual__') {
                    if (activo != null) reasignarOrigenAtributo(modelo, campoMeta.nombre, null, colIdxsMapeados)
                    activarAtributoManualDeCampo(modelo, campoMeta.nombre)
                    return
                  }
                  if (manualActivo) quitarAtributoManualDeCampo(modelo, campoMeta.nombre)
                  reasignarOrigenAtributo(modelo, campoMeta.nombre, v === '' ? null : Number(v), colIdxsMapeados)
                }}
                className="w-full bg-panel border border-border text-fg text-sm font-semibold rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              >
                <option value="">— ninguna columna —</option>
                <option value="__manual__">✏️ escribir manual</option>
                {columnas.map((c, i) => {
                  const otro = otroDestinoDe(i)
                  return (
                    <option key={i} value={i}>
                      {c.nombre}
                      {otro ? ` — ya en ${otro}` : ''}
                    </option>
                  )
                })}
              </select>
              {manualActivo ? (
                <div className="mt-1.5">
                  {campoMeta.es_fk && fkChoices.isLoading ? (
                    <span className="text-xs italic text-fg-muted">Cargando opciones…</span>
                  ) : campoMeta.es_fk && choicesEfectivos.length === 0 ? (
                    <span className="text-xs italic text-fg-muted">
                      Aún no hay ningún {campoMeta.modelo_fk} registrado en la base de datos.
                    </span>
                  ) : choicesEfectivos.length > 0 ? (
                    <select
                      value={manualAttr?.valor ?? ''}
                      onChange={(e) => actualizarAtributoManual(manualIdx, { valor: e.target.value })}
                      className="w-full bg-panel border border-border text-fg text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    >
                      <option value="">— valor —</option>
                      {choicesEfectivos.map((ch) => (
                        <option key={String(ch.valor)} value={ch.valor}>
                          {ch.etiqueta}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="valor para todas las filas…"
                      value={manualAttr?.valor ?? ''}
                      onChange={(e) => actualizarAtributoManual(manualIdx, { valor: e.target.value })}
                      className="w-full bg-panel border border-border text-fg text-sm rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                    />
                  )}
                </div>
              ) : (
                <>
                  {col && (
                    <div className="text-xs text-fg-muted mt-1.5 flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-mono text-fg-subtle bg-panel px-1.5 py-0.5 rounded">
                        {col.dtype || 'string'}
                      </span>
                      <span className="text-[10px] text-fg-subtle">{col.nulls ?? 0} nulos</span>
                    </div>
                  )}
                  {muestraCompleta.length > 0 && (
                    <div className="text-xs text-fg-muted mt-1.5 flex flex-col gap-0.5">
                      {muestraCompleta.map((v, i) => (
                        <span key={i} className="font-mono">"{v}"</span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            <span className="text-fg-subtle self-center text-lg rotate-90 md:rotate-0">→</span>

            <div className="flex-1 min-w-0 bg-surface border border-border rounded-lg p-3">
              <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">Vista previa</p>

              {manualActivo ? (
                <p className="text-xs text-fg-muted">
                  {manualAttr?.valor ? (
                    <>
                      Valor fijo <span className="font-mono text-fg">"{manualAttr.valor}"</span> para todas las
                      filas.
                    </>
                  ) : (
                    'Escribe el valor que se va a usar para todas las filas.'
                  )}
                </p>
              ) : activo == null ? (
                <p className="text-xs text-fg-muted">Selecciona una columna de origen para ver la vista previa.</p>
              ) : (
                <>
                  <div className="flex items-center gap-2 flex-wrap">
                    {mostrarTipoCobertura && (
                      <select
                        value={seleccion?.tipoCobertura ? String(seleccion.tipoCobertura) : ''}
                        onChange={(e) => setTipoCoberturaColumna(activo, e.target.value ? Number(e.target.value) : null)}
                        className="bg-panel border border-border text-fg text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      >
                        <option value="">— sistema de clasificación —</option>
                        {tiposCobertura.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.nombre}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={toggleRegex}
                      className="text-xs font-semibold text-brand-teal-dark dark:text-brand-teal-bright hover:underline whitespace-nowrap"
                    >
                      {seleccion?.aplicarRegex ? 'quitar regex' : '🧩 aplicar regex al campo'}
                    </button>
                  </div>

                  {seleccion?.aplicarRegex && col && (
                    <div className="w-full flex flex-col gap-1.5 mt-2">
                      <input
                        type="text"
                        placeholder={String.raw`^SWAMP_CO2_(.+?)_\d+$`}
                        value={seleccion.regexPatron || ''}
                        onChange={(e) => setRegexPatronColumna(activo, e.target.value)}
                        className="min-w-[220px] max-w-full font-mono text-xs bg-panel border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                      />
                      {sugerenciaRegexMsg && <p className="text-xs text-fg-muted">{sugerenciaRegexMsg}</p>}
                      <RegexPreview col={col} patron={seleccion.regexPatron || ''} fuenteId={fuenteId} modelo={modelo} campo={campoMeta.nombre} />
                    </div>
                  )}

                  {mostrarChoices && (
                    <div className="mt-2">
                      <ChoicesPanel idx={activo} choices={choicesEfectivos} />
                    </div>
                  )}

                  {mostrarPreviewIdentidad && (
                    <div className="mt-2 p-2.5 bg-panel border border-border rounded-lg">
                      <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">
                        Se guarda igual, sin transformar
                      </p>
                      <div className="flex flex-col gap-1">
                        {muestraCompleta.length === 0 ? (
                          <p className="text-xs text-fg-muted">No hay valores de muestra disponibles.</p>
                        ) : (
                          muestraCompleta.slice(0, 3).map((v, i) => (
                            <div key={i} className="text-xs font-mono">
                              <span className="text-brand-teal-dark dark:text-brand-teal-bright font-semibold">"{v}"</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {esCompleja && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setRevisionAbierta(true)}
                className="bg-surface border border-amber-500 text-amber-700 dark:text-amber-400 text-xs font-semibold rounded-md px-3 py-1.5"
              >
                🔍 Revisar ({partesRevisar.join(', ')})
              </button>
            </div>
          )}

          {tieneNulosOpcionales && col && (
            <div className="pt-3">
              <button
                type="button"
                onClick={() => setRevisionAbierta(true)}
                className="text-xs text-fg-muted hover:text-fg underline decoration-dotted"
              >
                {col.nulls} fila{col.nulls > 1 ? 's' : ''} vacía{col.nulls > 1 ? 's' : ''} (campo opcional, se dejan
                así) — cambiar
              </button>
            </div>
          )}
        </div>
      )}

      {revisionAbierta && activo != null && <ReviewModal idx={activo} onClose={() => setRevisionAbierta(false)} />}
    </div>
  )
}
