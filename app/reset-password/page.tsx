'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState('')

  async function handleSolicitar(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setExito(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setEnviando(false)
    }
  }

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch('/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setExito(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al restablecer')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#C9A227]">Parcela 8</h1>
          <p className="text-stone-500 text-sm mt-1">Gestión de Incidencias</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          {!token ? (
            exito ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Email enviado</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
                </p>
                <Link href="/login" className="text-sm text-[#C9A227] hover:underline">
                  Volver al inicio de sesión
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Recuperar contraseña</h2>
                <p className="text-sm text-gray-500 mb-6">
                  Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
                </p>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                <form onSubmit={handleSolicitar} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoFocus
                      placeholder="usuario@ejemplo.com"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-[#C9A227] text-white py-2.5 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? 'Enviando...' : 'Enviar enlace'}
                  </button>
                </form>
                <div className="mt-4 text-center">
                  <Link href="/login" className="text-sm text-gray-500 hover:text-gray-700">
                    Volver al inicio de sesión
                  </Link>
                </div>
              </>
            )
          ) : (
            exito ? (
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Contraseña actualizada</h2>
                <p className="text-sm text-gray-500 mb-6">Tu contraseña ha sido restablecida correctamente.</p>
                <Link
                  href="/login"
                  className="inline-block bg-[#C9A227] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors"
                >
                  Iniciar sesión
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Nueva contraseña</h2>
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
                )}
                <form onSubmit={handleReset} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                    <input
                      type="password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Repite la contraseña"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={enviando}
                    className="w-full bg-[#C9A227] text-white py-2.5 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enviando ? 'Guardando...' : 'Guardar contraseña'}
                  </button>
                </form>
              </>
            )
          )}
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">Comunidad Parcela 8 © 2025</p>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
