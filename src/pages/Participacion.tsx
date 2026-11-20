import { useState } from 'react'
import { Card } from '@/components/common/Card'
import { useRolActual } from '@/hooks/useRolActual'
import { TourButton } from '@/components/common/TourButton'
import { useOnboardingTour } from '@/hooks/useOnboardingTour'
import { useAuthStore } from '@/store/useAuthStore'
import { datosService } from '@/services/datos.service'
import { downloadFile } from '@/utils/download'
import { useFuenteDrawerStore } from '@/store/useFuenteDrawerStore'
import { FuenteDrawer } from '@/components/admin/fuentes/FuenteDrawer'
import { ProyectoDrawer } from '@/components/admin/proyectos/ProyectoDrawer'
import { PlantillaDetalleModal } from '@/components/common/PlantillaDetalleModal'
import type { MetodologiaFuente } from '@/types'

interface Fuente {
  key: string
  label: string
  disabled?: boolean
  disabledNota?: string
}

interface Metodologia {
  key: string
  icon: string
  title: string
  desc: string
  // Solo CO2/CH4 tiene más de una fuente de dato por ahora (equipo vs. torre).
  // Las demás metodologías no muestran selector de fuente.
  fuentes?: Fuente[]
  // La plantilla descargable (y su "Ver detalle") cubre Flujos CO2, Biomasa,
  // COS y MOM (ver backend/app/api/etl/views.py:_HOJAS_PLANTILLA, filtrado por
  // ?metodologia=<key> para que cada tarjeta descargue/muestre solo sus
  // propias hojas, no las de las demás metodologías — 2026-11-19). Las
  // metodologías sin plantilla propia todavía muestran el botón inactivo —
  // decisión de equipo, 2026-11-02.
  plantillaDisponible: boolean
  // "Subir datos" deshabilitado a propósito para COS/Biomasa/MOM (pedido de
  // la usuaria, 2026-11-20): la plantilla/mapeo ya están implementados pero
  // la carga real todavía no se habilita para estas 3 metodologías.
  subidaDisponible: boolean
}

const METODOLOGIAS: Metodologia[] = [
  {
    key: 'flujos',
    icon: '🌫️',
    title: 'Flujos',
    desc: 'Flujos de gases de efecto invernadero (CO2/CH4).',
    plantillaDisponible: true,
    subidaDisponible: true,
    fuentes: [
      { key: 'equipo', label: 'Equipo (cámaras GEI)' },
      { key: 'torre', label: 'Torre EC' },
    ],
  },
  {
    key: 'cos',
    icon: '🟤',
    title: 'Carbono Orgánico del Suelo (COS)',
    desc: 'Muestras de suelo para estimar carbono orgánico.',
    plantillaDisponible: true,
    subidaDisponible: false,
  },
  {
    key: 'biomasa',
    icon: '🌳',
    title: 'Biomasa',
    desc: 'Mediciones de biomasa aérea y subterránea.',
    plantillaDisponible: true,
    subidaDisponible: false,
  },
  {
    key: 'mom',
    icon: '🍂',
    title: 'Materia Orgánica Muerta (MOM)',
    desc: 'Necromasa: hojarasca, madera muerta y mantillo.',
    plantillaDisponible: true,
    subidaDisponible: false,
  },
]

export function Participacion() {
  const { tieneNivel } = useRolActual()
  const token = useAuthStore((s) => s.token)
  const openFuenteDrawer = useFuenteDrawerStore((s) => s.openDrawer)
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)
  const [fuenteSeleccionada, setFuenteSeleccionada] = useState<Record<string, string>>({})
  const [detalleMetodologia, setDetalleMetodologia] = useState<Metodologia | null>(null)

  async function handleDescargarPlantilla(metodologiaKey: string) {
    setDescargando(true)
    setErrorDescarga(null)
    try {
      await downloadFile(datosService.getPlantillaVaciaUrl(metodologiaKey), token)
    } catch (err) {
      setErrorDescarga(err instanceof Error ? err.message : 'No se pudo descargar la plantilla.')
    } finally {
      setDescargando(false)
    }
  }

  const { start: iniciarTour } = useOnboardingTour({
    tourId: 'participacion',
    steps: [
      {
        element: '[data-tour="participacion-metodologias"]',
        popover: {
          title: 'Reporta por metodología',
          description:
            'Elige la metodología de tu dato. Dentro de cada una vas a encontrar cómo subir datos o descargar la plantilla.',
        },
      },
    ],
  })

  const puedeSubirDatos = tieneNivel('reportador')

  function fuenteActiva(metodologia: Metodologia): Fuente | null {
    if (!metodologia.fuentes) return null
    const seleccionada = fuenteSeleccionada[metodologia.key]
    const encontrada = metodologia.fuentes.find((f) => f.key === seleccionada)
    return encontrada ?? metodologia.fuentes.find((f) => !f.disabled) ?? metodologia.fuentes[0]
  }

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-6xl mx-auto w-full">
      <TourButton onClick={iniciarTour} />
      <div>
        <h1 className="text-xl font-bold text-fg">Reporta información desde tu territorio</h1>
        <p className="text-sm text-fg-muted mt-1">
          Tu información es muy importante para entender y cuidar nuestros ecosistemas. Elige la
          metodología de tu dato para ver cómo cargarlo.
        </p>
      </div>

      <div data-tour="participacion-metodologias" className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {METODOLOGIAS.map((m) => {
          const fuente = fuenteActiva(m)
          const mostrarMecanismos = !m.fuentes || (fuente && !fuente.disabled)

          return (
            <Card key={m.key} className="flex flex-col gap-3">
              <div className="flex items-start gap-2 text-left">
                <span className="text-xl" aria-hidden>
                  {m.icon}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-fg">{m.title}</span>
                  <span className="block text-xs text-fg-muted mt-0.5">{m.desc}</span>
                </span>
              </div>

              <div className="flex flex-col gap-3 pt-2 border-t border-border">
                {m.fuentes && (
                    <div className="flex gap-2">
                      {m.fuentes.map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          disabled={f.disabled}
                          onClick={() =>
                            setFuenteSeleccionada((actual) => ({ ...actual, [m.key]: f.key }))
                          }
                          title={f.disabledNota}
                          className={`text-xs font-semibold px-2.5 py-1.5 rounded-md border ${
                            fuente?.key === f.key
                              ? 'border-brand-teal text-brand-teal dark:text-brand-teal-bright'
                              : 'border-border text-fg-muted'
                          } ${f.disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-brand-teal'}`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {!mostrarMecanismos && fuente?.disabledNota && (
                    <p className="text-xs text-fg-subtle">{fuente.disabledNota}</p>
                  )}

                  {mostrarMecanismos && (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        disabled={!puedeSubirDatos || !m.subidaDisponible}
                        title={
                          !m.subidaDisponible
                            ? 'Próximamente — la carga de datos para esta metodología todavía no está habilitada.'
                            : !puedeSubirDatos
                              ? 'Subir datos — disponible desde el nivel reportador'
                              : undefined
                        }
                        onClick={() =>
                          openFuenteDrawer({
                            metodologiaContext: m.key as MetodologiaFuente,
                            fuenteTipoContext: (fuente?.key as 'equipo' | 'torre' | undefined) ?? null,
                          })
                        }
                        className="flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline text-left"
                      >
                        📂 Subir datos →
                      </button>
                      {fuente?.key !== 'torre' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDescargarPlantilla(m.key)}
                            disabled={!m.plantillaDisponible || descargando}
                            title={!m.plantillaDisponible ? 'Próximamente — falta definir la plantilla de esta metodología.' : undefined}
                            className="flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline disabled:opacity-50 disabled:cursor-not-allowed text-left"
                          >
                            📥 {descargando && m.plantillaDisponible ? 'Descargando…' : 'Descargar plantilla →'}
                          </button>
                          {m.plantillaDisponible && errorDescarga && (
                            <p className="text-xs text-red-600 dark:text-red-400">{errorDescarga}</p>
                          )}
                          {m.plantillaDisponible && (
                            <button
                              type="button"
                              onClick={() => setDetalleMetodologia(m)}
                              className="flex items-center gap-2 text-xs font-semibold text-brand-teal dark:text-brand-teal-bright hover:underline text-left"
                            >
                              📄 Ver detalle de la plantilla →
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
            </Card>
          )
        })}
      </div>

      <FuenteDrawer />
      <ProyectoDrawer />
      <PlantillaDetalleModal
        key={detalleMetodologia?.key}
        open={detalleMetodologia != null}
        onClose={() => setDetalleMetodologia(null)}
        metodologia={detalleMetodologia?.key}
        titulo={detalleMetodologia ? `Detalle de la plantilla — ${detalleMetodologia.title}` : undefined}
      />
    </div>
  )
}
