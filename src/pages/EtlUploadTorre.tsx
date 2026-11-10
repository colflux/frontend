import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useSearchParams } from 'react-router-dom'
import { Card } from '@/components/common/Card'
import { etlService } from '@/services/etl.service'
import { useFuentesDropdown } from '@/hooks/useFuentesDropdown'
import { useImportarTorre } from '@/hooks/useImportarTorre'

// Flujo de carga dedicado a Torre EC/Eddypro: a diferencia del wizard
// genérico de EtlUpload.tsx (mapeo columna por columna, sección por
// sección), acá no hay nada que mapear -la salida de Eddypro siempre trae
// las mismas columnas en el mismo orden (ver
// app/api/etl/preprocesamiento_torre.py)-, así que el archivo se agrega a
// diario y se importa directo en un solo paso.
export function EtlUploadTorre() {
  const [searchParams] = useSearchParams()
  const fuenteIdParam = searchParams.get('fuente')
  const fuenteId = fuenteIdParam ? Number(fuenteIdParam) : null

  const { data: dropdownData, isLoading: fuentesLoading } = useFuentesDropdown()
  const fuenteActual = dropdownData?.fuentes.find((f) => f.id === fuenteId) ?? null

  const { data: torresChoices, isLoading: torresLoading } = useQuery({
    queryKey: ['fk-choices', 'MuestraTorre', 'torre'],
    queryFn: () => etlService.getFkChoices('MuestraTorre', 'torre', null),
  })

  const [torreId, setTorreId] = useState('')
  const [archivo, setArchivo] = useState<File | null>(null)

  const importar = useImportarTorre()

  function handleImportar() {
    if (!fuenteId || !torreId || !archivo) return
    importar.mutate({ fuenteId, torreId: Number(torreId), archivo })
  }

  const errorImportar = importar.isError
    ? importar.error instanceof Error
      ? importar.error.message
      : 'Error desconocido'
    : null

  return (
    <div className="flex-1 p-6 flex flex-col gap-1 max-w-3xl mx-auto w-full">
      <div>
        <h1 className="text-xl font-bold text-fg">Cargar datos de Torre EC (Eddypro)</h1>
        {fuenteActual ? (
          <p className="text-sm text-fg-muted mt-1">
            Fuente: <span className="font-semibold text-fg">{fuenteActual.nombre}</span>
          </p>
        ) : fuenteId == null ? (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
            Falta indicar la fuente (parámetro ?fuente= en la URL).
          </p>
        ) : null}
      </div>

      {!importar.isSuccess ? (
        <Card title="Subir archivo crudo de Eddypro" className="mt-4">
          <p className="text-sm text-fg-muted mb-4">
            Sube la exportación "full_output"/"adv" de Eddypro sin modificar. El sistema la agrega a promedios
            diarios por variable y la guarda directo — no hace falta mapear columnas, esta carga siempre trae la
            misma estructura.
          </p>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Torre EC</label>
              <select
                value={torreId}
                onChange={(e) => setTorreId(e.target.value)}
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              >
                <option value="">
                  {torresLoading ? 'Cargando torres…' : '— Selecciona una torre —'}
                </option>
                {torresChoices?.choices.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.etiqueta}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Archivo de Eddypro</label>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
                className="text-sm text-fg"
              />
            </div>

            {errorImportar && <p className="text-sm font-semibold text-red-600 dark:text-red-400">{errorImportar}</p>}

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleImportar}
                disabled={!fuenteId || !torreId || !archivo || fuentesLoading || importar.isPending}
                className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-5 py-2.5 rounded-md transition-colors"
              >
                {importar.isPending ? 'Importando…' : 'Importar →'}
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
        <Card title="✓ Importación completa" className="mt-4">
          <p className="text-sm text-fg-muted mb-4">
            Se importaron <strong>{importar.data.variables_importadas}</strong> variable
            {importar.data.variables_importadas === 1 ? '' : 's'} con <strong>{importar.data.dias_importados}</strong>{' '}
            día{importar.data.dias_importados === 1 ? '' : 's'} de datos, del {importar.data.fecha_min} al{' '}
            {importar.data.fecha_max}.
          </p>
          <div className="flex gap-2.5">
            <Link
              to={`/etl/datos?fuente=${fuenteId}&carga=${importar.data.carga_id}`}
              className="bg-brand-teal hover:bg-brand-teal-dark text-white text-sm font-bold px-4 py-2 rounded-md transition-colors"
            >
              📊 Ver datos cargados
            </Link>
            <Link
              to="/data"
              className="bg-surface border border-border text-fg-muted hover:text-fg text-sm font-semibold px-4 py-2 rounded-md transition-colors"
            >
              ← Volver a Gestión de Datos
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}
