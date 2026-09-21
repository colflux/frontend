import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { SeccionNav } from '@/components/etl-upload/SeccionNav'
import { MapeoList } from '@/components/etl-upload/MapeoList'
import { PreviewModal } from '@/components/etl-upload/PreviewModal'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { useAnalizarFuente } from '@/hooks/useAnalizarFuente'
import { useGuardarAvance } from '@/hooks/useGuardarAvance'
import { usePrevisualizarSeccion, useImportarSeccion, esError } from '@/hooks/useSeccionMutations'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { seccionesDisponibles, seccionBloqueada, SIN_MAPEAR_ORDEN } from '@/utils/etlMapeo'
import type { DetalleModeloPreview, FuenteDatos } from '@/types'

const SECCIONES_OPCIONALES = ['Sitio', 'Clima']

function Stepper({ step }: { step: 1 | 2 }) {
  const pasos = [
    { n: 1, label: 'Analizar fuente' },
    { n: 2, label: 'Mapear y guardar por sección' },
  ]
  return (
    <div className="flex items-center gap-3 py-4">
      {pasos.map((p, i) => (
        <div key={p.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                p.n < step
                  ? 'bg-brand-teal text-white'
                  : p.n === step
                    ? 'bg-brand-teal-dark text-white'
                    : 'bg-surface border border-border text-fg-muted'
              }`}
            >
              {p.n < step ? '✓' : p.n}
            </div>
            <span className={`text-sm font-semibold ${p.n === step ? 'text-fg' : 'text-fg-muted'}`}>
              {p.label}
            </span>
          </div>
          {i < pasos.length - 1 && <div className="w-10 h-px bg-border" />}
        </div>
      ))}
    </div>
  )
}

function badgeClass(kind: 'tipo' | 'estado') {
  return kind === 'tipo'
    ? 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400'
    : 'bg-surface border border-border text-fg-muted'
}

export function EtlUpload() {
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedFuenteId = searchParams.get('fuente')

  const { data: dropdownData, isLoading: fuentesLoading } = useFuentesDropdown()
  const store = useEtlUploadStore()
  const analizar = useAnalizarFuente()

  const [archivo, setArchivo] = useState<File | null>(null)

  const fuentes = dropdownData?.fuentes ?? []
  const fuenteActual: FuenteDatos | null =
    fuentes.find((f) => f.id === store.fuenteId) ?? null

  useEffect(() => {
    if (fuentesLoading || fuentes.length === 0) return
    if (store.fuenteId != null) return
    if (requestedFuenteId) {
      const fuente = fuentes.find((f) => String(f.id) === requestedFuenteId)
      if (fuente) store.setFuenteId(fuente.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuentesLoading, fuentes, requestedFuenteId])

  const bloqueada = fuenteActual?.estado === 'completo' && fuenteActual.ultima_carga_importada_id != null
  const tieneOrigenRegistrado = Boolean(fuenteActual?.url && fuenteActual.url.trim())

  const noEncontrada = Boolean(
    requestedFuenteId &&
      !fuentesLoading &&
      fuentes.length > 0 &&
      store.fuenteId == null &&
      !fuentes.some((f) => String(f.id) === requestedFuenteId)
  )

  function handleSeleccionarFuente(idStr: string) {
    const id = idStr ? Number(idStr) : null
    store.setFuenteId(id)
    setArchivo(null)
    const next = new URLSearchParams(searchParams)
    if (id != null) next.set('fuente', String(id))
    else next.delete('fuente')
    setSearchParams(next, { replace: true })
  }

  async function handleAnalizar() {
    if (!store.fuenteId) return
    analizar.mutate({ fuenteId: store.fuenteId, archivo: archivo ?? undefined })
  }

  const errorAnalizar = analizar.isError
    ? analizar.error instanceof Error
      ? analizar.error.message
      : 'Error desconocido'
    : null

  // ── Paso 2: guardar avance / guardar sección + preview ──────────────────
  const guardarAvance = useGuardarAvance()
  const previsualizar = usePrevisualizarSeccion()
  const importar = useImportarSeccion()

  const [avanceGuardadoInfo, setAvanceGuardadoInfo] = useState('')
  const [errorSeccion, setErrorSeccion] = useState('')
  const [resultadoSeccion, setResultadoSeccion] = useState('')
  const [preview, setPreview] = useState<{
    ordenGrupo: number
    titulo: string
    detalle: Record<string, DetalleModeloPreview>
  } | null>(null)

  async function handleGuardarAvance() {
    setErrorSeccion('')
    try {
      await guardarAvance.mutateAsync()
      const selecciones = Object.values(store.mapeoSeleccion)
      const mapeadas = selecciones.filter((s) => s.modelo).length
      const ignoradas = selecciones.length - mapeadas
      setAvanceGuardadoInfo(
        `Avance guardado — ${new Date().toLocaleTimeString()} (${mapeadas} de ${store.columnas.length} columnas mapeadas${ignoradas ? `, ${ignoradas} ignorada${ignoradas > 1 ? 's' : ''}` : ''})`
      )
    } catch (err) {
      setErrorSeccion(err instanceof Error ? err.message : 'Error al guardar el avance.')
    }
  }

  async function handleGuardarSeccion() {
    setErrorSeccion('')
    setResultadoSeccion('')
    const ordenGrupo = store.seccionIdx
    const data = await previsualizar.mutateAsync(ordenGrupo)
    if (esError(data)) {
      setResultadoSeccion('')
      setErrorSeccion(
        `✗ ${data.resumen.total_errores} error(es) — no se guardó nada de esta sección. Revisa las columnas mapeadas.`
      )
      return
    }
    const seccion = seccionesDisponibles(store.camposDestino!.grupos).find((s) => s.orden === ordenGrupo)
    setPreview({ ordenGrupo, titulo: seccion?.nombre ?? '', detalle: data.detalle })
  }

  async function handleConfirmarPreview() {
    if (!preview) return
    const data = await importar.mutateAsync(preview.ordenGrupo)
    if (esError(data)) {
      setPreview(null)
      setErrorSeccion(
        `✗ ${data.resumen.total_errores} error(es) — no se guardó nada de esta sección. Revisa las columnas mapeadas.`
      )
      return
    }
    const partes = Object.entries(data.modelos).map(
      ([m, c]) => `${m}: ${c.creados} nuevo${c.creados === 1 ? '' : 's'}, ${c.reutilizados} reutilizado${c.reutilizados === 1 ? '' : 's'}`
    )
    setResultadoSeccion(`✓ Guardado en base de datos${partes.length ? ' — ' + partes.join(' · ') : ''}`)
    setPreview(null)

    if (!data.completo) {
      const secciones = seccionesDisponibles(store.camposDestino!.grupos)
      const idx = secciones.findIndex((s) => s.orden === preview.ordenGrupo)
      if (idx !== -1 && idx < secciones.length - 1) {
        store.setSeccionIdx(secciones[idx + 1].orden)
      }
    }
  }

  function handleSinDatos() {
    const ordenGrupo = store.seccionIdx
    const secciones = seccionesDisponibles(store.camposDestino!.grupos)
    const seccionActual = secciones.find((s) => s.orden === ordenGrupo)
    const confirmado = window.confirm(
      `¿Confirmas que el archivo no trae datos para "${seccionActual ? seccionActual.nombre : 'esta sección'}"? ` +
        'No se creará ni actualizará ningún registro y se avanzará a la siguiente sección.'
    )
    if (!confirmado) return
    store.marcarSeccionGuardada(ordenGrupo)
    setResultadoSeccion('Sección omitida — sin datos en el archivo.')
    const idx = secciones.findIndex((s) => s.orden === ordenGrupo)
    const siguiente = secciones.find((s, i) => i > idx && !seccionBloqueada(s.orden, store.camposDestino!.grupos, store.seccionesGuardadas))
    if (siguiente) store.setSeccionIdx(siguiente.orden)
  }

  const seccionActualInfo = store.camposDestino
    ? seccionesDisponibles(store.camposDestino.grupos).find((s) => s.orden === store.seccionIdx)
    : null
  const esSinMapear = store.seccionIdx === SIN_MAPEAR_ORDEN
  const esOpcional = !esSinMapear && seccionActualInfo && SECCIONES_OPCIONALES.includes(seccionActualInfo.nombre)
  const cargaCompleta = Boolean(
    store.camposDestino &&
      seccionesDisponibles(store.camposDestino.grupos)
        .filter((s) => s.orden !== SIN_MAPEAR_ORDEN)
        .every((s) => store.seccionesGuardadas.has(s.orden))
  )

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'etl-upload',
    steps: [
      {
        element: '[data-tour="etlupload-fuente"]',
        popover: {
          title: 'Fuente de datos',
          description: 'Elige la fuente a analizar, o sube el archivo directamente si no está registrado.',
        },
      },
      {
        element: '[data-tour="etlupload-analizar"]',
        popover: {
          title: 'Analizar archivo',
          description: 'Lee el archivo y prepara las columnas para mapearlas en el siguiente paso.',
        },
      },
      {
        element: '[data-tour="etlupload-secciones"]',
        popover: {
          title: 'Secciones del mapeo',
          description: 'Avanza sección por sección: cada una agrupa las entidades que dependen de las anteriores.',
        },
      },
      {
        element: '[data-tour="etlupload-mapeo"]',
        popover: {
          title: 'Asignar destino de columnas',
          description: 'Asigna a qué modelo y campo va cada columna del archivo.',
        },
      },
      {
        element: '[data-tour="etlupload-guardar"]',
        popover: {
          title: 'Validar y guardar',
          description: 'Cuando termines de mapear la sección, valida e impórtala a la base de datos.',
        },
      },
    ],
  })

  return (
    <div className={`flex-1 p-6 flex flex-col gap-1 mx-auto w-full ${store.step === 2 ? 'max-w-4xl' : 'max-w-3xl'}`}>
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Cargar fuente de datos</h1>
        {fuenteActual ? (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-sm font-semibold text-fg">{fuenteActual.nombre}</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass('tipo')}`}>
              {fuenteActual.tipo_label || fuenteActual.tipo}
            </span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeClass('estado')}`}>
              {fuenteActual.estado_label || fuenteActual.estado}
            </span>
          </div>
        ) : (
          <p className="text-sm text-fg-muted mt-1">Selecciona una fuente de datos para iniciar la carga.</p>
        )}
      </div>

      {!bloqueada && <Stepper step={store.step} />}

      {bloqueada && fuenteActual ? (
        <Card title="Esta fuente ya fue cargada">
          <p className="text-sm text-fg-muted mb-4">
            El mapeo ya se definió y los datos ya se importaron para esta fuente. Para evitar mapeos duplicados o
            inconsistentes, el asistente de carga queda bloqueado. Usa las siguientes pantallas para consultar lo
            que se cargó:
          </p>
          <div className="flex gap-2.5 flex-wrap">
            <Link
              to={`/etl/datos?fuente=${fuenteActual.id}&carga=${fuenteActual.ultima_carga_importada_id}`}
              className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
            >
              📊 Ver datos cargados
            </Link>
            <Link
              to={`/etl/mapeo?fuente=${fuenteActual.id}&carga=${fuenteActual.ultima_carga_importada_id}`}
              className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              🔗 Ver mapeo de columnas
            </Link>
          </div>
        </Card>
      ) : store.step === 1 ? (
        <Card title="Paso 1 — Analizar fuente">
          <p className="text-sm text-fg-muted mb-4">
            Selecciona la fuente de datos para analizar el archivo registrado en ella.
          </p>

          <div className="flex flex-col gap-4">
            <div data-tour="etlupload-fuente" className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Fuente de datos</label>
              <select
                value={store.fuenteId ?? ''}
                onChange={(e) => handleSeleccionarFuente(e.target.value)}
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              >
                <option value="">
                  {fuentesLoading ? 'Cargando fuentes…' : '— Selecciona una fuente —'}
                </option>
                {fuentes.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nombre} · {f.tipo_label || f.tipo} · {f.proyecto?.nombre || 'sin proyecto'}
                  </option>
                ))}
              </select>
              <span className="text-xs text-fg-muted">
                {noEncontrada
                  ? `Fuente con id ${requestedFuenteId} no encontrada. Escoge otra fuente disponible para continuar.`
                  : fuenteActual
                    ? 'La carga quedará asociada a esta fuente.'
                    : 'Puedes abrir esta pantalla desde una fuente o escogerla aquí.'}
              </span>
            </div>

            {tieneOrigenRegistrado && (
              <div className="bg-surface border border-border rounded-md px-3.5 py-3">
                <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1">
                  Archivo registrado en la fuente
                </p>
                <p className="text-xs font-mono text-fg break-all">{fuenteActual?.url}</p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">O sube el archivo directamente</label>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="text-sm text-fg"
              />
              <span className="text-xs text-fg-muted">
                Si seleccionas un archivo aquí, se usará en lugar de la ruta/enlace registrado y quedará guardado
                como el archivo de la fuente.
              </span>
            </div>

            {errorAnalizar && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{errorAnalizar}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                data-tour="etlupload-analizar"
                onClick={handleAnalizar}
                disabled={!store.fuenteId || (!archivo && !tieneOrigenRegistrado) || analizar.isPending}
                className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
              >
                {analizar.isPending ? 'Analizando…' : 'Analizar archivo →'}
              </button>
              <Link
                to="/data"
                className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
              >
                ← Volver
              </Link>
            </div>
          </div>
        </Card>
      ) : (
        <>
          <p className="text-sm text-fg-muted mb-1">
            Avanza sección por sección: cada una agrupa las entidades que dependen de las anteriores. Asigna el
            destino de cada columna en el panel <strong>Sin mapear</strong>; una vez asignada, pasa a su sección.
            Cuando termines de mapear una sección, dale <strong>Validar y guardar</strong> para insertarla en la
            base y avanzar a la siguiente.
          </p>
          <p className="text-xs text-fg-muted mb-3">
            {store.columnas.length} columnas · {store.totalFilas.toLocaleString()} filas detectadas
            {store.sheets.length > 0 && ` · hoja "${store.hojaActiva}"`}
          </p>

          <div className="border border-border rounded-xl bg-panel">
            <div data-tour="etlupload-secciones" className="px-4 pt-4">
              <SeccionNav />
            </div>
            <div className="px-4 pt-3">
              {seccionActualInfo && (
                <p className="text-sm font-bold text-fg mb-2">
                  {seccionActualInfo.icono} {seccionActualInfo.nombre}
                </p>
              )}
            </div>
            <div data-tour="etlupload-mapeo" className="px-4 pb-2">
              <MapeoList />
            </div>
            <div className="px-4 py-3 border-t border-border flex items-center gap-2.5 flex-wrap">
              {!esSinMapear && (
                <button
                  type="button"
                  data-tour="etlupload-guardar"
                  onClick={handleGuardarSeccion}
                  disabled={previsualizar.isPending || importar.isPending}
                  className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
                >
                  {previsualizar.isPending ? 'Validando…' : '✅ Validar y guardar esta sección'}
                </button>
              )}
              {esOpcional && (
                <button
                  type="button"
                  onClick={handleSinDatos}
                  className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
                >
                  🚫 No tengo datos de {seccionActualInfo?.nombre} en este archivo
                </button>
              )}
              {resultadoSeccion && <span className="text-sm text-fg-muted basis-full">{resultadoSeccion}</span>}
              {errorSeccion && (
                <span className="text-sm font-semibold text-red-600 dark:text-red-400 basis-full">
                  {errorSeccion}
                </span>
              )}
            </div>
          </div>

          {cargaCompleta && (
            <div className="mt-4 bg-brand-teal-light dark:bg-brand-teal/10 border border-brand-teal rounded-lg px-4 py-3.5">
              <p className="text-sm font-bold text-brand-teal-dark dark:text-brand-teal-bright">
                🎉 Carga completa — todas las secciones mapeadas fueron validadas e importadas.
              </p>
              <Link
                to={`/etl/datos?fuente=${store.fuenteId}&carga=${store.cargaId}`}
                className="inline-block mt-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
              >
                📊 Ver datos cargados
              </Link>
            </div>
          )}

          <div className="flex items-center gap-2.5 flex-wrap mt-4">
            <button
              type="button"
              onClick={handleGuardarAvance}
              disabled={guardarAvance.isPending}
              className="bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-50 text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              {guardarAvance.isPending ? 'Guardando…' : '💾 Guardar avance'}
            </button>
            <button
              type="button"
              onClick={() => store.setStep(1)}
              className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              ← Volver al paso 1
            </button>
            {avanceGuardadoInfo && <span className="text-xs text-fg-muted">{avanceGuardadoInfo}</span>}
          </div>
        </>
      )}

      {preview && (
        <PreviewModal
          open
          tituloSeccion={preview.titulo}
          detalle={preview.detalle}
          ordenModelo={(m) => store.camposDestino?.grupos[m]?.orden_modelo ?? 999}
          loading={importar.isPending}
          onConfirmar={handleConfirmarPreview}
          onCancelar={() => {
            setPreview(null)
            setResultadoSeccion('Guardado cancelado tras revisar la vista previa.')
          }}
        />
      )}
    </div>
  )
}
