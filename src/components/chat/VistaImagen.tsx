import { useEffect, useState } from 'react'
import { chatService } from '@/services/chat.service'
import { nombreArchivo } from '@/utils/archivosSubidos'

interface Props {
  archivo: string
}

// Miniatura de una imagen subida. El enlace lo entrega el asistente (dura una
// hora); al hacer clic se abre en tamaño completo. Si la imagen ya no existe,
// no se muestra nada.
export function VistaImagen({ archivo }: Props) {
  const [url, setUrl] = useState<string | null>(null)
  const [fallo, setFallo] = useState(false)

  useEffect(() => {
    let vigente = true
    chatService
      .getEnlaceImagen(archivo)
      .then((enlace) => vigente && setUrl(enlace))
      .catch(() => vigente && setFallo(true))
    return () => {
      vigente = false
    }
  }, [archivo])

  if (fallo) return null
  if (!url) return <div className="w-32 h-24 rounded-lg bg-surface border border-border animate-pulse" />

  return (
    <a href={url} target="_blank" rel="noreferrer" title={`Ver ${nombreArchivo(archivo)}`}>
      <img
        src={url}
        alt={nombreArchivo(archivo)}
        className="max-h-40 max-w-full rounded-lg border border-border object-cover"
        onError={() => setFallo(true)}
      />
    </a>
  )
}
