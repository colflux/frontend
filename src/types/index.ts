export type GasType = 'CO2' | 'CH4' | 'N2O'

export interface FilterState {
  year: number | null
  gas: GasType
  proyectoId: number | null
}

export type MapViewMode = 'sitios' | 'regiones'

// Metodología seleccionada en el panel de filtros: define qué recuadro de
// filtros condicionales se muestra debajo de los filtros transversales.
export type Metodologia = 'general' | 'biomasa' | 'cos' | 'flujos'

// Categoría de dato que consume el mapa (/api/geo/sitios/, /api/geo/resumen/):
// "general" y "flujos" comparten la misma categoría "flujos" -la diferencia
// entre esas dos metodologías es solo qué recuadro de filtros se muestra,
// no qué datos trae el mapa-.
export type CategoriaDato = 'flujos' | 'biomasa' | 'cos'

// Selección de drill-down geográfico (departamento/municipio/vereda).
// "vereda" agrupa también manzana: el backend no expone un nivel separado.
export interface GeoDrillEntity {
  id: number
  nombre: string
}

// ── mediciones crudas de flujo (/api/geo/series/) ───────────────────

export interface SerieLectura {
  fecha: string
  valor: number
  unidad: string
  gas: string
  sitio_id: number
  sitio_nombre: string
  departamento_id: number | null
  departamento: string | null
  proyecto_id: number
  proyecto_nombre: string
}

export interface SerieResponse {
  count: number
  resultados: SerieLectura[]
}

export interface SeriesFilters {
  anio?: number
  gas?: GasType
  sitio?: number
  proyecto?: number
  departamento?: number
}

// ── sitios georreferenciados (GeoJSON) ──────────────────────────────

export interface SitioProyecto {
  id: number
  nombre: string
}

export interface SitioUnidadMuestreo {
  id: number
  nombre: string
  tipo: string
}

export interface UltimaMedicionCO2 {
  fecha: string
  valor: number | null
  unidad: string
}

export interface RangoFechas {
  desde: string | null
  hasta: string | null
}

export interface ResumenGas {
  total_muestras: number
  rango_fechas: RangoFechas
  ultima_medicion: UltimaMedicionCO2 | null
}

// Resumen de una categoría sin sub-filtro propio (biomasa, cos) — misma
// forma que ResumenGas pero sin desagregar más.
export type ResumenSimple = ResumenGas

export interface SitioProperties {
  id: number
  nombre: string
  municipio: string | null
  departamento: string | null
  altitud: number | null
  uso_actual: string | null
  proyectos: SitioProyecto[]
  unidades_muestreo: SitioUnidadMuestreo[]
  total_muestras_co2: number
  rango_fechas: RangoFechas
  ultima_medicion_co2: UltimaMedicionCO2 | null
  resumen_por_gas: Partial<Record<GasType, ResumenGas>>
  resumen_biomasa: ResumenSimple | null
  resumen_cos: ResumenSimple | null
}

export interface SitioFeature {
  type: 'Feature'
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties: SitioProperties
}

export interface SitiosFeatureCollection {
  type: 'FeatureCollection'
  features: SitioFeature[]
}

// ── tabla desnormalizada por proyecto/sitio (/api/proyectos/<id>/datos/) ──

export type VistaDatos =
  | 'submuestra_gei'
  | 'unidad_muestreo'
  | 'clima'
  | 'mom'
  | 'cos'
  | 'biomasa'

export interface ColumnaDatos {
  clave: string
  modelo: string
  campo: string
  verbose_name: string
}

export type FilaDatos = Record<string, string | number | null>

export interface DatosProyectoResponse {
  total: number
  offset: number
  limite: number
  columnas: ColumnaDatos[]
  filas: FilaDatos[]
  vistas: VistaDatos[]
  advertencia?: string
}

export interface DatosProyectoFilters {
  vista?: VistaDatos
  sitio?: number
  filtros?: Record<string, string>
  offset?: number
  limite?: number
}

// ── resumen geográfico agregado con drill-down (/api/geo/resumen/) ──

export type GeoNivel = 'region' | 'departamento' | 'municipio' | 'vereda' | 'sitio'

export interface GeoResumenProperties {
  id: number
  nombre: string
  total_muestras: number
  promedio: number | null
  minimo: number | null
  maximo: number | null
  rango_fechas: RangoFechas
  ultima_medicion: UltimaMedicionCO2 | null
  departamento_id?: number
  departamento?: string
  municipio_id?: number
  municipio?: string
}

export type GeoResumenGeometry =
  | { type: 'Polygon'; coordinates: number[][][] }
  | { type: 'MultiPolygon'; coordinates: number[][][][] }
  | { type: 'Point'; coordinates: [number, number] }

export interface GeoResumenFeature {
  type: 'Feature'
  geometry: GeoResumenGeometry | null
  properties: GeoResumenProperties
}

export interface GeoResumenFeatureCollection {
  type: 'FeatureCollection'
  features: GeoResumenFeature[]
  excluidos?: number
  categoria?: CategoriaDato
  // Unidad fija de la categoría (biomasa/cos); null en flujos -ahí la unidad
  // puede variar por grupo según el gas, y va en cada ultima_medicion-.
  unidad?: string | null
}

export interface GeoResumenFilters {
  categoria?: CategoriaDato
  gas?: GasType
  anio?: number
  desde?: string
  hasta?: string
  proyecto?: number
  departamento?: number
  municipio?: number
  vereda?: number
  region?: number
}

// ── resumen categórico no geográfico (/api/geo/resumen-categorico/) ─

export type DimensionCategorica =
  | 'proyecto'
  | 'ecosistema'
  | 'estado_conservacion'
  | 'analizador'
  | 'condicion_luz'

export interface ResumenCategoricoItem {
  id: number | string
  nombre: string
  total_muestras: number
  promedio: number | null
  minimo: number | null
  maximo: number | null
  rango_fechas: RangoFechas
  ultima_medicion: UltimaMedicionCO2 | null
}

export interface ResumenCategoricoResponse {
  dimension: DimensionCategorica
  resultados: ResumenCategoricoItem[]
}

export type ResumenCategoricoFilters = GeoResumenFilters

// ── tendencia de instalación de unidades de muestreo (/api/geo/tendencia-instalacion/) ─

export type Agrupacion = 'mes' | 'anio'

export interface TendenciaInstalacionPunto {
  periodo: string
  total: number
}

export interface TendenciaInstalacionResponse {
  agrupar: Agrupacion
  resultados: TendenciaInstalacionPunto[]
}

// ── biomasa por taxón y producción (/api/reportes/biomasa/) ─────────

export type DimensionBiomasa = 'familia' | 'genero' | 'especie'

export interface BiomasaTaxonItem {
  nombre: string
  total_individuos: number
  dap_promedio_cm: number | null
  altura_promedio_m: number | null
}

export interface BiomasaTaxonResponse {
  dimension: DimensionBiomasa
  metrica: 'conteo_individuos'
  resultados: BiomasaTaxonItem[]
}

export interface BiomasaProduccionPunto {
  fecha: string
  prod_biomasa_g: number | null
  prom_tonc_ha: number | null
  sitio_id: number | null
  sitio_nombre: string | null
  departamento: string | null
}

export interface BiomasaProduccionResponse {
  count: number
  resultados: BiomasaProduccionPunto[]
}

// ── COS por rango de profundidad (/api/reportes/cos/) ───────────────

export interface CosProfundidadItem {
  rango_profundidad: string
  carbono_pct_promedio: number
  total_muestras: number
}

export interface CosProfundidadResponse {
  resultados: CosProfundidadItem[]
}

// ── MOM: tendencia de carbono en hojarasca (/api/reportes/mom/) ─────

export interface MomTendenciaPunto {
  periodo: string
  carbono_hojarasca_g_m2_promedio: string | number
  total_muestras: number
}

export interface MomTendenciaResponse {
  agrupar: Agrupacion
  resultados: MomTendenciaPunto[]
}

// ── reglas de autollenado (/api/reglas-autollenado/) ────────────────

export interface ReglaAutollenado {
  codigo: string
  nombre: string
  descripcion: string
  modelo_destino: string
  campo_destino: string
  pendientes: number
  tiene_validacion: boolean
}

export interface ParametroSchema {
  clave: string
  etiqueta: string
  tipo: 'time' | 'number'
}

export interface EjemploCandidato {
  objeto_id: number
  valor_nuevo: string
  contexto: Record<string, string | number | null> & { caso?: string }
}

export interface CasoRegla {
  clave: string
  etiqueta: string
  cantidad: number
  ejemplo: EjemploCandidato[]
}

export interface ValidacionFila {
  condicion_luz: string
  etiqueta: string
  cantidad: number
  hora_min: string | null
  hora_max: string | null
  histograma: number[]
}

export interface HistorialAplicacion {
  lote: string
  fecha: string
  cantidad: number
  deshecho: boolean
  deshecha_en: string | null
}

export interface DetalleRegla {
  codigo: string
  nombre: string
  descripcion: string
  modelo_destino: string
  campo_destino: string
  parametros: Record<string, string>
  parametros_schema: ParametroSchema[]
  pendientes: number
  ejemplo: EjemploCandidato[]
  casos: CasoRegla[]
  validacion: ValidacionFila[] | null
  historial: HistorialAplicacion[]
}

// ── wizard de carga ETL (/api/fuentes-datos/{id}/upload/, /api/etl/*) ──

export interface ColumnaOrigen {
  nombre: string
  dtype: string
  nulls: number
  muestra: (string | number | null)[]
  valores_unicos: string[]
  sugerencias_hora: Record<string, string>
  interpretaciones_hora: Record<string, string>
}

export interface MapeoColumnaPrevio {
  columna_origen: string
  modelo_destino: string | null
  campo_destino: string | null
  transformacion: string
  regex_patron: string | null
  mapeo_valores: Record<string, string> | null
  valor_constante: string | null
  estrategia_nulos: string | null
  valor_relleno_manual: string | null
}

export interface AnalizarFuenteResponse {
  carga_id: number
  sheets: string[]
  hoja_activa: string
  total_filas: number
  columnas: ColumnaOrigen[]
  mapeos: MapeoColumnaPrevio[]
}

export interface ChoiceCampo {
  valor: string | number
  etiqueta: string
}

export interface CampoDestino {
  nombre: string
  verbose_name: string
  tipo: string
  tipo_raw: string
  requerido: boolean
  max_length: number | null
  choices: ChoiceCampo[]
  es_fk: boolean
  modelo_fk: string | null
}

export interface GrupoModeloInfo {
  nombre: string
  icono: string
  orden: number
  orden_modelo: number
}

export interface TipoCobertura {
  id: number
  codigo: string
  nombre: string
}

export interface CamposDestinoResponse {
  modelos: Record<string, CampoDestino[]>
  grupos: Record<string, GrupoModeloInfo>
  tipos_cobertura: TipoCobertura[]
}

// Selección hecha por el usuario para una columna del archivo (estado local
// del wizard, no un tipo de respuesta del backend).
export interface MapeoSeleccion {
  modelo: string
  campo: string
  tipoCobertura?: number | null
  sugerido?: boolean
  estrategiaNulos?: string
  valorRellenoManual?: string
  aplicarRegex?: boolean
  regexPatron?: string
}

export interface AtributoManual {
  modelo: string
  campo: string
  valor: string
}

// Un segundo (o tercer) destino para la misma columna origen del destino
// principal (p. ej. "ID" completo → UnidadMuestreo.nombre, y una parte
// extraída por regex → UnidadExperimental.nombre).
export interface ExtraDestino {
  colIdx: number
  modelo: string
  campo: string
  aplicarRegex: boolean
  regexPatron: string
  tipoCobertura: number | null
}

export interface RegexSugeridoResponse {
  regex_patron: string | null
  columna_origen?: string
  fuente_nombre?: string
}

export interface VerificarExistenciaResponse {
  existentes: string[]
  soportado: boolean
}

export interface MapeoColumnaPayload {
  columna_origen: string
  modelo_destino: string
  campo_destino: string
  transformacion: string
  regex_patron?: string
  factor_escala?: number | null
  mapeo_valores?: Record<string, string>
  valor_constante?: string
  estrategia_nulos?: string
  valor_relleno_manual?: string
  tipo_cobertura?: number | null
}

export interface PostMapeoResponse {
  ok: boolean
  guardados: number
}

export interface ErrorFila {
  fila: number | null
  tipo: string
  mensaje: string
}

export interface ColumnaConErrores {
  columna: string
  errores: ErrorFila[]
}

export interface ValidacionSeccionError {
  ok: false
  resumen: {
    total_filas: number
    columnas_mapeadas: number
    total_errores: number
    filas_limpias: number
    filas_con_errores: number
  }
  columnas: ColumnaConErrores[]
}

export interface RegistroPreview {
  accion: 'creado' | 'reutilizado'
  campos: Record<string, string | number | null>
}

export interface DetalleModeloPreview {
  registros: RegistroPreview[]
  total: number
  creados: number
  reutilizados: number
  truncado: boolean
}

export interface ResumenModeloImportado {
  creados: number
  reutilizados: number
}

export interface PrevisualizarSeccionResponse {
  ok: true
  hasta_grupo: number
  completo: boolean
  modelos: Record<string, ResumenModeloImportado>
  detalle: Record<string, DetalleModeloPreview>
}

export interface ImportarSeccionResponse {
  ok: true
  hasta_grupo: number
  completo: boolean
  modelos: Record<string, ResumenModeloImportado>
}

// ── mapeo de columnas (/api/fuentes-datos/{id}/carga/{id}/mapeo/) ───

export interface MapeoColumna {
  columna_origen: string
  modelo_destino: string | null
  campo_destino: string | null
  transformacion: string
  regex_patron: string | null
  factor_escala: number | null
  mapeo_valores: Record<string, string> | null
  valor_constante: string | null
  estrategia_nulos: string | null
  valor_relleno_manual: string | null
  tipo_cobertura: number | null
  tipo_cobertura_nombre: string | null
}

export interface MapeoCarga {
  carga_id: number
  fuente_id: number
  fuente_nombre: string
  estado: string
  columnas_raw: (string | { nombre?: string; columna?: string })[]
  total_filas: number
  mapeos: MapeoColumna[]
}

// ── fuentes de datos (/api/fuentes-datos/, /api/fuentes-datos-crud/) ─

export interface ProyectoResumen {
  id: number
  nombre: string
}

export interface FuenteDatos {
  id: number
  nombre: string
  descripcion: string
  tipo: string
  tipo_label: string
  url: string
  estado: string
  estado_label: string
  responsable: string
  responsable_id: number | null
  proyecto: ProyectoResumen | null
  sitio: null
  fecha_datos: string | null
  notas: string
  created_at: string
  ultima_carga_importada_id: number | null
}

export interface FuentesDropdownResponse {
  fuentes: FuenteDatos[]
  proyectos: ProyectoResumen[]
}

export interface FuenteDatosPayload {
  nombre: string
  descripcion?: string
  url?: string
  tipo: string
  estado: string
  responsable_id_write?: number | null
  proyecto_id?: number | null
}

// ── responsables/reportadores (/api/responsables/, /api/usuarios/) ──

// Cascada de nivel de acceso: cada uno incluye todo lo del anterior.
// ciudadano < investigador < reportador < admin.
export type NivelAcceso = 'ciudadano' | 'investigador' | 'reportador' | 'admin'

export interface Responsable {
  id: number
  nombre: string
  cargo: string
  correo: string
  correo_institucional: string
  institucion: number | null
  institucion_nombre: string
  nivel: NivelAcceso
}

export interface UsuarioPayload {
  nombre: string
  cargo?: string
  correo?: string
  institucion?: number | null
  nivel?: NivelAcceso
  password?: string
}

// ── solicitudes de nivel (/api/solicitudes-nivel/) ────────────────────

export type EstadoSolicitudNivel = 'pendiente' | 'aprobada' | 'rechazada'

export interface SolicitudNivel {
  id: number
  usuario: number
  usuario_nombre: string
  nivel_actual: NivelAcceso
  nivel_solicitado: NivelAcceso
  motivo: string
  estado: EstadoSolicitudNivel
  resuelta_por: number | null
  created_at: string
}

export interface SolicitudNivelPayload {
  nivel_solicitado: NivelAcceso
  motivo?: string
}

// ── proyectos (/api/proyectos/) ──────────────────────────────────────

export interface Proyecto {
  id: number
  nombre: string
  coordinador: string
  correo_coordinador: string
  escala_espacial: string
  objetivo_general: string
  fecha_inicio: string | null
  fecha_fin: string | null
}

export interface ProyectoPayload {
  nombre: string
  coordinador?: string
  correo_coordinador?: string
  objetivo_general?: string
  fecha_inicio?: string | null
  fecha_fin?: string | null
}

// ── instituciones (/api/instituciones/) ──────────────────────────────

export interface Institucion {
  id: number
  nombre: string
  correo: string
}

export interface InstitucionPayload {
  nombre: string
  correo?: string
}

// ── roles de usuario (/api/roles-usuario/) ───────────────────────────

export interface RolUsuario {
  id: number
  codigo: string
  nombre: string
}

// ── catálogo del modelo de datos (assets/data/catalogo.json, generado
// en el backend con `generate_catalogo` y empaquetado como archivo
// estático del proyecto — no hay endpoint API para esto) ────────────

export interface EntidadCatalogo {
  nombre: string
  verbose_name: string
  verbose_name_plural: string
  descripcion: string
  total_campos: number
  campos: CampoDestino[]
  datos_semilla?: Record<string, string | number | null>[]
}

export interface GrupoCatalogo {
  nombre: string
  icono: string
  color: string
  entidades: EntidadCatalogo[]
}

export interface CatalogoData {
  grupos: GrupoCatalogo[]
}

// ── asistente RAG (/chat, /ingest) ──────────────────────────────

export interface ChatSource {
  source: string
  content: string
  score: number
}

export interface ChatResponse {
  answer: string
  sources: ChatSource[]
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  sources?: ChatSource[]
  error?: boolean
}
