import type {
  AtributoCruzado,
  AtributoManual,
  CampoDestino,
  ColumnaOrigen,
  ErrorFila,
  ExtraDestino,
  GrupoModeloInfo,
  MapeoColumnaPayload,
  MapeoSeleccion,
} from '@/types'
export const SIN_MAPEAR_ORDEN = -1

export interface SeccionInfo {
  orden: number
  nombre: string
  icono: string
}

// Una sección por cada "orden" de grupo del catálogo, más la pestaña
// especial "Todos los atributos" (resumen editable de cualquier columna).
export function seccionesDisponibles(grupos: Record<string, GrupoModeloInfo>): SeccionInfo[] {
  const vistos = new Map<number, SeccionInfo>()
  Object.values(grupos).forEach((g) => {
    if (!vistos.has(g.orden)) vistos.set(g.orden, { orden: g.orden, nombre: g.nombre, icono: g.icono })
  })
  const resto = [...vistos.values()].sort((a, b) => a.orden - b.orden)
  return [{ orden: SIN_MAPEAR_ORDEN, nombre: 'Todos los atributos', icono: '📋' }, ...resto]
}

export function seccionesReales(grupos: Record<string, GrupoModeloInfo>): SeccionInfo[] {
  return seccionesDisponibles(grupos)
    .filter((s) => s.orden !== SIN_MAPEAR_ORDEN)
    .sort((a, b) => a.orden - b.orden)
}

// Texto breve de qué representa cada sección — usado tanto en el resumen
// (paso 2) como en el encabezado de la sección durante el mapeo (paso 3).
export const DESCRIPCION_SECCION: Record<string, string> = {
  'Unidad Experimental': 'El sitio de monitoreo más amplio (ej. un páramo o humedal completo).',
  'Unidad de Muestreo': 'Los puntos o parcelas concretas donde se toman las mediciones dentro de la unidad experimental. Acá defines su nombre y tipo (parcela, transecto, etc).',
  'Detalles de muestreo': 'Atributos específicos según el tipo de unidad de muestreo que definiste en la sección anterior (medidas de la parcela, longitud del transecto, etc).',
  Sitio: 'Datos de ubicación del punto de muestreo (coordenadas, altitud, etc).',
  Clima: 'Variables climáticas registradas en el sitio (temperatura, precipitación, etc).',
  'Cobertura y Vegetación': 'Qué tipo de cobertura o vegetación hay en cada unidad de muestreo.',
  'Carbono Orgánico del Suelo (COS)': 'Mediciones de carbono almacenado en el suelo.',
  Biomasa: 'Mediciones de biomasa vegetal (aérea, subterránea, etc).',
  'Materia Orgánica Muerta (MOM)': 'Mediciones de hojarasca, madera muerta y otra materia orgánica no viva.',
  'Muestras GEI': 'Muestras de gases de efecto invernadero tomadas en campo.',
}

export interface CampoSeccionInfo {
  etiqueta: string
  descripcion: string
}

// Atributos requeridos/opcionales/automáticos de los modelos que caen dentro
// de una sección — para mostrarle al usuario, antes de mapear, qué atributos
// necesita la sección, cuáles son opcionales y cuáles se llenan solos. Los
// automáticos (p. ej. UnidadExperimental.proyecto, ver
// CAMPOS_AUTOMATICOS_ETL en el backend) salen de "requeridos": el usuario no
// tiene que mapearlos, ya se resuelven desde la fuente/carga.
export function camposDeSeccion(
  orden: number,
  grupos: Record<string, GrupoModeloInfo>,
  modelos: Record<string, CampoDestino[]>
): { automaticos: CampoSeccionInfo[]; requeridos: CampoSeccionInfo[]; opcionales: CampoSeccionInfo[] } {
  const modelosSeccion = Object.entries(grupos)
    .filter(([, g]) => g.orden === orden)
    .map(([m]) => m)
  const automaticos: CampoSeccionInfo[] = []
  const requeridos: CampoSeccionInfo[] = []
  const opcionales: CampoSeccionInfo[] = []
  modelosSeccion.forEach((m) => {
    ;(modelos[m] ?? []).forEach((c) => {
      const info = { etiqueta: c.verbose_name || c.nombre, descripcion: c.help_text }
      if (c.automatico) automaticos.push(info)
      else if (c.requerido) requeridos.push(info)
      else opcionales.push(info)
    })
  })
  return { automaticos, requeridos, opcionales }
}

// Cada sección queda bloqueada hasta que TODAS las anteriores (en orden)
// ya se hayan guardado en base de datos, no solo la primera.
export function seccionBloqueada(
  orden: number,
  grupos: Record<string, GrupoModeloInfo>,
  seccionesGuardadas: Set<number>
): boolean {
  if (orden === SIN_MAPEAR_ORDEN) return false
  const reales = seccionesReales(grupos)
  const idx = reales.findIndex((s) => s.orden === orden)
  if (idx <= 0) return false
  return !reales.slice(0, idx).every((s) => seccionesGuardadas.has(s.orden))
}

// Nombres de las secciones anteriores que aún no se han guardado — para
// explicar en un tooltip por qué una sección está bloqueada.
export function seccionesFaltantesPara(
  orden: number,
  grupos: Record<string, GrupoModeloInfo>,
  seccionesGuardadas: Set<number>
): string[] {
  const reales = seccionesReales(grupos)
  const idx = reales.findIndex((s) => s.orden === orden)
  if (idx <= 0) return []
  return reales.slice(0, idx)
    .filter((s) => !seccionesGuardadas.has(s.orden))
    .map((s) => s.nombre)
}

export function contarColumnasSinMapear(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>
): number {
  return columnas.filter((_, idx) => !mapeoSeleccion[idx]).length
}

// Lookup inverso: qué columna(s) del archivo están actualmente mapeadas a un
// atributo destino dado (modelo+campo). Puede haber más de una si el
// auto-sugeridor apuntó varias columnas al mismo atributo por error.
export function columnasMapeadasA(
  modelo: string,
  campo: string,
  mapeoSeleccion: Record<number, MapeoSeleccion>
): number[] {
  return Object.entries(mapeoSeleccion)
    .filter(([, s]) => s.modelo === modelo && s.campo === campo)
    .map(([idx]) => Number(idx))
}

export function normalizarNombre(s: string): string {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

// Sugiere modelo/campo destino para una columna del archivo por similitud
// de nombre contra el catálogo — coincidencia exacta puntúa más que
// inclusión mutua (p. ej. "hora" adentro de "hora_toma").
export function sugerirMapeo(
  nombreColumna: string,
  modelosDestino: Record<string, CampoDestino[]>
): { modelo: string; campo: string } | null {
  const n = normalizarNombre(nombreColumna)
  if (n.length < 3) return null

  interface Candidato {
    modelo: string
    campo: string
    score: number
  }
  const mejor: { actual: Candidato | null } = { actual: null }
  Object.entries(modelosDestino).forEach(([modelo, campos]) => {
    campos.forEach((campo) => {
      let score = 0
      ;[normalizarNombre(campo.nombre), normalizarNombre(campo.verbose_name)].forEach((cand) => {
        if (!cand) return
        if (cand === n) score = Math.max(score, 2)
        else if (cand.length >= 4 && n.length >= 4 && (cand.includes(n) || n.includes(cand))) {
          score = Math.max(score, 1)
        }
      })
      if (score > 0 && (!mejor.actual || score > mejor.actual.score)) {
        mejor.actual = { modelo, campo: campo.nombre, score }
      }
    })
  })
  return mejor.actual ? { modelo: mejor.actual.modelo, campo: mejor.actual.campo } : null
}

// Arma el payload que espera POST .../mapeo/ a partir del estado del
// wizard. Las columnas sin decidir (sin entrada en mapeoSeleccion) se
// excluyen; una entrada con modelo vacío es "ignorar" explícito.
export function construirMapeos(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  mapeoValores: Record<number, Record<string, string>>,
  atributosManuales: AtributoManual[],
  extrasDestino: ExtraDestino[] = [],
  atributosCruzados: AtributoCruzado[] = []
): MapeoColumnaPayload[] {
  const manuales: MapeoColumnaPayload[] = atributosManuales
    .filter((a) => a.modelo && a.campo)
    .map((a) => ({
      columna_origen: `[manual] ${a.modelo}.${a.campo}`,
      modelo_destino: a.modelo,
      campo_destino: a.campo,
      transformacion: 'constante',
      valor_constante: a.valor ?? '',
      mapeo_valores: {},
    }))

  const cruzados: MapeoColumnaPayload[] = atributosCruzados
    .filter((a) => a.modelo && a.campo && a.hojaOrigen && a.columnaOrigen)
    .map((a) => ({
      columna_origen: a.columnaOrigen,
      hoja_origen: a.hojaOrigen,
      modelo_destino: a.modelo,
      campo_destino: a.campo,
      transformacion: 'directo',
      mapeo_valores: {},
      estrategia_nulos: 'dejar_null',
      valor_relleno_manual: '',
    }))

  const principales: MapeoColumnaPayload[] = columnas
    .map((col, idx): MapeoColumnaPayload | null => {
      const seleccion = mapeoSeleccion[idx]
      if (!seleccion) return null
      const ignorada = !seleccion.modelo
      return {
        columna_origen: col.nombre,
        modelo_destino: seleccion.modelo || '',
        campo_destino: seleccion.campo || '',
        transformacion: ignorada ? 'ignorar' : seleccion.aplicarRegex ? 'regex' : 'directo',
        regex_patron: !ignorada && seleccion.aplicarRegex ? seleccion.regexPatron || '' : '',
        // Se descartan los '' (ignorar explícito): solo persisten mapeos reales.
        mapeo_valores: Object.fromEntries(
          Object.entries(mapeoValores[idx] ?? {}).filter(([, v]) => v !== '')
        ),
        estrategia_nulos: seleccion.estrategiaNulos || 'dejar_null',
        valor_relleno_manual: seleccion.valorRellenoManual || '',
        tipo_cobertura:
          seleccion.modelo === 'Cobertura' && seleccion.campo === 'nombre' ? seleccion.tipoCobertura ?? null : null,
        gas_fijo:
          seleccion.modelo === 'SubmuestraGEI' && seleccion.campo === 'valor' ? seleccion.gasFijo ?? null : null,
      }
    })
    .filter((m): m is MapeoColumnaPayload => m !== null)

  const extras: MapeoColumnaPayload[] = extrasDestino
    .filter((e) => e.modelo && e.campo)
    .map((e) => ({
      columna_origen: columnas[e.colIdx].nombre,
      modelo_destino: e.modelo,
      campo_destino: e.campo,
      transformacion: e.aplicarRegex ? 'regex' : 'directo',
      regex_patron: e.aplicarRegex ? e.regexPatron || '' : '',
      mapeo_valores: {},
      estrategia_nulos: 'dejar_null',
      valor_relleno_manual: '',
      tipo_cobertura: e.modelo === 'Cobertura' && e.campo === 'nombre' ? e.tipoCobertura ?? null : null,
    }))

  return manuales.concat(cruzados, principales, extras)
}

// Igual que sugerirMapeo pero contra las opciones (choices) de un campo:
// coincidencia exacta del valor o la etiqueta normalizados, o inclusión mutua.
// "micro" es el prefijo SI que "µ"/"u" abrevian (micromol = µmol = umol):
// normaliza ambas formas al mismo texto para que el matching de unidades no
// dependa de que la fuente use la forma abreviada.
export function normalizarUnidad(s: string): string {
  return normalizarNombre(s).replace(/\bmicro/g, 'u')
}

export function sugerirValor(
  valorOrigen: string,
  choices: { valor: string | number; etiqueta: string }[]
): string | null {
  const n = normalizarUnidad(valorOrigen)
  if (!n) return null

  interface Candidato {
    valor: string
    score: number
  }
  const mejor: { actual: Candidato | null } = { actual: null }
  choices.forEach((ch) => {
    let score = 0
    ;[normalizarUnidad(String(ch.valor)), normalizarUnidad(ch.etiqueta)].forEach((cand) => {
      if (!cand) return
      if (cand === n) score = Math.max(score, 2)
      else if (cand.length >= 4 && n.length >= 4 && (cand.includes(n) || n.includes(cand))) {
        score = Math.max(score, 1)
      }
    })
    if (score > 0 && (!mejor.actual || score > mejor.actual.score)) {
      mejor.actual = { valor: String(ch.valor), score }
    }
  })
  return mejor.actual ? mejor.actual.valor : null
}

// Para cada columna ya mapeada a un campo con choices (y sin panel de
// horas, mutuamente excluyente), sugiere automáticamente el valor
// destino de cada valor único que todavía no tenga uno asignado.
export function aplicarSugerenciasValores(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  mapeoValores: Record<number, Record<string, string>>,
  modelosDestino: Record<string, CampoDestino[]>
): Record<number, Record<string, string>> {
  const resultado: Record<number, Record<string, string>> = { ...mapeoValores }
  columnas.forEach((col, idx) => {
    const seleccion = mapeoSeleccion[idx]
    if (!seleccion?.modelo || !seleccion.campo) return
    const campoMeta = modelosDestino[seleccion.modelo]?.find((c) => c.nombre === seleccion.campo)
    if (!campoMeta || campoMeta.choices.length === 0) return
    const existentes = resultado[idx] ?? {}
    const nuevos = { ...existentes }
    let cambio = false
    ;(col.valores_unicos ?? []).forEach((valorOrigen) => {
      if (valorOrigen in nuevos) return
      const sugerido = sugerirValor(valorOrigen, campoMeta.choices)
      if (sugerido != null) {
        nuevos[valorOrigen] = sugerido
        cambio = true
      }
    })
    if (cambio) resultado[idx] = nuevos
  })
  return resultado
}

// Valores (de columnas mapeadas o atributos manuales) ya asignados a un
// campo de un modelo, en minúsculas — p. ej. para detectar que el usuario
// mapeó UnidadMuestreo.tipo a un valor que corresponde a "parcela".
export function valoresDetectadosParaCampo(
  modelo: string,
  campo: string,
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  atributosManuales: AtributoManual[]
): Set<string> {
  const valores = new Set<string>()
  columnas.forEach((col, idx) => {
    const sel = mapeoSeleccion[idx]
    if (sel && sel.modelo === modelo && sel.campo === campo) {
      ;(col.valores_unicos ?? []).forEach((v) => valores.add(String(v).toLowerCase()))
    }
  })
  atributosManuales.forEach((attr) => {
    if (attr.modelo === modelo && attr.campo === campo && attr.valor) {
      valores.add(String(attr.valor).toLowerCase())
    }
  })
  return valores
}

export function unidadExperimentalYaMapeada(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  atributosManuales: AtributoManual[]
): boolean {
  const enColumna = columnas.some((_, idx) => {
    const sel = mapeoSeleccion[idx]
    return sel && sel.modelo === 'UnidadMuestreo' && sel.campo === 'unidad_experimental'
  })
  return (
    enColumna ||
    atributosManuales.some((a) => a.modelo === 'UnidadMuestreo' && a.campo === 'unidad_experimental')
  )
}

export function origenUnidadExperimentalMapeada(
  columnas: ColumnaOrigen[],
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  atributosManuales: AtributoManual[]
): string | null {
  const idx = columnas.findIndex((_, i) => {
    const sel = mapeoSeleccion[i]
    return sel && sel.modelo === 'UnidadMuestreo' && sel.campo === 'unidad_experimental'
  })
  if (idx !== -1) return `columna "${columnas[idx].nombre}"`
  const attr = atributosManuales.find((a) => a.modelo === 'UnidadMuestreo' && a.campo === 'unidad_experimental')
  return attr ? 'un atributo manual' : null
}

// Una columna "compleja" oculta sus paneles inline (horas/nulos) y en su
// lugar muestra un botón "🔍 Revisar" que abre el modal unificado — evita
// llenar la fila de formularios cuando hay varias cosas que resolver a la vez.
export function columnaEsCompleja(
  idx: number,
  col: ColumnaOrigen,
  mapeoSeleccion: Record<number, MapeoSeleccion>,
  ultimosErroresPorColumna: Record<string, ErrorFila[]>,
  campoRequerido = false
): boolean {
  const seleccion = mapeoSeleccion[idx]
  const tieneHorasAmbiguas = Object.keys(col.sugerencias_hora ?? {}).length > 0
  // Un campo opcional con vacíos no amerita alerta: "dejar vacío" (el valor
  // por defecto) ya es una estrategia válida. Solo se marca cuando el campo
  // destino es requerido, porque ahí sí hace falta decidir algo.
  const tieneNulosPorResolver = Boolean(seleccion?.modelo && seleccion.campo && col.nulls && campoRequerido)
  const erroresPrevios = ultimosErroresPorColumna[col.nombre]
  const tieneErroresPrevios = Boolean(erroresPrevios && erroresPrevios.length)
  return tieneHorasAmbiguas || tieneNulosPorResolver || tieneErroresPrevios
}

// Siembra `mapeoValores[idx][valorOrigen]` con la sugerencia del backend
// para cada valor de hora ambigua que todavía no tenga un valor asignado.
export function aplicarSugerenciasHora(
  columnas: ColumnaOrigen[],
  mapeoValores: Record<number, Record<string, string>>
): Record<number, Record<string, string>> {
  const resultado: Record<number, Record<string, string>> = { ...mapeoValores }
  columnas.forEach((col, idx) => {
    const sugerencias = col.sugerencias_hora ?? {}
    if (Object.keys(sugerencias).length === 0) return
    const existentes = resultado[idx] ?? {}
    const nuevos = { ...existentes }
    let cambio = false
    Object.entries(sugerencias).forEach(([valorOrigen, sugerencia]) => {
      if (valorOrigen in nuevos) return
      nuevos[valorOrigen] = sugerencia
      cambio = true
    })
    if (cambio) resultado[idx] = nuevos
  })
  return resultado
}

// ── Vista previa de regex ────────────────────────────────────────────────

export function muestraAleatoria(col: ColumnaOrigen, n: number): string[] {
  const fuente = col.valores_unicos?.length ? col.valores_unicos : ((col.muestra ?? []) as string[])
  const copia = [...fuente]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia.slice(0, n)
}

export type ResultadoRegex =
  | { estado: 'error'; mensaje: string }
  | { estado: 'sin-match' }
  | { estado: 'ok'; resultado: string }

// Misma lógica que _resolver_valor_columna en el backend: re.search sobre
// el valor; sin match => null; con grupo de captura => group(1), si no =>
// el match completo.
export function aplicarRegexValor(patron: string, val: string): ResultadoRegex {
  let regex: RegExp
  try {
    regex = new RegExp(patron)
  } catch {
    return { estado: 'error', mensaje: 'Patrón inválido' }
  }
  const match = regex.exec(String(val))
  if (!match) return { estado: 'sin-match' }
  const resultado = match.length > 1 && match[1] !== undefined ? match[1] : match[0]
  return { estado: 'ok', resultado }
}

// La vista previa corre en el navegador (motor de regex de JS), que sí
// acepta lookbehind "(?<=...)"/"(?<!...)" de ancho variable. Python (lo que
// ejecuta el backend al guardar) lo rechaza con "look-behind requires
// fixed-width pattern" — se detecta acá para avisar antes de "Guardar sección".
export function advertenciaLookbehindPython(patron: string): string | null {
  const re = /\(\?<[=!]([^()]*)\)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(patron))) {
    const contenido = m[1]
    const anchoFijo = !/[*+]|\{\d*,(\d*)?\}/.test(contenido.replace(/\{(\d+)\}/g, ''))
    if (!anchoFijo) {
      return 'Este patrón usa un lookbehind "(?<=...)" de ancho variable. Se ve bien acá (vista previa en JS), pero Python — que es lo que corre al guardar — exige lookbehinds de ancho fijo y va a fallar con "look-behind requires fixed-width pattern".'
    }
  }
  return null
}
