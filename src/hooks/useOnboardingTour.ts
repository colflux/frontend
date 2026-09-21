import { useEffect, useRef } from 'react'
import { driver, type Config, type DriveStep } from 'driver.js'
import 'driver.js/dist/driver.css'

function storageKey(tourId: string): string {
  return `tour_seen_${tourId}`
}

export function haVistoTour(tourId: string): boolean {
  return localStorage.getItem(storageKey(tourId)) === '1'
}

// Pasos cuyo `element` (selector CSS) no está en el DOM se omiten, para
// soportar controles condicionales como el botón "Limpiar filtros" de
// EtlDatos, que solo se renderiza si hay filtros activos.
function pasosDisponibles(steps: DriveStep[]): DriveStep[] {
  return steps.filter((step) => {
    if (typeof step.element !== 'string') return true
    return document.querySelector(step.element) != null
  })
}

interface UseOnboardingTourOptions {
  tourId: string
  steps: DriveStep[]
  autoStart?: boolean
}

export function useOnboardingTour({ tourId, steps, autoStart = true }: UseOnboardingTourOptions) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null)

  function start() {
    const disponibles = pasosDisponibles(steps)
    if (!disponibles.length) return

    const config: Config = {
      showProgress: true,
      nextBtnText: 'Siguiente',
      prevBtnText: 'Anterior',
      doneBtnText: 'Listo',
      steps: disponibles,
      onDestroyed: () => {
        localStorage.setItem(storageKey(tourId), '1')
      },
    }
    driverRef.current?.destroy()
    driverRef.current = driver(config)
    driverRef.current.drive()
  }

  useEffect(() => {
    if (!autoStart || haVistoTour(tourId)) return
    const timer = setTimeout(start, 400)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tourId, autoStart])

  return { start }
}
