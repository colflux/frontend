import { create } from 'zustand'
import type {
  AtributoCruzado,
  AtributoManual,
  CamposDestinoResponse,
  ColumnaConErrores,
  ColumnaOrigen,
  EdaResultado,
  ExtraDestino,
  HojaAnalizada,
  MapeoColumnaPrevio,
  MapeoSeleccion,
  ProgresoImportacionEstado,
} from '@/types'
import {
  SIN_MAPEAR_ORDEN,
  aplicarSugerenciasHora,
  aplicarSugerenciasValores,
  seccionesReales,
  sugerirMapeo,
} from '@/utils/etlMapeo'

// Estado de mapeo de UNA hoja del archivo -todo lo que depende de qué
// columnas tiene esa hoja y cómo el usuario decidió mapearlas-. seccionIdx y
// seccionesGuardadas NO viven acá: son compartidos entre hojas porque el
// backend agrupa "hasta_grupo" sobre TODOS los mapeos de la carga (de
// cualquier hoja), no por hoja -ver `_preparar_importacion` en el backend-.
interface HojaSnapshot {
  columnas: ColumnaOrigen[]
  totalFilas: number
  mapeoSeleccion: Record<number, MapeoSeleccion>
  mapeoValores: Record<number, Record<string, string>>
  atributosManuales: AtributoManual[]
  extrasDestino: ExtraDestino[]
  atributosCruzados: AtributoCruzado[]
}

const hojaSnapshotVacia: HojaSnapshot = {
  columnas: [],
  totalFilas: 0,
  mapeoSeleccion: {},
  mapeoValores: {},
  atributosManuales: [],
  extrasDestino: [],
  atributosCruzados: [],
}

interface EtlUploadStore {
  step: 1 | 2 | 3 | 4
  fuenteId: number | null
  cargaId: number | null
  columnas: ColumnaOrigen[]
  sheets: string[]
  hojaActiva: string
  hojas: Record<string, HojaSnapshot>
  totalFilas: number
  edaResultado: EdaResultado | null
  camposDestino: CamposDestinoResponse | null
  mapeoSeleccion: Record<number, MapeoSeleccion>
  mapeoValores: Record<number, Record<string, string>>
  atributosManuales: AtributoManual[]
  extrasDestino: ExtraDestino[]
  atributosCruzados: AtributoCruzado[]
  ultimosErroresPorColumna: Record<string, ColumnaConErrores['errores']>
  seccionIdx: number
  seccionesGuardadas: Set<number>

  setFuenteId: (fuenteId: number | null) => void
  setAnalisis: (
    analisis: {
      cargaId: number
      columnas: ColumnaOrigen[]
      sheets: string[]
      hojaActiva: string
      totalFilas: number
      mapeosPrevios: MapeoColumnaPrevio[]
      eda: EdaResultado
      hojas: Record<string, HojaAnalizada>
    },
    camposDestino: CamposDestinoResponse
  ) => void
  // Cambia qué hoja se está mapeando en el paso 4 -guarda el mapeo en curso
  // de la hoja actual y carga el de la nueva, sin volver a llamar al backend-.
  setHojaActiva: (hoja: string) => void
  setModeloColumna: (idx: number, modelo: string) => void
  setCampoColumna: (idx: number, campo: string) => void
  setTipoCoberturaColumna: (idx: number, tipoCobertura: number | null) => void
  setGasFijoColumna: (idx: number, gasFijo: string | null) => void
  setEstrategiaNulos: (idx: number, estrategia: string) => void
  setValorRellenoManual: (idx: number, valor: string) => void
  setValorChoice: (idx: number, valorOrigen: string, valorElegido: string) => void
  setAplicarRegexColumna: (idx: number, activar: boolean) => void
  setRegexPatronColumna: (idx: number, patron: string) => void
  reasignarOrigenAtributo: (modelo: string, campo: string, nuevoIdx: number | null, idxsActuales: number[]) => void
  agregarAtributoManual: (modelo: string) => void
  actualizarAtributoManual: (i: number, patch: Partial<AtributoManual>) => void
  quitarAtributoManual: (i: number) => void
  activarAtributoManualDeCampo: (modelo: string, campo: string) => void
  quitarAtributoManualDeCampo: (modelo: string, campo: string) => void
  // Mapea un atributo de esta sección desde una columna de OTRA hoja
  // (distinta a hojaActiva) — cruzando filas por una clave común en el
  // backend. `columnaOrigen` vacío quita el mapeo cruzado de ese campo.
  setAtributoCruzado: (modelo: string, campo: string, hojaOrigen: string, columnaOrigen: string) => void
  agregarExtraDestino: (colIdx: number) => void
  // Reusa `colIdx` (ya mapeado como destino principal de OTRO campo) como
  // destino adicional de `modelo.campo` — sin tocar el mapeo principal que
  // ya tenía esa columna. Ver ExtraDestino.
  asignarExtraDestino: (colIdx: number, modelo: string, campo: string) => void
  actualizarExtraDestino: (extraIdx: number, patch: Partial<ExtraDestino>) => void
  quitarExtraDestino: (extraIdx: number) => void
  quitarExtraDestinoDeCampo: (modelo: string, campo: string) => void
  setUltimosErroresPorColumna: (columnas: ColumnaConErrores[]) => void
  setSeccionIdx: (orden: number) => void
  marcarSeccionGuardada: (orden: number) => void
  // Limpia en el estado local el mapeo de una hoja completa -se usa después
  // de vaciarlo en el backend (ver useVaciarMapeoHoja), para cuando se
  // mapeó por error con la pestaña de hoja equivocada activa-.
  vaciarMapeoHojaLocal: (hoja: string) => void
  setStep: (step: 1 | 2 | 3 | 4) => void
  // Avance del guardado en background (ver useSeccionMutations) para
  // mostrar una barra de progreso real en vez de un "Guardando…" fijo.
  progresoImportacion: { estado: ProgresoImportacionEstado; actual: number; total: number; mensaje: string } | null
  setProgresoImportacion: (
    p: { estado: ProgresoImportacionEstado; actual: number; total: number; mensaje: string } | null
  ) => void
  reset: () => void
}

const initialState = {
  step: 1 as 1 | 2 | 3 | 4,
  fuenteId: null as number | null,
  cargaId: null as number | null,
  columnas: [] as ColumnaOrigen[],
  sheets: [] as string[],
  hojaActiva: '',
  hojas: {} as Record<string, HojaSnapshot>,
  totalFilas: 0,
  edaResultado: null as EdaResultado | null,
  camposDestino: null as CamposDestinoResponse | null,
  mapeoSeleccion: {} as Record<number, MapeoSeleccion>,
  mapeoValores: {} as Record<number, Record<string, string>>,
  atributosManuales: [] as AtributoManual[],
  extrasDestino: [] as ExtraDestino[],
  atributosCruzados: [] as AtributoCruzado[],
  ultimosErroresPorColumna: {} as Record<string, ColumnaConErrores['errores']>,
  seccionIdx: SIN_MAPEAR_ORDEN,
  seccionesGuardadas: new Set<number>(),
  progresoImportacion: null as {
    estado: ProgresoImportacionEstado
    actual: number
    total: number
    mensaje: string
  } | null,
}

// Recupera en `mapeoSeleccion`/`mapeoValores`/`atributosManuales`/
// `extrasDestino` lo que ya se había guardado en cargas previas de la misma
// fuente (el backend copia esos mapeos a la carga nueva en /upload/).
function aplicarMapeosGuardados(
  columnas: ColumnaOrigen[],
  mapeosPrevios: MapeoColumnaPrevio[]
): {
  mapeoSeleccion: Record<number, MapeoSeleccion>
  mapeoValores: Record<number, Record<string, string>>
  atributosManuales: AtributoManual[]
  extrasDestino: ExtraDestino[]
  atributosCruzados: AtributoCruzado[]
} {
  const atributosManuales: AtributoManual[] = mapeosPrevios
    .filter((m) => m.transformacion === 'constante')
    .map((m) => ({ modelo: m.modelo_destino || '', campo: m.campo_destino || '', valor: m.valor_constante || '' }))

  // Mapeos cruzados (hoja_origen seteado): la columna vive en OTRA hoja, así
  // que no se puede recuperar por índice en `columnas` (las de ESTA hoja) —
  // se guardan aparte, igual que los manuales.
  const atributosCruzados: AtributoCruzado[] = mapeosPrevios
    .filter((m) => m.transformacion !== 'constante' && m.hoja_origen)
    .map((m) => ({
      modelo: m.modelo_destino || '',
      campo: m.campo_destino || '',
      hojaOrigen: m.hoja_origen || '',
      columnaOrigen: m.columna_origen,
    }))

  const porNombre = new Map<string, MapeoColumnaPrevio[]>()
  mapeosPrevios
    .filter((m) => m.transformacion !== 'constante' && !m.hoja_origen)
    .forEach((m) => {
      const lista = porNombre.get(m.columna_origen) ?? []
      lista.push(m)
      porNombre.set(m.columna_origen, lista)
    })

  const mapeoSeleccion: Record<number, MapeoSeleccion> = {}
  const mapeoValores: Record<number, Record<string, string>> = {}
  const extrasDestino: ExtraDestino[] = []
  columnas.forEach((col, idx) => {
    const [m, ...extrasGuardados] = porNombre.get(col.nombre) ?? []
    if (!m) return
    if (m.transformacion === 'ignorar') {
      mapeoSeleccion[idx] = { modelo: '', campo: '' }
      return
    }
    if (!m.modelo_destino) return
    mapeoSeleccion[idx] = {
      modelo: m.modelo_destino,
      campo: m.campo_destino || '',
      estrategiaNulos: m.estrategia_nulos || 'dejar_null',
      valorRellenoManual: m.valor_relleno_manual || '',
      aplicarRegex: m.transformacion === 'regex',
      regexPatron: m.regex_patron || '',
    }
    extrasGuardados.forEach((e) => {
      extrasDestino.push({
        colIdx: idx,
        modelo: e.modelo_destino || '',
        campo: e.campo_destino || '',
        aplicarRegex: e.transformacion === 'regex',
        regexPatron: e.regex_patron || '',
        tipoCobertura: null,
      })
    })
    if (m.mapeo_valores && Object.keys(m.mapeo_valores).length) {
      mapeoValores[idx] = { ...m.mapeo_valores }
    }
  })

  return { mapeoSeleccion, mapeoValores, atributosManuales, extrasDestino, atributosCruzados }
}

function aplicarSugerenciasMapeo(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  modelosDestino: Record<string, import('@/types').CampoDestino[]>
): Record<number, MapeoSeleccion> {
  const resultado = { ...mapeoSeleccion }
  columnas.forEach((col, idx) => {
    if (resultado[idx]) return
    const sugerencia = sugerirMapeo(col.nombre, modelosDestino)
    if (sugerencia) resultado[idx] = { ...sugerencia, sugerido: true }
  })
  return resultado
}

// Arma el HojaSnapshot de una hoja: recupera lo guardado en cargas previas y
// aplica las mismas sugerencias automáticas (nombre/valores/hora) que antes
// solo corrían para la hoja activa -ahora corren por cada hoja analizada-.
function construirSnapshotHoja(
  columnas: ColumnaOrigen[],
  totalFilas: number,
  mapeosPrevios: MapeoColumnaPrevio[],
  camposDestino: CamposDestinoResponse
): HojaSnapshot {
  const {
    mapeoSeleccion: recuperado,
    mapeoValores: valoresRecuperados,
    atributosManuales,
    extrasDestino,
    atributosCruzados,
  } = aplicarMapeosGuardados(columnas, mapeosPrevios)
  const mapeoSeleccion = aplicarSugerenciasMapeo(columnas, recuperado, camposDestino.modelos)
  const mapeoValoresChoices = aplicarSugerenciasValores(columnas, mapeoSeleccion, valoresRecuperados, camposDestino.modelos)
  const mapeoValores = aplicarSugerenciasHora(columnas, mapeoValoresChoices)
  return { columnas, totalFilas, mapeoSeleccion, mapeoValores, atributosManuales, extrasDestino, atributosCruzados }
}

export const useEtlUploadStore = create<EtlUploadStore>((set) => ({
  ...initialState,
  setFuenteId: (fuenteId) => set({ ...initialState, seccionesGuardadas: new Set(), fuenteId }),
  setAnalisis: (analisis, camposDestino) => {
    const hojas: Record<string, HojaSnapshot> = {}
    Object.entries(analisis.hojas).forEach(([nombre, info]) => {
      hojas[nombre] = construirSnapshotHoja(info.columnas, info.total_filas, info.mapeos, camposDestino)
    })
    const activa =
      hojas[analisis.hojaActiva] ??
      construirSnapshotHoja(analisis.columnas, analisis.totalFilas, analisis.mapeosPrevios, camposDestino)
    const primeraSeccion = seccionesReales(camposDestino.grupos)[0]?.orden ?? SIN_MAPEAR_ORDEN
    set({
      step: 2,
      cargaId: analisis.cargaId,
      sheets: analisis.sheets,
      hojaActiva: analisis.hojaActiva,
      hojas,
      columnas: activa.columnas,
      totalFilas: activa.totalFilas,
      mapeoSeleccion: activa.mapeoSeleccion,
      mapeoValores: activa.mapeoValores,
      atributosManuales: activa.atributosManuales,
      extrasDestino: activa.extrasDestino,
      atributosCruzados: activa.atributosCruzados,
      edaResultado: analisis.eda,
      camposDestino,
      ultimosErroresPorColumna: {},
      seccionIdx: primeraSeccion,
      seccionesGuardadas: new Set(),
    })
  },
  setHojaActiva: (hoja) =>
    set((s) => {
      if (hoja === s.hojaActiva) return {}
      const snapshotActual: HojaSnapshot = {
        columnas: s.columnas,
        totalFilas: s.totalFilas,
        mapeoSeleccion: s.mapeoSeleccion,
        mapeoValores: s.mapeoValores,
        atributosManuales: s.atributosManuales,
        extrasDestino: s.extrasDestino,
        atributosCruzados: s.atributosCruzados,
      }
      const hojas = { ...s.hojas, [s.hojaActiva]: snapshotActual }
      const siguiente = hojas[hoja] ?? hojaSnapshotVacia
      return {
        hojas,
        hojaActiva: hoja,
        columnas: siguiente.columnas,
        totalFilas: siguiente.totalFilas,
        mapeoSeleccion: siguiente.mapeoSeleccion,
        mapeoValores: siguiente.mapeoValores,
        atributosManuales: siguiente.atributosManuales,
        extrasDestino: siguiente.extrasDestino,
        atributosCruzados: siguiente.atributosCruzados,
      }
    }),
  setModeloColumna: (idx, modelo) =>
    set((s) => ({
      mapeoSeleccion: {
        ...s.mapeoSeleccion,
        [idx]: {
          modelo,
          campo: '',
          estrategiaNulos: s.mapeoSeleccion[idx]?.estrategiaNulos,
          valorRellenoManual: s.mapeoSeleccion[idx]?.valorRellenoManual,
          aplicarRegex: false,
          regexPatron: '',
          tipoCobertura: null,
          gasFijo: null,
        },
      },
    })),
  setCampoColumna: (idx, campo) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], campo } },
    })),
  setTipoCoberturaColumna: (idx, tipoCobertura) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], tipoCobertura } },
    })),
  setGasFijoColumna: (idx, gasFijo) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], gasFijo } },
    })),
  setEstrategiaNulos: (idx, estrategiaNulos) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], estrategiaNulos } },
    })),
  setValorRellenoManual: (idx, valorRellenoManual) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], valorRellenoManual } },
    })),
  setValorChoice: (idx, valorOrigen, valorElegido) =>
    set((s) => ({
      mapeoValores: { ...s.mapeoValores, [idx]: { ...s.mapeoValores[idx], [valorOrigen]: valorElegido } },
    })),
  setAplicarRegexColumna: (idx, aplicarRegex) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], aplicarRegex } },
    })),
  setRegexPatronColumna: (idx, regexPatron) =>
    set((s) => ({
      mapeoSeleccion: { ...s.mapeoSeleccion, [idx]: { ...s.mapeoSeleccion[idx], regexPatron } },
    })),
  reasignarOrigenAtributo: (modelo, campo, nuevoIdx, idxsActuales) =>
    set((s) => {
      const mapeoSeleccion = { ...s.mapeoSeleccion }
      idxsActuales.forEach((idx) => {
        if (idx === nuevoIdx) return
        mapeoSeleccion[idx] = {
          modelo: '',
          campo: '',
          estrategiaNulos: mapeoSeleccion[idx]?.estrategiaNulos,
          valorRellenoManual: mapeoSeleccion[idx]?.valorRellenoManual,
        }
      })
      if (nuevoIdx != null) {
        const prev = mapeoSeleccion[nuevoIdx]
        mapeoSeleccion[nuevoIdx] = {
          modelo,
          campo,
          estrategiaNulos: prev?.estrategiaNulos,
          valorRellenoManual: prev?.valorRellenoManual,
        }
      }
      return { mapeoSeleccion }
    }),
  agregarAtributoManual: (modelo) =>
    set((s) => ({ atributosManuales: [...s.atributosManuales, { modelo, campo: '', valor: '' }] })),
  actualizarAtributoManual: (i, patch) =>
    set((s) => ({
      atributosManuales: s.atributosManuales.map((a, idx) => (idx === i ? { ...a, ...patch } : a)),
    })),
  quitarAtributoManual: (i) =>
    set((s) => ({ atributosManuales: s.atributosManuales.filter((_, idx) => idx !== i) })),
  activarAtributoManualDeCampo: (modelo, campo) =>
    set((s) => {
      const yaExiste = s.atributosManuales.some((a) => a.modelo === modelo && a.campo === campo)
      if (yaExiste) return {}
      return { atributosManuales: [...s.atributosManuales, { modelo, campo, valor: '' }] }
    }),
  quitarAtributoManualDeCampo: (modelo, campo) =>
    set((s) => ({
      atributosManuales: s.atributosManuales.filter((a) => !(a.modelo === modelo && a.campo === campo)),
    })),
  setAtributoCruzado: (modelo, campo, hojaOrigen, columnaOrigen) =>
    set((s) => {
      const sinAnterior = s.atributosCruzados.filter((a) => !(a.modelo === modelo && a.campo === campo))
      if (!columnaOrigen) return { atributosCruzados: sinAnterior }
      return { atributosCruzados: [...sinAnterior, { modelo, campo, hojaOrigen, columnaOrigen }] }
    }),
  agregarExtraDestino: (colIdx) =>
    set((s) => ({
      extrasDestino: [
        ...s.extrasDestino,
        { colIdx, modelo: '', campo: '', aplicarRegex: false, regexPatron: '', tipoCobertura: null },
      ],
    })),
  asignarExtraDestino: (colIdx, modelo, campo) =>
    set((s) => ({
      extrasDestino: [
        ...s.extrasDestino.filter((e) => !(e.modelo === modelo && e.campo === campo)),
        { colIdx, modelo, campo, aplicarRegex: false, regexPatron: '', tipoCobertura: null },
      ],
    })),
  actualizarExtraDestino: (extraIdx, patch) =>
    set((s) => ({
      extrasDestino: s.extrasDestino.map((e, i) => (i === extraIdx ? { ...e, ...patch } : e)),
    })),
  quitarExtraDestino: (extraIdx) =>
    set((s) => ({ extrasDestino: s.extrasDestino.filter((_, i) => i !== extraIdx) })),
  quitarExtraDestinoDeCampo: (modelo, campo) =>
    set((s) => ({
      extrasDestino: s.extrasDestino.filter((e) => !(e.modelo === modelo && e.campo === campo)),
    })),
  setUltimosErroresPorColumna: (columnas) =>
    set((s) => {
      const nuevo = { ...s.ultimosErroresPorColumna }
      columnas.forEach((c) => {
        nuevo[c.columna] = c.errores
      })
      return { ultimosErroresPorColumna: nuevo }
    }),
  setSeccionIdx: (orden) => set({ seccionIdx: orden }),
  marcarSeccionGuardada: (orden) =>
    set((s) => ({ seccionesGuardadas: new Set(s.seccionesGuardadas).add(orden) })),
  vaciarMapeoHojaLocal: (hoja) =>
    set((s) => {
      const vacia: HojaSnapshot = {
        ...hojaSnapshotVacia,
        columnas: s.hojas[hoja]?.columnas ?? [],
        totalFilas: s.hojas[hoja]?.totalFilas ?? 0,
      }
      const hojas = { ...s.hojas, [hoja]: vacia }
      if (hoja !== s.hojaActiva) return { hojas }
      return {
        hojas,
        mapeoSeleccion: vacia.mapeoSeleccion,
        mapeoValores: vacia.mapeoValores,
        atributosManuales: vacia.atributosManuales,
        extrasDestino: vacia.extrasDestino,
        atributosCruzados: vacia.atributosCruzados,
      }
    }),
  setStep: (step) => set({ step }),
  setProgresoImportacion: (p) => set({ progresoImportacion: p }),
  reset: () => set({ ...initialState, seccionesGuardadas: new Set() }),
}))
