import { Card } from '@/components/common/Card'
import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { DESCRIPCION_SECCION, seccionesReales } from '@/utils/etlMapeo'

const SECCIONES_OPCIONALES = ['Sitio', 'Clima']

interface Props {
  onEmpezar: () => void
  onVolver: () => void
}

export function ResumenAnalisis({ onEmpezar, onVolver }: Props) {
  const { columnas, mapeoSeleccion, camposDestino, sheets, hojas, hojaActiva, totalFilas } = useEtlUploadStore()

  if (!camposDestino) return null

  // El mapeo sugerido -por nombre de columna- ya se calculó para TODAS las
  // hojas del archivo al analizarlo (no solo la activa) -ver
  // construirSnapshotHoja en el store-. Acá se agregan esas hojas para que
  // el resumen refleje lo que ya se mapeó automáticamente en todo el
  // archivo, no solo en la hoja que quedó activa.
  const hojasMapeables = sheets.filter((h) => !h.toLowerCase().includes('diccionario'))
  const snapshotDeHoja = (hoja: string) =>
    hoja === hojaActiva ? { columnas, mapeoSeleccion } : (hojas[hoja] ?? { columnas: [], mapeoSeleccion: {} })
  const columnasTotales = hojasMapeables.reduce((n, h) => n + snapshotDeHoja(h).columnas.length, 0)

  let mapeadas = 0
  let ignoradas = 0
  let sugeridas = 0
  const grupoDeModelo = (modelo: string) => camposDestino.grupos[modelo] ?? null
  const secciones = seccionesReales(camposDestino.grupos)
  const columnasPorSeccion = new Map<number, number>()
  hojasMapeables.forEach((hoja) => {
    const snap = snapshotDeHoja(hoja)
    snap.columnas.forEach((_, idx) => {
      const sel = snap.mapeoSeleccion[idx]
      if (!sel) return
      if (!sel.modelo) {
        ignoradas++
        return
      }
      mapeadas++
      if (sel.sugerido) sugeridas++
      const g = grupoDeModelo(sel.modelo)
      if (!g) return
      columnasPorSeccion.set(g.orden, (columnasPorSeccion.get(g.orden) ?? 0) + 1)
    })
  })
  const sinMapear = columnasTotales - mapeadas - ignoradas
  const recuperadas = mapeadas - sugeridas

  return (
    <Card title="Paso 3 — Qué encontramos y qué sigue">
      <div className="flex flex-col gap-5">
        <div className="bg-surface border border-border rounded-md px-3.5 py-3">
          <p className="text-sm text-fg">
            Estás en el módulo <strong>ETL</strong>: el objetivo es cargar tu archivo siguiendo el{' '}
            <strong>modelo de datos</strong> de Colflux. Para eso hay que registrar la información en orden —
            primero la <strong>Unidad Experimental</strong>, luego la <strong>Unidad de Muestreo</strong>, y así
            sucesivamente — porque cada sección depende de que la anterior ya exista en la base.
          </p>
          <p className="text-sm text-fg-muted mt-1.5">No te preocupes por memorizar el orden: te vamos a guiar sección por sección.</p>
        </div>

        <div>
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">El archivo</p>
          <p className="text-sm text-fg">
            {sheets.length > 1 ? (
              <>
                {columnasTotales} columnas en {hojasMapeables.length} hoja{hojasMapeables.length === 1 ? '' : 's'} ·
                hoja activa "{hojaActiva}" ({totalFilas.toLocaleString()} filas)
              </>
            ) : (
              <>{columnas.length} columnas · {totalFilas.toLocaleString()} filas detectadas</>
            )}
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">Qué se mapeó ya</p>
          <p className="text-sm text-fg">
            {mapeadas} de {columnasTotales} columnas ya tienen un destino
            {sheets.length > 1 && ' (en todas las hojas)'}
            {recuperadas > 0 && <> — {recuperadas} recuperadas de una carga anterior de esta fuente</>}
            {sugeridas > 0 && <> {recuperadas > 0 ? 'y' : '—'} {sugeridas} sugeridas ✨ por el nombre de la columna</>}
            .
          </p>
          <p className="text-sm text-fg-muted mt-1">
            {sinMapear > 0
              ? `${sinMapear} columna${sinMapear > 1 ? 's' : ''} todavía sin destino`
              : 'No quedan columnas sin destino'}
            {ignoradas > 0 && `, ${ignoradas} marcada${ignoradas > 1 ? 's' : ''} para ignorar`}. Vas a poder revisar
            y corregir cualquiera de estos destinos en el siguiente paso.
          </p>
        </div>

        <div>
          <p className="text-xs font-bold text-fg-muted uppercase tracking-wide mb-1.5">
            Cómo vamos a avanzar
          </p>
          <p className="text-sm text-fg-muted mb-2">
            Sección por sección, en este orden. Cada una depende de que la anterior ya esté guardada en la base.
          </p>
          <ol className="flex flex-col">
            {secciones.map((s, i) => {
              const opcional = SECCIONES_OPCIONALES.includes(s.nombre)
              const n = columnasPorSeccion.get(s.orden) ?? 0
              const asignada = n > 0
              const esUltima = i === secciones.length - 1
              return (
                <li key={s.orden} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                        asignada
                          ? 'bg-brand-teal text-white'
                          : 'bg-surface border border-border text-fg-muted'
                      }`}
                    >
                      {i + 1}
                    </div>
                    {!esUltima && <div className="w-px flex-1 bg-border my-1" />}
                  </div>
                  <div className={`flex-1 ${esUltima ? 'pb-0' : 'pb-3.5'}`}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-fg">
                        {s.icono} {s.nombre}
                      </span>
                      {opcional && (
                        <span className="text-[10px] font-bold text-fg-muted bg-surface border border-border px-1.5 py-0.5 rounded-full">
                          opcional
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          asignada
                            ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright'
                            : 'bg-surface border border-border text-fg-subtle'
                        }`}
                      >
                        {n > 0 ? `${n} columna${n > 1 ? 's' : ''} asignada${n > 1 ? 's' : ''}` : 'sin columnas todavía'}
                      </span>
                    </div>
                    {DESCRIPCION_SECCION[s.nombre] && (
                      <p className="text-xs text-fg-muted mt-0.5">{DESCRIPCION_SECCION[s.nombre]}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onEmpezar}
            className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
          >
            Empezar mapeo →
          </button>
          <button
            type="button"
            onClick={onVolver}
            className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2.5 rounded-md transition-colors"
          >
            ← Elegir otra fuente
          </button>
        </div>
      </div>
    </Card>
  )
}
