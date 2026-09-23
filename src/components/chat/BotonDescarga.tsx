import { useState } from 'react'
import { chatService } from '@/services/chat.service'
import { useAuthStore } from '@/store/useAuthStore'
import type { NivelAcceso } from '@/types'
import { nombreArchivo } from '@/utils/archivosSubidos'

const NIVELES_CON_DESCARGA: NivelAcceso[] = ['reportador', 'admin']

interface Props {
  archivo: string
}

// Botón «Descargar» para reportadores y administradores. Sin ese nivel no se
// muestra; aun así, quien decide es el asistente, que verifica el nivel con el
// backend antes de entregar el enlace.
export function BotonDescarga({ archivo }: Props) {
  const token = useAuthStore((s) => s.token)
  const usuario = useAuthStore((s) => s.usuario)
  const [estado, setEstado] = useState<'listo' | 'preparando' | 'error'>('listo')
  const [error, setError] = useState('')

  if (!token || !usuario || !NIVELES_CON_DESCARGA.includes(usuario.nivel)) return null

  const descargar = async () => {
    setEstado('preparando')
    try {
      const url = await chatService.getEnlaceDescarga(archivo, token)
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
        className="text-brand-teal hover:text-brand-teal-dark font-medium disabled:opacity-50"
        title={`Descargar ${nombreArchivo(archivo)}`}
      >
        {estado === 'preparando' ? 'Preparando…' : '⬇ Descargar'}
      </button>
      {estado === 'error' && <span className="text-red-600 dark:text-red-400">{error}</span>}
    </span>
  )
}
