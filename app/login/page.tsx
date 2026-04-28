'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import Image from 'next/image'
import { Suspense } from 'react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setCargando(true)
    setError('')

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setCargando(false)

    if (result?.error) {
      setError('Email o contraseña incorrectos')
    } else {
      // Full page reload ensures session cookie is read correctly in production
      window.location.href = '/'
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo-parcela8.png"
              alt="Parcela 8"
              width={64}
              height={64}
              className="rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-[#C9A227]">Parcela 8</h1>
          <p className="text-stone-500 text-sm mt-1">Gestión de Incidencias</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">Acceso al panel</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
              />
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-[#C9A227] text-white py-2.5 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {cargando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Entrando...
                </span>
              ) : (
                'Entrar'
              )}
            </button>
            <div className="text-center mt-3">
              <a href="/reset-password" className="text-sm text-gray-400 hover:text-[#C9A227] transition-colors">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-stone-400 mt-6">
          Datos protegidos según RGPD · Comunidad Parcela 8 ·{' '}
          <a href="/privacidad" className="hover:underline">Política de privacidad</a>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
