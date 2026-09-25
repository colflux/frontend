import { useState } from 'react'
import { chatService } from '@/services/chat.service'
import type { DescargaExcel } from '@/types'

interface Props {
  descarga: DescargaExcel
}

// Botón «Descargar Excel» con los datos que el asistente preparó en esa
// respuesta. Lo puede usar cualquier persona: son datos que la plataforma ya
// muestra en el geoportal. El enlace se pide al hacer clic porque dura una hora.
export function BotonExcel({ descarga }: Props) {
  const [estado, setEstado] = useState<'listo' | 'preparando' | 'error'>('listo')
  const [error, setError] = useState('')

  const descargar = async () => {
    setEstado('preparando')
    try {
      const url = await chatService.getEnlaceExcel(descarga.archivo)
      window.location.assign(url)
      setEstado('listo')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo preparar la descarga.')
      setEstado('error')
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={descargar}
        disabled={estado === 'preparando'}
        className="inline-flex items-center gap-1 rounded-lg border border-brand-teal px-2.5 py-1 text-brand-teal hover:bg-brand-teal hover:text-white font-medium disabled:opacity-50 transition-colors"
        title={`${descarga.filas} filas${descarga.hojas?.length ? ` · ${descarga.hojas.join(', ')}` : ''}`}
      >
        {estado === 'preparando' ? 'Preparando…' : `⬇ Descargar Excel (${descarga.filas} filas)`}
      </button>
      {estado === 'error' && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </span>
  )
}
