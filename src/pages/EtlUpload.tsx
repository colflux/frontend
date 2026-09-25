import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { SeccionNav } from '@/components/etl-upload/SeccionNav'
import { MapeoList } from '@/components/etl-upload/MapeoList'
import { AnalisisEDA } from '@/components/etl-upload/AnalisisEDA'
import { ResumenAnalisis } from '@/components/etl-upload/ResumenAnalisis'
import { ConfirmModal } from '@/components/etl-upload/ConfirmModal'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { useAnalizarFuente } from '@/hooks/useAnalizarFuente'
import { useGuardarAvance } from '@/hooks/useGuardarAvance'
import { useImportarSeccion, useVaciarMapeoHoja, esError } from '@/hooks/useSeccionMutations'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { seccionesDisponibles, seccionBloqueada, SIN_MAPEAR_ORDEN } from '@/utils/etlMapeo'
import type { ColumnaConErrores, FuenteDatos } from '@/types'

const SECCIONES_OPCIONALES = [
  'Sitio',
  'Clima',
  'Cobertura y Vegetación',
  'Carbono Orgánico del Suelo (COS)',
  'Biomasa',
  'Materia Orgánica Muerta (MOM)',
  'Muestras GEI',
]

function Stepper({ step }: { step: 1 | 2 | 3 | 4 }) {
  const pasos = [
    { n: 1, label: 'Analizar fuente' },
    { n: 2, label: 'Análisis EDA' },
    { n: 3, label: 'Qué encontramos' },
    { n: 4, label: 'Mapear y guardar por sección' },
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
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const requestedFuenteId = searchParams.get('fuente')
  const modoCorreccion = searchParams.get('corregir') === '1'

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

  // Si la fuente ya tiene un archivo registrado (se subió/analizó antes),
  // no tiene sentido pedirle al usuario que vuelva a pasar por la pantalla
  // de "Analizar archivo" cada vez que reentra -el backend ya sabe leer
  // ese archivo sin que se lo vuelvan a subir-, así que se dispara el
  // análisis automáticamente y se salta directo al EDA/mapeo.
  const autoAnalizadoRef = useRef<number | null>(null)
  useEffect(() => {
    if (bloqueada && !modoCorreccion) return
    if (store.step !== 1 || store.fuenteId == null) return
    if (!tieneOrigenRegistrado) return
    if (autoAnalizadoRef.current === store.fuenteId) return
    if (analizar.isPending) return
    autoAnalizadoRef.current = store.fuenteId
    analizar.mutate({ fuenteId: store.fuenteId })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.step, store.fuenteId, tieneOrigenRegistrado, bloqueada, modoCorreccion])

  // Cambia qué hoja se está mapeando/analizando -todas las hojas del
  // archivo ya se analizaron en un solo llamado a "Analizar archivo", así
  // que esto es un cambio de estado local (sin ir al backend): conserva el
  // avance de mapeo de cada hoja por separado.
  function handleCambiarHoja(hoja: string) {
    store.setHojaActiva(hoja)
  }

  const errorAnalizar = analizar.isError
    ? analizar.error instanceof Error
      ? analizar.error.message
      : 'Error desconocido'
    : null

  // ── Paso 2: guardar avance / guardar sección ─────────────────────────────
  const guardarAvance = useGuardarAvance()
  const importar = useImportarSeccion()
  const vaciarMapeoHoja = useVaciarMapeoHoja()

  const [avanceGuardadoInfo, setAvanceGuardadoInfo] = useState('')
  const [errorSeccion, setErrorSeccion] = useState<{ resumen: string; columnas: ColumnaConErrores[] } | null>(null)
  const [resultadoSeccion, setResultadoSeccion] = useState('')
  const [confirmSinDatos, setConfirmSinDatos] = useState<{ ordenGrupo: number; nombreSeccion: string } | null>(null)
  const [confirmVaciarHoja, setConfirmVaciarHoja] = useState<string | null>(null)

  async function confirmarVaciarHoja() {
    if (!confirmVaciarHoja) return
    await vaciarMapeoHoja.mutateAsync(confirmVaciarHoja)
    setConfirmVaciarHoja(null)
  }

  async function handleGuardarAvance() {
    setErrorSeccion(null)
    try {
      await guardarAvance.mutateAsync()
      const selecciones = Object.values(store.mapeoSeleccion)
      const mapeadas = selecciones.filter((s) => s.modelo).length
      const ignoradas = selecciones.length - mapeadas
      setAvanceGuardadoInfo(
        `Avance guardado — ${new Date().toLocaleTimeString()} (${mapeadas} de ${store.columnas.length} columnas mapeadas${ignoradas ? `, ${ignoradas} ignorada${ignoradas > 1 ? 's' : ''}` : ''})`
      )
    } catch (err) {
      setErrorSeccion({
        resumen: err instanceof Error ? err.message : 'Error al guardar el avance.',
        columnas: [],
      })
    }
  }

  async function handleGuardarSeccion() {
    setErrorSeccion(null)
    setResultadoSeccion('')
    const ordenGrupo = store.seccionIdx
    try {
      const data = await importar.mutateAsync(ordenGrupo)
      if (esError(data)) {
        setErrorSeccion({
          resumen: `✗ ${data.resumen.total_errores} error(es) en ${data.columnas.length} columna${data.columnas.length === 1 ? '' : 's'} — no se guardó nada de esta sección.`,
          columnas: data.columnas,
        })
        return
      }
      const partes = Object.entries(data.modelos).map(
        ([m, c]) => `${m}: ${c.creados} nuevo${c.creados === 1 ? '' : 's'}, ${c.reutilizados} reutilizado${c.reutilizados === 1 ? '' : 's'}`
      )
      setResultadoSeccion(`✓ Guardado en base de datos${partes.length ? ' — ' + partes.join(' · ') : ''}`)

      if (data.completo) {
        // Última sección de la carga: ya no hay nada más que mapear, así
        // que en vez de dejar al usuario parado en un mensaje de éxito sin
        // salida, se lo lleva directo a ver los datos que acaba de importar.
        if (store.fuenteId != null && store.cargaId != null) {
          navigate(`/etl/datos?fuente=${store.fuenteId}&carga=${store.cargaId}`)
        }
      } else {
        const secciones = seccionesDisponibles(store.camposDestino!.grupos)
        const idx = secciones.findIndex((s) => s.orden === ordenGrupo)
        if (idx !== -1 && idx < secciones.length - 1) {
          store.setSeccionIdx(secciones[idx + 1].orden)
        }
      }
    } catch (err) {
      setErrorSeccion({
        resumen: err instanceof Error ? err.message : 'Error al guardar la sección.',
        columnas: [],
      })
    }
  }

  function handleSinDatos() {
    const ordenGrupo = store.seccionIdx
    const secciones = seccionesDisponibles(store.camposDestino!.grupos)
    const seccionActual = secciones.find((s) => s.orden === ordenGrupo)
    setConfirmSinDatos({ ordenGrupo, nombreSeccion: seccionActual ? seccionActual.nombre : 'esta sección' })
  }

  function confirmarSinDatos() {
    if (!confirmSinDatos) return
    const { ordenGrupo } = confirmSinDatos
    const secciones = seccionesDisponibles(store.camposDestino!.grupos)
    store.marcarSeccionGuardada(ordenGrupo)
    setResultadoSeccion('Sección omitida — sin datos en el archivo.')
    const idx = secciones.findIndex((s) => s.orden === ordenGrupo)
    const siguiente = secciones.find((s, i) => i > idx && !seccionBloqueada(s.orden, store.camposDestino!.grupos, store.seccionesGuardadas))
    if (siguiente) store.setSeccionIdx(siguiente.orden)
    setConfirmSinDatos(null)
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
    <div className={`flex-1 p-6 flex flex-col gap-1 mx-auto w-full ${store.step === 4 ? 'max-w-4xl' : 'max-w-3xl'}`}>
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

      {(!bloqueada || modoCorreccion) && <Stepper step={store.step} />}

      {bloqueada && !modoCorreccion && fuenteActual ? (
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
            <Link
              to={`/etl/upload?fuente=${fuenteActual.id}&corregir=1`}
              className="bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
            >
              ✏️ Registrar columnas que faltaron
            </Link>
          </div>
        </Card>
      ) : bloqueada && modoCorreccion && fuenteActual && store.step === 1 ? (
        <Card title="Modo corrección — registrar columnas sin mapear">
          <p className="text-sm text-fg-muted mb-4">
            Esta fuente ya está completa. Este modo solo permite completar columnas que quedaron sin mapear en
            campos de entidades ya guardadas (Sitio, Unidad de Muestreo, Unidad Experimental, etc.) — no vuelve a
            crear mediciones. Al analizar, se reutiliza el archivo ya registrado y se recupera automáticamente el
            mapeo anterior; solo falta completar las columnas pendientes.
          </p>
          <button
            type="button"
            onClick={handleAnalizar}
            disabled={analizar.isPending}
            className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
          >
            {analizar.isPending ? 'Analizando…' : '▶ Continuar con la corrección'}
          </button>
          {errorAnalizar && <p className="text-sm text-red-600 dark:text-red-400 mt-3">{errorAnalizar}</p>}
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
      ) : store.step === 2 ? (
        <AnalisisEDA
          onContinuar={() => store.setStep(3)}
          onVolver={() => store.setStep(1)}
          onCambiarHoja={handleCambiarHoja}
          cambiandoHoja={false}
        />
      ) : store.step === 3 ? (
        <ResumenAnalisis onEmpezar={() => store.setStep(4)} onVolver={() => store.setStep(2)} />
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

          {Object.keys(store.hojas).length > 1 && (
            <div className="mb-3">
              <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">
                Hoja que se está mapeando
              </p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(store.hojas).map(([hoja, snapshot]) => (
                  <button
                    key={hoja}
                    type="button"
                    onClick={() => handleCambiarHoja(hoja)}
                    disabled={hoja === store.hojaActiva}
                    className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors ${
                      hoja === store.hojaActiva
                        ? 'bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal text-brand-teal-dark dark:text-brand-teal-bright cursor-default'
                        : 'bg-surface border-border text-fg-muted hover:text-fg'
                    }`}
                  >
                    {hoja === store.hojaActiva ? '✓ ' : ''}
                    {hoja} ({snapshot.columnas.length} col.)
                  </button>
                ))}
              </div>
              <p className="text-xs text-fg-muted mt-1.5">
                Cada hoja mantiene su propio mapeo — cambia de pestaña para mapear otra sin perder el avance de esta.
              </p>
            </div>
          )}

          <div className="border border-border rounded-xl bg-panel">
            <div data-tour="etlupload-secciones" className="px-4 pt-4">
              <SeccionNav />
            </div>
            <div className="px-4 pt-3">
              {seccionActualInfo && (
                <>
                  <p className="text-sm font-bold text-fg mb-1">
                    {seccionActualInfo.icono} {seccionActualInfo.nombre}
                  </p>
                </>
              )}
              {seccionActualInfo?.nombre === 'Muestras GEI' &&
                (() => {
                  // "Muestras GEI" es una sola sección de destino (MuestraGEI +
                  // SubmuestraGEI), pero el archivo suele traer CO2 y CH4 en
                  // hojas separadas -mismo criterio que _HOJAS_EXPORT en el
                  // backend-. Este sub-selector solo cambia la hoja activa
                  // (cada una guarda su propio avance, ver `hojas` en el
                  // store); "Validar y guardar" sigue siendo uno solo para
                  // toda la sección, multi-hoja.
                  const hojasGas = Object.keys(store.hojas).filter((h) => /co2|ch4/i.test(h))
                  if (hojasGas.length < 2) return null
                  return (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {hojasGas.map((h) => {
                        const snap = store.hojas[h]
                        const mapeados = Object.values(snap.mapeoSeleccion).filter((m) => m.modelo).length
                        const activa = store.hojaActiva === h
                        const gas = /co2/i.test(h) ? 'CO2' : 'CH4'
                        return (
                          <span key={h} className="inline-flex items-stretch">
                            <button
                              type="button"
                              onClick={() => handleCambiarHoja(h)}
                              disabled={activa}
                              className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors ${
                                activa
                                  ? 'bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal text-brand-teal-dark dark:text-brand-teal-bright cursor-default rounded-r-none'
                                  : 'bg-surface border-border text-fg-muted hover:text-fg'
                              } ${mapeados ? 'rounded-r-none border-r-0' : ''}`}
                            >
                              {activa ? '✓ ' : ''}🫧 {gas} · {mapeados} mapeado{mapeados === 1 ? '' : 's'}
                            </button>
                            {mapeados > 0 && (
                              <button
                                type="button"
                                title={`No tengo datos de ${gas} en este archivo — borra el mapeo parcial de la hoja "${h}" para no bloquear el resto de la sección.`}
                                onClick={() => setConfirmVaciarHoja(h)}
                                className={`text-xs px-1.5 rounded-r-md border transition-colors ${
                                  activa
                                    ? 'bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal text-brand-teal-dark dark:text-brand-teal-bright'
                                    : 'bg-surface border-border text-fg-muted hover:text-red-600'
                                }`}
                              >
                                🚫
                              </button>
                            )}
                          </span>
                        )
                      })}
                    </div>
                  )
                })()}
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
                  disabled={importar.isPending}
                  className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
                >
                  {importar.isPending ? 'Guardando…' : '✅ Validar y guardar esta sección'}
                </button>
              )}
              {importar.isPending && store.progresoImportacion && (
                <div className="flex items-center gap-2 min-w-[220px]">
                  <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden">
                    <div
                      className="h-full bg-brand-teal transition-all"
                      style={{
                        width:
                          store.progresoImportacion.total > 0
                            ? `${Math.min(100, (store.progresoImportacion.actual / store.progresoImportacion.total) * 100)}%`
                            : '15%',
                      }}
                    />
                  </div>
                  <span className="text-xs text-fg-muted whitespace-nowrap">{store.progresoImportacion.mensaje}</span>
                </div>
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
                <div className="basis-full border border-red-500 rounded-lg p-3">
                  <p className="text-sm font-semibold text-red-600 dark:text-red-400">{errorSeccion.resumen}</p>
                  {errorSeccion.columnas.some((c) => c.errores?.length) && (
                    <>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {errorSeccion.columnas
                          .filter((c) => c.errores?.length)
                          .map((c) => (
                            <li key={c.columna} className="text-xs text-fg-muted">
                              <span className="font-semibold text-fg">{c.columna}</span>
                              {' — '}
                              {c.errores.length} error{c.errores.length === 1 ? '' : 'es'}
                              {c.errores[0] && (
                                <> (ej.: fila {c.errores[0].fila ?? '?'}: {c.errores[0].mensaje || c.errores[0].tipo})</>
                              )}
                            </li>
                          ))}
                      </ul>
                      <p className="text-xs text-fg-muted mt-2">
                        Corrige el mapeo de esas columnas — cada una tiene un botón{' '}
                        <span className="font-semibold text-amber-700 dark:text-amber-400">🔍 Revisar</span> con el
                        detalle completo — y vuelve a darle "Validar y guardar".
                      </p>
                    </>
                  )}
                </div>
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
              onClick={() => store.setStep(3)}
              className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              ← Volver al resumen
            </button>
            {avanceGuardadoInfo && <span className="text-xs text-fg-muted">{avanceGuardadoInfo}</span>}
          </div>
        </>
      )}

      <ConfirmModal
        open={Boolean(confirmSinDatos)}
        titulo="Confirmar sección sin datos"
        mensaje={`¿Confirmas que el archivo no trae datos para "${confirmSinDatos?.nombreSeccion ?? 'esta sección'}"? No se creará ni actualizará ningún registro y se avanzará a la siguiente sección.`}
        textoConfirmar="Sí, confirmar"
        onConfirmar={confirmarSinDatos}
        onCancelar={() => setConfirmSinDatos(null)}
      />

      <ConfirmModal
        open={Boolean(confirmVaciarHoja)}
        titulo="Vaciar mapeo de esta hoja"
        mensaje={`¿Confirmas que quieres borrar TODO el mapeo guardado de la hoja "${confirmVaciarHoja}"? Se pierde el avance de mapeo de esa hoja en esta carga — útil si se mapeó por error con esa pestaña activa. No afecta a las demás hojas.`}
        textoConfirmar="Sí, vaciar"
        onConfirmar={confirmarVaciarHoja}
        onCancelar={() => setConfirmVaciarHoja(null)}
      />
    </div>
  )
}
