import { useEffect, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { BronceTable } from '@/components/etl-datos/BronceTable'
import { etlService } from '@/services/etl.service'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { useAuthStore } from '@/store/useAuthStore'
import { downloadFile } from '@/utils/download'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const PAGE_SIZE = 50

// Vista tipo "Excel" de la capa bronce (ver
// tasks/inprogress/rediseno-carga-flujos-co2-staging-bronce.md en el repo
// `context`): único camino de carga para Flujos/Biomasa/COS/MOM (no-torre) —
// reemplazó al asistente manual de mapeo columna por columna, retirado.
export function EtlUploadBronce() {
  const [searchParams, setSearchParams] = useSearchParams()
  const fuenteId = Number(searchParams.get('fuente') || 0) || null
  const cargaId = Number(searchParams.get('carga') || 0) || null
  const token = useAuthStore((s) => s.token)
  const queryClient = useQueryClient()

  const { data: dropdownData } = useFuentesDropdown()
  const fuenteActual = dropdownData?.fuentes.find((f) => f.id === fuenteId) ?? null

  const [procesando, setProcesando] = useState(true)
  const [mensajeProceso, setMensajeProceso] = useState('Iniciando…')
  const [errorProceso, setErrorProceso] = useState<string | null>(null)
  const yaDisparado = useRef(false)

  // Entrada con solo ?fuente= (sin ?carga=): viene de "Iniciar carga" en
  // Gestión de Datos o del dropdown "Cargar", que ya no pasan por el
  // asistente manual (EtlUpload.tsx, retirado) para obtener el carga_id.
  // Se analiza la fuente acá mismo y se agrega ?carga= a la URL para que el
  // resto del flujo (poblar/mapear/validar/promover bronce) siga igual.
  const analizandoFuente = useRef(false)
  useEffect(() => {
    if (!fuenteId || cargaId || analizandoFuente.current) return
    analizandoFuente.current = true
    setMensajeProceso('Analizando el archivo…')
    etlService
      .analizarFuente(token ?? '', fuenteId)
      .then((analisis) => {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          next.set('carga', String(analisis.carga_id))
          return next
        })
      })
      .catch((err) => {
        setErrorProceso(err instanceof Error ? err.message : 'Error al analizar el archivo.')
        setProcesando(false)
      })
  }, [fuenteId, cargaId, token, setSearchParams])

  const [hojaActiva, setHojaActiva] = useState<string | null>(null)
  const [hojas, setHojas] = useState<string[]>([])
  const [filtrosPorHoja, setFiltrosPorHoja] = useState<Record<string, Record<string, string>>>({})
  const [offset, setOffset] = useState(0)
  const [guardandoCelda, setGuardandoCelda] = useState<{ filaIdx: number; columna: string } | null>(null)
  const [mapeandoColumna, setMapeandoColumna] = useState<string | null>(null)
  const [descargando, setDescargando] = useState(false)
  const [descargarError, setDescargarError] = useState<string | null>(null)

  async function handleDescargar() {
    if (!fuenteId || !cargaId) return
    setDescargando(true)
    setDescargarError(null)
    try {
      await downloadFile(etlService.getExportarBronceUrl(fuenteId, cargaId), token)
    } catch (err) {
      setDescargarError(err instanceof Error ? err.message : 'No se pudo descargar el archivo.')
    } finally {
      setDescargando(false)
    }
  }

  const { data: camposDestino } = useQuery({
    queryKey: ['campos-destino', fuenteId],
    queryFn: () => etlService.getCamposDestino(fuenteId),
    enabled: !procesando && !errorProceso && fuenteId != null,
  })

  useEffect(() => {
    if (!fuenteId || !cargaId || yaDisparado.current) return
    yaDisparado.current = true

    async function mostrarHojas() {
      const mapeoAutomatico = await etlService.getMapeoAutomatico(token ?? '', fuenteId!, cargaId!)
      const nombresHojas = Object.keys(mapeoAutomatico.hojas)
      setHojas(nombresHojas)
      setHojaActiva(nombresHojas[0] ?? null)
      setProcesando(false)
    }

    async function correr() {
      // El drawer de "Nueva fuente de datos" (FuenteDrawer.tsx) ya puede
      // haber disparado y esperado el pipeline completo antes de navegar
      // acá -para que esta página no tenga que mostrar su propio
      // "Iniciando…"-: si ya quedó "completado", no hace falta re-disparar
      // todo el pipeline (poblar/mapear/validar/promover) de nuevo.
      const previo = await etlService.estadoImportacion(token ?? '', fuenteId!, cargaId!).catch(() => null)
      if (previo?.estado === 'completado') {
        await mostrarHojas()
        return
      }
      try {
        await etlService.procesarBronce(token ?? '', fuenteId!, cargaId!)
      } catch {
        // Si ya hay un proceso en curso (409), seguimos al polling igual.
      }
      for (;;) {
        await sleep(1200)
        const estado = await etlService.estadoImportacion(token ?? '', fuenteId!, cargaId!)
        setMensajeProceso(estado.mensaje || '')
        if (estado.estado === 'completado') {
          await mostrarHojas()
          return
        }
        if (estado.estado === 'error') {
          setErrorProceso(estado.mensaje || 'Error al procesar la carga a la capa bronce.')
          setProcesando(false)
          return
        }
      }
    }
    correr()
  }, [fuenteId, cargaId, token])

  const filtrosHoja = (hojaActiva && filtrosPorHoja[hojaActiva]) || {}

  const { data: bronceData, isLoading: cargandoBronce } = useQuery({
    queryKey: ['bronce', fuenteId, cargaId, hojaActiva, filtrosHoja, offset],
    queryFn: () =>
      etlService.listarBronce(token ?? '', fuenteId!, cargaId!, hojaActiva!, filtrosHoja, offset, PAGE_SIZE),
    enabled: !procesando && !errorProceso && Boolean(fuenteId && cargaId && hojaActiva),
  })

  function handleFiltroChange(columna: string, valor: string) {
    if (!hojaActiva) return
    setOffset(0)
    setFiltrosPorHoja((prev) => ({ ...prev, [hojaActiva]: { ...prev[hojaActiva], [columna]: valor } }))
  }

  async function handleEditarCelda(filaIdx: number, columna: string, valor: string) {
    if (!fuenteId || !cargaId || !hojaActiva) return
    setGuardandoCelda({ filaIdx, columna })
    try {
      await etlService.editarCeldaBronce(token ?? '', fuenteId, cargaId, hojaActiva, filaIdx, columna, valor)
      queryClient.invalidateQueries({ queryKey: ['bronce', fuenteId, cargaId, hojaActiva] })
    } finally {
      setGuardandoCelda(null)
    }
  }

  async function handleMapearColumna(
    columna: string,
    modeloDestino: string,
    campoDestino: string,
    tipoCobertura: number | null,
    mapeoValores: Record<string, string>
  ) {
    if (!fuenteId || !cargaId || !hojaActiva) return
    setMapeandoColumna(columna)
    try {
      await etlService.postMapeo(
        token ?? '',
        fuenteId,
        cargaId,
        hojaActiva,
        [
          {
            columna_origen: columna,
            modelo_destino: modeloDestino,
            campo_destino: campoDestino,
            transformacion: 'directo',
            tipo_cobertura: tipoCobertura,
            mapeo_valores: Object.keys(mapeoValores).length > 0 ? mapeoValores : undefined,
          },
        ],
        true
      )
      // El mapeo nuevo no se aplica solo -hay que volver a correr el
      // pipeline bronce (poblar es idempotente, lo que sí corre de nuevo es
      // mapear automático + validar/promover) para que esta columna entre
      // en la próxima validación/promoción.
      await etlService.procesarBronce(token ?? '', fuenteId, cargaId)
      for (;;) {
        await sleep(1200)
        const estado = await etlService.estadoImportacion(token ?? '', fuenteId, cargaId)
        if (estado.estado === 'completado' || estado.estado === 'error') break
      }
      queryClient.invalidateQueries({ queryKey: ['bronce', fuenteId, cargaId, hojaActiva] })
    } finally {
      setMapeandoColumna(null)
    }
  }

  const columnas = bronceData?.filas[0] ? Object.keys(bronceData.filas[0].celdas) : []

  return (
    <div className="flex-1 p-6 flex flex-col gap-1 max-w-6xl mx-auto w-full">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <Link to="/data" className="text-xs font-semibold text-brand-teal hover:underline">
            ← Volver a Gestión de Datos
          </Link>
          <h1 className="text-xl font-bold text-fg mt-1">Vista tipo Excel</h1>
          {fuenteActual ? (
            <p className="text-sm text-fg-muted mt-1">
              Fuente: <span className="font-semibold text-fg">{fuenteActual.nombre}</span>
            </p>
          ) : !fuenteId ? (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">Falta el parámetro ?fuente= en la URL.</p>
          ) : null}
        </div>

        {!procesando && !errorProceso && fuenteId && cargaId && (
          <div className="flex flex-col items-end gap-1">
            <button
              type="button"
              onClick={handleDescargar}
              disabled={descargando}
              className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-60 text-white text-sm font-semibold px-4 py-2 rounded-md transition-colors whitespace-nowrap"
            >
              {descargando ? 'Descargando…' : '⬇ Descargar Excel'}
            </button>
            {descargarError && <p className="text-xs text-red-600 dark:text-red-400 max-w-xs text-right">{descargarError}</p>}
          </div>
        )}
      </div>

      {procesando && (
        <Card className="mt-4">
          <div className="flex flex-col items-center justify-center py-14 gap-3 text-center">
            <div className="w-10 h-10 border-4 border-brand-teal border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold text-fg">{mensajeProceso}</p>
            <p className="text-xs text-fg-muted max-w-sm">
              Cargando el archivo completo a la capa bronce, mapeando automático las columnas que coinciden con la
              plantilla, y promoviendo las filas sin errores al modelo estructurado.
            </p>
          </div>
        </Card>
      )}

      {errorProceso && (
        <div className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-500 rounded-md px-3.5 py-3">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">✗ {errorProceso}</p>
        </div>
      )}

      {!procesando && !errorProceso && (
        <>
          {hojas.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {hojas.map((hoja) => (
                <button
                  key={hoja}
                  type="button"
                  onClick={() => {
                    setHojaActiva(hoja)
                    setOffset(0)
                  }}
                  disabled={hoja === hojaActiva}
                  className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border transition-colors ${
                    hoja === hojaActiva
                      ? 'bg-brand-teal-light dark:bg-brand-teal/10 border-brand-teal text-brand-teal-dark dark:text-brand-teal-bright cursor-default'
                      : 'bg-surface border-border text-fg-muted hover:text-fg'
                  }`}
                >
                  {hoja === hojaActiva ? '✓ ' : ''}
                  {hoja}
                </button>
              ))}
            </div>
          )}

          {cargandoBronce ? (
            <p className="text-sm text-fg-muted mt-4">Cargando filas…</p>
          ) : bronceData ? (
            <>
              <p className="text-xs text-fg-muted mt-3">
                {bronceData.total.toLocaleString()} filas · click en una celda para corregirla
              </p>
              <BronceTable
                columnas={columnas}
                filas={bronceData.filas}
                erroresPorColumna={bronceData.errores_por_columna}
                columnasMapeadas={bronceData.columnas_mapeadas}
                filtros={filtrosHoja}
                onFiltroChange={handleFiltroChange}
                onEditarCelda={handleEditarCelda}
                guardandoCelda={guardandoCelda}
                camposDestino={camposDestino ?? null}
                fuenteId={fuenteId}
                cargaId={cargaId}
                hoja={hojaActiva ?? ''}
                onMapearColumna={handleMapearColumna}
                mapeandoColumna={mapeandoColumna}
              />
              <div className="flex items-center gap-2.5 mt-2">
                <button
                  type="button"
                  disabled={offset === 0}
                  onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                  className="bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                >
                  ← Anterior
                </button>
                <button
                  type="button"
                  disabled={offset + PAGE_SIZE >= bronceData.total}
                  onClick={() => setOffset(offset + PAGE_SIZE)}
                  className="bg-surface border border-border text-fg-muted hover:text-fg disabled:opacity-40 text-xs font-semibold px-3 py-1.5 rounded-md transition-colors"
                >
                  Siguiente →
                </button>
                <span className="text-xs text-fg-muted">
                  {offset + 1}–{Math.min(offset + PAGE_SIZE, bronceData.total)} de {bronceData.total}
                </span>
              </div>
            </>
          ) : null}
        </>
      )}
    </div>
  )
}
