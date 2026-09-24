import { useState } from 'react'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { useFkChoices } from '@/hooks/useFkChoices'
import { useRegexSugerido } from '@/hooks/useRegexSugerido'
import { columnaEsCompleja } from '@/utils/etlMapeo'
import { ChoicesPanel } from './ChoicesPanel'
import { RegexPreview } from './RegexPreview'
import { ReviewModal } from './ReviewModal'

interface Props {
  idx: number
  modeloKeys: string[]
}

const SIN_DECIDIR = '__sin_decidir__'

export function MapeoRow({ idx, modeloKeys }: Props) {
  const {
    fuenteId,
    columnas,
    mapeoSeleccion,
    camposDestino,
    extrasDestino,
    ultimosErroresPorColumna,
    setModeloColumna,
    setCampoColumna,
    setTipoCoberturaColumna,
    setGasFijoColumna,
    setAplicarRegexColumna,
    setRegexPatronColumna,
    actualizarExtraDestino,
    quitarExtraDestino,
  } = useEtlUploadStore()
  const col = columnas[idx]
  const seleccion = mapeoSeleccion[idx]
  const modelosDestino = camposDestino?.modelos ?? {}
  const tiposCobertura = camposDestino?.tipos_cobertura ?? []
  const grupos = camposDestino?.grupos ?? {}

  const [revisionAbierta, setRevisionAbierta] = useState(false)
  const [sugerenciaRegexMsg, setSugerenciaRegexMsg] = useState('')
  const [abierto, setAbierto] = useState(false)
  const regexSugerido = useRegexSugerido()

  const muestraCompleta = (col.muestra ?? []).slice(0, 5)

  const modelosPorGrupo = new Map<string, string[]>()
  modeloKeys.forEach((m) => {
    const grupoInfo = grupos[m]
    const etiqueta = grupoInfo ? `${grupoInfo.icono} ${grupoInfo.nombre}` : 'Otros'
    const lista = modelosPorGrupo.get(etiqueta) ?? []
    lista.push(m)
    modelosPorGrupo.set(etiqueta, lista)
  })

  const campos = seleccion?.modelo ? modelosDestino[seleccion.modelo] ?? [] : []
  const mostrarTipoCobertura = seleccion?.modelo === 'Cobertura' && seleccion?.campo === 'nombre'
  const mostrarGasFijo = seleccion?.modelo === 'SubmuestraGEI' && seleccion?.campo === 'valor'
  const gasChoices = modelosDestino['MuestraGEI']?.find((c) => c.nombre === 'gas')?.choices ?? []
  const campoMeta = campos.find((c) => c.nombre === seleccion?.campo)
  // Las instancias de un campo FK se piden aparte (ver useFkChoices) — para
  // campos no-FK, campoMeta.choices ya trae los choices estáticos del modelo.
  const fkChoices = useFkChoices(seleccion?.modelo, seleccion?.campo, fuenteId, campoMeta?.es_fk)
  const choicesEfectivos = campoMeta?.es_fk ? fkChoices.data?.choices ?? [] : campoMeta?.choices ?? []
  // Campos con choices (p. ej. FKs) y campos de hora son mutuamente
  // excluyentes en la práctica: un TimeField nunca trae choices estáticos.
  const mostrarChoices = Boolean(campoMeta && choicesEfectivos.length > 0 && (col.valores_unicos?.length ?? 0) > 0)
  const esCompleja = columnaEsCompleja(idx, col, mapeoSeleccion, ultimosErroresPorColumna, campoMeta?.requerido)
  const tieneNulosOpcionales = Boolean(!esCompleja && seleccion?.modelo && seleccion.campo && col.nulls)

  function toggleRegex() {
    const activar = !seleccion?.aplicarRegex
    setAplicarRegexColumna(idx, activar)
    setSugerenciaRegexMsg('')
    if (activar && !seleccion?.regexPatron && fuenteId != null && seleccion?.modelo && seleccion.campo) {
      regexSugerido.mutate(
        { fuenteId, modelo: seleccion.modelo, campo: seleccion.campo },
        {
          onSuccess: (data) => {
            if (!data.regex_patron) return
            setRegexPatronColumna(idx, data.regex_patron)
            setSugerenciaRegexMsg(
              `💡 Sugerido a partir de "${data.columna_origen}" en la fuente "${data.fuente_nombre}" — puedes editarlo.`
            )
          },
        }
      )
    }
  }

  const extrasPendientes = extrasDestino
    .map((extra, extraIdx) => ({ extra, extraIdx }))
    .filter(({ extra }) => extra.colIdx === idx && !(extra.modelo && extra.campo))

  const modelosPorGrupoExtra = new Map<string, string[]>()
  Object.keys(modelosDestino).forEach((m) => {
    const grupoInfo = grupos[m]
    const etiqueta = grupoInfo ? `${grupoInfo.icono} ${grupoInfo.nombre}` : 'Otros'
    const lista = modelosPorGrupoExtra.get(etiqueta) ?? []
    lista.push(m)
    modelosPorGrupoExtra.set(etiqueta, lista)
  })

  const partesRevisar: string[] = []
  if (esCompleja) {
    const nHoras = Object.keys(col.sugerencias_hora ?? {}).length
    const erroresPrevios = ultimosErroresPorColumna[col.nombre] ?? []
    if (nHoras) partesRevisar.push(`${nHoras} hora${nHoras > 1 ? 's' : ''} ambigua${nHoras > 1 ? 's' : ''}`)
    if (col.nulls) partesRevisar.push(`${col.nulls} fila${col.nulls > 1 ? 's' : ''} vacía${col.nulls > 1 ? 's' : ''}`)
    if (erroresPrevios.length) {
      partesRevisar.push(`${erroresPrevios.length} error${erroresPrevios.length > 1 ? 'es' : ''}`)
    }
  }

  const destinoResumen = !seleccion
    ? 'sin mapear'
    : !seleccion.modelo
      ? 'ignorada'
      : !seleccion.campo
        ? `${seleccion.modelo} — falta campo`
        : `${seleccion.modelo}.${seleccion.campo}`

  const hayDestinoCompleto = Boolean(seleccion?.modelo && seleccion?.campo)
  const mostrarPreviewIdentidad = hayDestinoCompleto && !mostrarChoices && !seleccion?.aplicarRegex

  return (
    <div className="border-b border-border last:border-b-0">
      <div className="w-full flex items-center gap-2.5 px-4 py-3 flex-wrap">
        <button
          type="button"
          onClick={() => setAbierto((v) => !v)}
          className="flex items-center gap-2.5 flex-1 min-w-[220px] text-left hover:text-fg"
        >
          <span
            className={`text-brand-teal-dark dark:text-brand-teal-bright text-xs transition-transform ${abierto ? 'rotate-45' : ''}`}
          >
            ◆
          </span>
          <span className="text-sm font-semibold text-fg flex items-center gap-1.5 flex-wrap min-w-0">
            {seleccion?.campo ? campoMeta?.verbose_name || seleccion.campo : col.nombre}
            <span className="text-[10px] font-mono text-fg-subtle bg-surface px-1.5 py-0.5 rounded">
              {col.dtype || 'string'}
            </span>
            <span className="text-[10px] text-fg-subtle">{col.nulls ?? 0} nulos</span>
            {seleccion?.sugerido && (
              <span className="text-[10px] font-bold text-brand-teal-dark dark:text-brand-teal-bright">
                ✨ sugerido
              </span>
            )}
            {esCompleja && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400">🔍 revisar</span>
            )}
          </span>
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={seleccion ? seleccion.modelo || '' : SIN_DECIDIR}
            onChange={(e) => setModeloColumna(idx, e.target.value)}
            className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
          >
            {!seleccion && (
              <option value={SIN_DECIDIR} disabled hidden>
                — seleccionar —
              </option>
            )}
            <option value="">— ignorar —</option>
            {[...modelosPorGrupo.entries()].map(([etiqueta, modelos]) => (
              <optgroup key={etiqueta} label={etiqueta}>
                {modelos.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>

          <select
            value={seleccion?.campo || ''}
            disabled={!seleccion?.modelo}
            onChange={(e) => setCampoColumna(idx, e.target.value)}
            className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50"
          >
            <option value="">— campo —</option>
            {campos.map((c) => (
              <option key={c.nombre} value={c.nombre}>
                {c.verbose_name ? `${c.verbose_name} (${c.nombre})` : c.nombre}
                {c.es_fk ? ' 🔗' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {abierto && (
        <div className="px-4 pb-3">
          {campoMeta?.help_text && <p className="text-xs text-brand-teal-dark dark:text-brand-teal-bright mb-2">{campoMeta.help_text}</p>}
          <div className="flex flex-col md:flex-row items-stretch gap-3">
            <div className="flex-1 min-w-0 bg-surface border border-border rounded-lg p-3">
              <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">
                Atributo en fuente de datos
              </p>
              <div className="inline-block text-sm font-semibold text-fg bg-panel border border-border rounded-md px-2 py-1">
                {col.nombre}
              </div>
              {muestraCompleta.length > 0 && (
                <div className="text-xs text-fg-muted mt-1 flex flex-col gap-0.5">
                  {muestraCompleta.map((v, i) => (
                    <span key={i} className="font-mono">"{v}"</span>
                  ))}
                </div>
              )}
            </div>

            <span className="text-fg-subtle self-center text-lg rotate-90 md:rotate-0">→</span>

            <div className="flex-1 min-w-0 bg-surface border border-border rounded-lg p-3">
              <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">Atributo destino</p>
              <div className="text-sm font-semibold text-fg mb-1.5">
                {hayDestinoCompleto ? destinoResumen : <span className="text-fg-subtle italic font-normal">{destinoResumen}</span>}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {mostrarTipoCobertura && (
                  <select
                    value={seleccion?.tipoCobertura ? String(seleccion.tipoCobertura) : ''}
                    onChange={(e) => setTipoCoberturaColumna(idx, e.target.value ? Number(e.target.value) : null)}
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

                {mostrarGasFijo && (
                  <select
                    value={seleccion?.gasFijo ?? ''}
                    onChange={(e) => setGasFijoColumna(idx, e.target.value || null)}
                    className="bg-panel border border-border text-fg text-xs rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  >
                    <option value="">— gas —</option>
                    {gasChoices.map((c) => (
                      <option key={c.valor} value={c.valor}>
                        {c.etiqueta}
                      </option>
                    ))}
                  </select>
                )}

                {seleccion?.modelo && (
                  <button
                    type="button"
                    onClick={toggleRegex}
                    className="text-xs font-semibold text-brand-teal-dark dark:text-brand-teal-bright hover:underline whitespace-nowrap"
                  >
                    {seleccion.aplicarRegex ? 'quitar regex' : '🧩 aplicar regex al campo'}
                  </button>
                )}
              </div>

              {mostrarGasFijo && (
                <p className="text-xs text-fg-muted mt-1.5">
                  Fija a qué gas corresponde esta columna — úsalo si el archivo trae el flujo de cada gas en su
                  propia columna, en vez de una columna "gas" + una columna "valor".
                </p>
              )}

              {seleccion?.aplicarRegex && seleccion.modelo && (
                <div className="w-full flex flex-col gap-1.5 mt-2">
                  <input
                    type="text"
                    placeholder={String.raw`^SWAMP_CO2_(.+?)_\d+$`}
                    value={seleccion.regexPatron || ''}
                    onChange={(e) => setRegexPatronColumna(idx, e.target.value)}
                    className="min-w-[220px] max-w-full font-mono text-xs bg-panel border border-border rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  />
                  {sugerenciaRegexMsg && <p className="text-xs text-fg-muted">{sugerenciaRegexMsg}</p>}
                  <RegexPreview
                    col={col}
                    patron={seleccion.regexPatron || ''}
                    fuenteId={fuenteId}
                    modelo={seleccion.modelo}
                    campo={seleccion.campo}
                  />
                </div>
              )}

              {mostrarPreviewIdentidad && (
                <div className="mt-2 p-2.5 bg-panel border border-border rounded-lg">
                  <p className="text-[10px] font-bold text-fg-muted uppercase tracking-wide mb-1.5">
                    Vista previa — se guarda igual, sin transformar
                  </p>
                  <div className="flex flex-col gap-1">
                    {muestraCompleta.length === 0 ? (
                      <p className="text-xs text-fg-muted">No hay valores de muestra disponibles.</p>
                    ) : (
                      muestraCompleta.slice(0, 3).map((v, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-mono">
                          <span className="text-fg-muted">"{v}"</span>
                          <span className="text-fg-subtle">→</span>
                          <span className="text-brand-teal-dark dark:text-brand-teal-bright font-semibold">"{v}"</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {!hayDestinoCompleto && (
                <p className="text-xs text-fg-muted mt-2">selecciona un modelo y campo para ver la vista previa</p>
              )}
            </div>
          </div>

          {mostrarChoices && campoMeta && (
            <div className="mt-3">
              <ChoicesPanel idx={idx} choices={choicesEfectivos} />
            </div>
          )}

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

          {tieneNulosOpcionales && (
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

          {extrasPendientes.length > 0 && (
            <div className="pt-3 flex flex-col gap-2">
              {extrasPendientes.map(({ extra, extraIdx }) => (
                <div key={extraIdx} className="flex items-center gap-2 pl-3 border-l-2 border-border flex-wrap">
                  <span className="text-xs text-fg-muted whitespace-nowrap">↳ también:</span>
                  <select
                    value={extra.modelo}
                    onChange={(e) => actualizarExtraDestino(extraIdx, { modelo: e.target.value, campo: '' })}
                    className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-teal"
                  >
                    <option value="">— modelo —</option>
                    {[...modelosPorGrupoExtra.entries()].map(([etiqueta, modelos]) => (
                      <optgroup key={etiqueta} label={etiqueta}>
                        {modelos.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                  <select
                    value={extra.campo}
                    disabled={!extra.modelo}
                    onChange={(e) => actualizarExtraDestino(extraIdx, { campo: e.target.value })}
                    className="bg-surface border border-border text-fg text-xs rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-brand-teal disabled:opacity-50"
                  >
                    <option value="">— campo —</option>
                    {(modelosDestino[extra.modelo] ?? []).map((c) => (
                      <option key={c.nombre} value={c.nombre}>
                        {c.verbose_name || c.nombre}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => quitarExtraDestino(extraIdx)}
                    title="Quitar este destino extra"
                    className="text-fg-muted hover:text-fg text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {revisionAbierta && <ReviewModal idx={idx} onClose={() => setRevisionAbierta(false)} />}
    </div>
  )
}
