import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useResetPassword } from '@/hooks/useAuth'

export function ResetPassword() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const resetPassword = useResetPassword()
  const [password, setPassword] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState('')
  const [listo, setListo] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirmacion) {
      setError('Las contraseñas no coinciden.')
      return
    }
    try {
      await resetPassword.mutateAsync({ token, password })
      setListo(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al procesar la solicitud.')
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-panel border border-border rounded-xl shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4">
        <h1 className="text-base font-bold text-fg">Restablecer contraseña</h1>

        {!token && (
          <p className="text-sm font-semibold text-red-500">
            Este enlace no es válido. Solicita uno nuevo desde el botón de inicio de sesión.
          </p>
        )}

        {token && listo && (
          <p className="text-sm font-semibold text-brand-teal">
            Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión con la nueva.
          </p>
        )}

        {token && !listo && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Nueva contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-fg">Confirmar contraseña</label>
              <input
                type="password"
                value={confirmacion}
                onChange={(e) => setConfirmacion(e.target.value)}
                placeholder="••••••••"
                className="bg-surface border border-border text-fg text-sm rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-teal"
              />
            </div>
            {error && <p className="text-sm font-semibold text-red-500">{error}</p>}
            <button
              type="submit"
              disabled={resetPassword.isPending}
              className="bg-brand-teal hover:bg-brand-teal-dark disabled:opacity-50 text-white text-sm font-bold px-4 py-2 rounded-md transition-colors mt-1"
            >
              {resetPassword.isPending ? 'Guardando…' : 'Guardar nueva contraseña'}
            </button>
          </form>
        )}

        <Link to="/" className="text-xs font-semibold text-brand-teal hover:underline text-center">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
