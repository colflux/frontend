import { useEtlUploadStore } from '@/store/useEtlUploadStore'
import { MapeoRow } from './MapeoRow'
import { ExtraRow } from './ExtraRow'
import { AtributoRow } from './AtributoRow'
import { AtributoManualRow } from './AtributoManualRow'
import {
  SIN_MAPEAR_ORDEN,
  unidadExperimentalYaMapeada,
  origenUnidadExperimentalMapeada,
  valoresDetectadosParaCampo,
  columnasMapeadasA,
} from '@/utils/etlMapeo'

const IGNORADAS = '__ignoradas__'

// Misma paleta y orden que el diagrama del modelo de datos del prototipo.
const GRUPO_PALETTE = ['#475569', '#16a34a', '#d97706', '#db2777', '#7c3aed', '#2563eb', '#ea580c', '#0891b2', '#dc2626']

type ItemGrupo = { kind: 'col'; idx: number } | { kind: 'extra'; extraIdx: number }

export function MapeoList() {
  const {
    columnas,
    mapeoSeleccion,
    atributosManuales,
    extrasDestino,
    camposDestino,
    seccionIdx,
    agregarAtributoManual,
  } = useEtlUploadStore()

  if (!camposDestino) return null

  const grupoDeModelo = (modelo: string) => camposDestino.grupos[modelo] ?? null
  const colorDeModelo = (modelo: string) => {
    const g = grupoDeModelo(modelo)
    return g ? GRUPO_PALETTE[g.orden % GRUPO_PALETTE.length] : '#0d4f40'
  }

  // Cada entrada es { kind: 'col', idx } o { kind: 'extra', extraIdx } — un
  // destino extra ya resuelto (modelo+campo elegidos) se agrupa dentro de
  // la entidad a la que apunta, no dentro de la de su columna origen.
  const grupos = new Map<string, ItemGrupo[]>()
  columnas.forEach((_, idx) => {
    const seleccion = mapeoSeleccion[idx]
    const modelo = seleccion?.modelo || (seleccion ? IGNORADAS : '')
    grupos.set(modelo, [...(grupos.get(modelo) ?? []), { kind: 'col', idx }])
  })
  extrasDestino.forEach((extra, extraIdx) => {
    if (!extra.modelo || !extra.campo) return
    grupos.set(extra.modelo, [...(grupos.get(extra.modelo) ?? []), { kind: 'extra', extraIdx }])
  })
  atributosManuales.forEach((attr) => {
    if (attr.modelo && !grupos.has(attr.modelo)) grupos.set(attr.modelo, [])
  })
  Object.keys(camposDestino.modelos).forEach((modelo) => {
    if (!grupos.has(modelo)) grupos.set(modelo, [])
  })

  const tipoUnidadEsParcela = [
    ...valoresDetectadosParaCampo('UnidadMuestreo', 'tipo', columnas, mapeoSeleccion, atributosManuales),
  ].some((v) => v.includes('parcela'))
  const tipoUnidadEsTransecto = [
    ...valoresDetectadosParaCampo('UnidadMuestreo', 'tipo', columnas, mapeoSeleccion, atributosManuales),
  ].some((v) => v.includes('transecto'))
  const uExpMapeada = unidadExperimentalYaMapeada(columnas, mapeoSeleccion, atributosManuales)

  function modeloKeysPara(seccion: number) {
    const todos = Object.keys(camposDestino!.modelos)
    return seccion === SIN_MAPEAR_ORDEN ? todos : todos.filter((m) => grupoDeModelo(m)?.orden === seccion)
  }

  function renderGrupoEntidad(modelo: string, items: ItemGrupo[]) {
    const grupoInfo = grupoDeModelo(modelo)
    const color = colorDeModelo(modelo)
    const camposModelo = (camposDestino!.modelos[modelo] ?? []).filter((c) => !c.automatico)
    const nombresCampoModelo = new Set(camposModelo.map((c) => c.nombre))
    // Los extras cuyo campo ya es un atributo real del modelo se muestran
    // dentro de su propio AtributoRow (ver esViaExtra ahí) — acá solo quedan
    // los extras "sueltos" (campo que no está en el catálogo del modelo).
    const extras = items
      .filter((i): i is { kind: 'extra'; extraIdx: number } => i.kind === 'extra')
      .filter((i) => !nombresCampoModelo.has(extrasDestino[i.extraIdx]?.campo))
    // Los campos de camposModelo ya tienen su propio selector "escribir manual" inline
    // en AtributoRow — solo se listan aquí los atributos manuales para campos que no
    // están en esa lista (p. ej. campos automáticos, agregados vía "Agregar atributo").
    const atributosDeModelo = atributosManuales
      .map((attr, i) => ({ attr, i }))
      .filter(({ attr }) => attr.modelo === modelo && !camposModelo.some((c) => c.nombre === attr.campo))
    const mapeadosCount = camposModelo.filter(
      (c) =>
        columnasMapeadasA(modelo, c.nombre, mapeoSeleccion).length > 0 ||
        atributosManuales.some((a) => a.modelo === modelo && a.campo === c.nombre && a.valor) ||
        extrasDestino.some((e) => e.modelo === modelo && e.campo === c.nombre)
    ).length
    const transectoDesvinculado = modelo === 'Transecto' && !tipoUnidadEsTransecto
    const partes: string[] = [
      transectoDesvinculado ? 'no aplica' : `${mapeadosCount}/${camposModelo.length} atributos mapeados`,
    ]
    if (!transectoDesvinculado && extras.length) partes.push(`${extras.length} extra${extras.length > 1 ? 's' : ''}`)

    return (
      <div key={modelo} className="border border-border rounded-lg mb-4 overflow-hidden">
        <div
          className="px-4 py-2 text-sm font-bold border-l-4"
          style={{ color, background: `${color}14`, borderLeftColor: color }}
        >
          {grupoInfo && <span>{grupoInfo.icono} {grupoInfo.nombre} · </span>}
          {modelo} · {partes.join(' + ') || 'sin columnas'}
        </div>

        {modelo === 'UnidadMuestreo' &&
          (uExpMapeada ? (
            <div className="px-4 py-2.5 bg-surface text-xs text-fg-muted flex items-center gap-2 opacity-80">
              <span className="text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-100 dark:bg-blue-950/40 px-1.5 py-0.5 rounded">
                🔗 vinculado
              </span>
              mapeado desde la carga anterior
              {(() => {
                const origen = origenUnidadExperimentalMapeada(columnas, mapeoSeleccion, atributosManuales)
                return origen ? ` — viene de ${origen}` : ''
              })()}
            </div>
          ) : (
            <div className="px-4 py-2.5 bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-400">
              💡 "unidad_experimental" no está mapeada: cada unidad de muestreo se vinculará automáticamente a la
              Unidad Experimental creada para esa misma fila en la sección anterior.
            </div>
          ))}

        {modelo === 'Parcela' && (
          <div
            className={`px-4 py-2.5 text-xs ${tipoUnidadEsParcela ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400'}`}
          >
            {tipoUnidadEsParcela
              ? '🔗 Vinculada — se detectó "tipo: parcela" en Unidad de Muestreo. Mapeá aquí sus medidas.'
              : '💡 Esta sección solo aplica si el campo "tipo" de Unidad de Muestreo se mapea a "parcela".'}
          </div>
        )}

        {modelo === 'Transecto' && (
          <div
            className={`px-4 py-2.5 text-xs ${tipoUnidadEsTransecto ? 'bg-brand-teal-light dark:bg-brand-teal/10 text-brand-teal-dark dark:text-brand-teal-bright' : 'bg-surface text-fg-muted'}`}
          >
            {tipoUnidadEsTransecto
              ? '🔗 Vinculada — se detectó "tipo: transecto" en Unidad de Muestreo. Mapeá aquí sus medidas.'
              : '🔌 Desvinculada — no hay unidades de muestreo de tipo "transecto" en este archivo.'}
          </div>
        )}

        {!transectoDesvinculado && (
          <>
            {camposModelo.map((c) => (
              <AtributoRow
                key={c.nombre}
                modelo={modelo}
                campoMeta={c}
                colIdxsMapeados={columnasMapeadasA(modelo, c.nombre, mapeoSeleccion)}
              />
            ))}

            {extras.map((item) => (
              <ExtraRow key={`extra-${item.extraIdx}`} extraIdx={item.extraIdx} />
            ))}

            {atributosDeModelo.map(({ i }) => (
              <AtributoManualRow key={i} i={i} />
            ))}

            <div className="px-4 py-2.5">
              <button
                type="button"
                title={`Agrega un campo de ${modelo} que no viene en la fuente y asígnale un valor fijo para todas las filas`}
                onClick={() => agregarAtributoManual(modelo)}
                className="border border-dashed border-border bg-panel text-fg-muted hover:text-fg text-xs font-semibold rounded-md px-3 py-1.5"
              >
                ➕ Agregar atributo
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  if (seccionIdx === SIN_MAPEAR_ORDEN) {
    const sinMapearItems = (grupos.get('') ?? []).filter((i): i is { kind: 'col'; idx: number } => i.kind === 'col')
    const ignoradasItems = (grupos.get(IGNORADAS) ?? []).filter(
      (i): i is { kind: 'col'; idx: number } => i.kind === 'col'
    )
    const modelosMapeados = [...grupos.keys()]
      .filter((m) => m && m !== IGNORADAS && (grupos.get(m)?.length ?? 0) > 0)
      .sort((a, b) => (grupoDeModelo(a)?.orden_modelo ?? 999) - (grupoDeModelo(b)?.orden_modelo ?? 999))

    return (
      <div>
        {sinMapearItems.length > 0 && (
          <div className="border border-border rounded-lg mb-4 overflow-hidden">
            <div className="px-4 py-2 text-sm font-bold bg-surface text-fg-muted">
              🕗 Sin mapear · {sinMapearItems.length} columna{sinMapearItems.length > 1 ? 's' : ''}
            </div>
            {sinMapearItems.map(({ idx }) => (
              <MapeoRow key={idx} idx={idx} modeloKeys={modeloKeysPara(SIN_MAPEAR_ORDEN)} />
            ))}
          </div>
        )}
        {modelosMapeados.map((modelo) => renderGrupoEntidad(modelo, grupos.get(modelo) ?? []))}
        {ignoradasItems.length > 0 && (
          <div className="border border-border rounded-lg mb-4 overflow-hidden">
            <div className="px-4 py-2 text-sm font-bold bg-surface text-fg-muted">
              🚫 Ignoradas · {ignoradasItems.length} columna{ignoradasItems.length > 1 ? 's' : ''}
            </div>
            {ignoradasItems.map(({ idx }) => (
              <MapeoRow key={idx} idx={idx} modeloKeys={modeloKeysPara(SIN_MAPEAR_ORDEN)} />
            ))}
          </div>
        )}
      </div>
    )
  }

  const modelosSeccion = [...grupos.keys()]
    .filter((m) => {
      if (m === '' || m === IGNORADAS) return false
      const g = grupoDeModelo(m)
      return g ? g.orden === seccionIdx : true
    })
    .sort((a, b) => (grupoDeModelo(a)?.orden_modelo ?? 999) - (grupoDeModelo(b)?.orden_modelo ?? 999))

  return <div>{modelosSeccion.map((modelo) => renderGrupoEntidad(modelo, grupos.get(modelo) ?? []))}</div>
}
