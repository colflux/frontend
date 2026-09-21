import { useMutation, useQuery } from '@tanstack/react-query'
import { authService } from '@/services/auth.service'
import { useAuthStore } from '@/store/useAuthStore'

export function useLogin() {
  const setSesion = useAuthStore((s) => s.setSesion)
  return useMutation({
    mutationFn: ({ correo, password }: { correo: string; password: string }) =>
      authService.login(correo, password),
    onSuccess: (data) => setSesion(data.token, data.usuario),
  })
}

export function useRegistro() {
  const setSesion = useAuthStore((s) => s.setSesion)
  return useMutation({
    mutationFn: ({ nombre, correo, password }: { nombre: string; correo: string; password: string }) =>
      authService.registro(nombre, correo, password),
    onSuccess: (data) => setSesion(data.token, data.usuario),
  })
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: (correo: string) => authService.forgotPassword(correo),
  })
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      authService.resetPassword(token, password),
  })
}

export function useLogout() {
  const token = useAuthStore((s) => s.token)
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)
  return useMutation({
    mutationFn: () => (token ? authService.logout(token) : Promise.resolve()),
    onSettled: () => cerrarSesion(),
  })
}

// Revalida el token al cargar la app y refresca roles/datos del usuario;
// si el token ya no es válido, limpia la sesión guardada en localStorage.
export function useMe() {
  const token = useAuthStore((s) => s.token)
  const setSesion = useAuthStore((s) => s.setSesion)
  const cerrarSesion = useAuthStore((s) => s.cerrarSesion)

  return useQuery({
    queryKey: ['auth-me', token],
    queryFn: async () => {
      try {
        const usuario = await authService.me(token as string)
        setSesion(token as string, usuario)
        return usuario
      } catch (err) {
        cerrarSesion()
        throw err
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}
