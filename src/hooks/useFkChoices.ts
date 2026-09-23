import { useQuery } from '@tanstack/react-query'
import { etlService } from '@/services/etl.service'

// Las instancias de un campo FK ya no vienen precargadas en campos-destino
// (eso era el cuello de botella de ~54s): se piden aparte, por campo, solo
// cuando el wizard efectivamente muestra el selector de ese campo.
export function useFkChoices(
  modelo: string | undefined,
  campo: string | undefined,
  fuenteId: number | null,
  esFk: boolean | undefined
) {
  return useQuery({
    queryKey: ['fk-choices', modelo, campo, fuenteId],
    queryFn: () => etlService.getFkChoices(modelo as string, campo as string, fuenteId),
    enabled: Boolean(esFk) && Boolean(modelo) && Boolean(campo),
    staleTime: 30_000,
  })
}
