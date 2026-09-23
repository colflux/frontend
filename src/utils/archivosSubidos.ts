// Los archivos subidos desde el chat viven en el bucket bajo esta ruta; las
// fuentes del chat que empiezan así se pueden descargar.
export const esArchivoSubido = (fuente: string) => fuente.startsWith('documentos/')

// documentos/entrevista/2026-09-23-1a2b3c4d-Entrevista-Rosa.pdf → Entrevista-Rosa.pdf
export const nombreArchivo = (fuente: string) =>
  esArchivoSubido(fuente)
    ? (fuente.split('/').pop() ?? fuente).replace(/^\d{4}-\d{2}-\d{2}-[0-9a-f]{8}-/, '')
    : fuente
