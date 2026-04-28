'use client'

import { useState } from 'react'
import Link from 'next/link'

type Comentario = { texto: string; autor: string; rol: string; creadoEn: string }
type Ticket = {
  id: string
  numero: number
  titulo: string
  descripcion: string
  categoria: string
  prioridad: string
  estado: string
  zona: string
  creadoEn: string
  cerradoEn?: string | null
  cerradoPor?: string | null
  foto?: string | null
  comentarios: Comentario[]
}

const ESTADO_COLORS: Record<string, string> = {
  Abierto: 'bg-amber-100 text-amber-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  Cerrado: 'bg-green-100 text-green-800',
}

export default function MisIncidenciasPage() {
  const [email, setEmail] = useState('')
  const [buscando, setBuscando] = useState(false)
  const [tickets, setTickets] = useState<Ticket[] | null>(null)
  const [error, setError] = useState('')
  const [ticketAbierto, setTicketAbierto] = useState<string | null>(null)

  async function buscar(e: React.FormEvent) {
    e.preventDefault()
    setBuscando(true)
    setError('')
    setTickets(null)
    try {
      const res = await fetch(`/api/mis-incidencias?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setTickets(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al buscar')
    } finally {
      setBuscando(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Link href="/" className="text-sm text-[#C9A227] hover:underline">← Volver al inicio</Link>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-6 sm:p-8 mb-6">
          <h1 className="text-xl font-bold text-gray-900 mb-1">Mis incidencias</h1>
          <p className="text-sm text-gray-500 mb-6">
            Consulte el estado de sus incidencias introduciendo el email con el que las registró.
          </p>

          <form onSubmit={buscar} className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="su@email.com"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={buscando}
              className="bg-[#C9A227] text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 text-sm whitespace-nowrap"
            >
              {buscando ? 'Buscando...' : 'Consultar'}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>
          )}
        </div>

        {tickets !== null && (
          <div>
            {tickets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-8 text-center">
                <p className="text-gray-500">No se encontraron incidencias para este email.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500 mb-2">{tickets.length} incidencia{tickets.length !== 1 ? 's' : ''} encontrada{tickets.length !== 1 ? 's' : ''}</p>
                {tickets.map((t) => (
                  <div key={t.id} className="bg-white rounded-xl border border-stone-200 overflow-hidden">
                    <button
                      className="w-full text-left p-4 hover:bg-stone-50 transition-colors"
                      onClick={() => setTicketAbierto(ticketAbierto === t.id ? null : t.id)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono text-gray-400">#{t.numero}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[t.estado] || 'bg-gray-100 text-gray-600'}`}>
                              {t.estado}
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{t.categoria}</span>
                          </div>
                          <p className="font-semibold text-gray-900 text-sm truncate">{t.titulo}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {t.zona} · {new Date(t.creadoEn).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <svg
                          className={`w-4 h-4 text-gray-400 flex-shrink-0 mt-1 transition-transform ${ticketAbierto === t.id ? 'rotate-180' : ''}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    {ticketAbierto === t.id && (
                      <div className="border-t border-stone-100 p-4 space-y-3 bg-stone-50">
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">Descripción</p>
                          <p className="text-sm text-gray-700">{t.descripcion}</p>
                        </div>

                        {t.foto && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-1">Foto</p>
                            <img src={t.foto} alt="Foto incidencia" className="max-h-40 rounded-lg border" />
                          </div>
                        )}

                        {t.cerradoEn && (
                          <div className="flex gap-4 text-xs text-gray-500">
                            <span>Cerrado: {new Date(t.cerradoEn).toLocaleDateString('es-ES')}</span>
                            {t.cerradoPor && <span>Por: {t.cerradoPor}</span>}
                          </div>
                        )}

                        {t.comentarios.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Actualizaciones</p>
                            <div className="space-y-2">
                              {t.comentarios.map((c, i) => (
                                <div key={i} className={`text-xs p-2.5 rounded-lg ${c.rol === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'}`}>
                                  <div className="flex justify-between mb-1">
                                    <span className={`font-medium ${c.rol === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}>{c.autor}</span>
                                    <span className="text-gray-400">{new Date(c.creadoEn).toLocaleDateString('es-ES')}</span>
                                  </div>
                                  <p className="text-gray-700">{c.texto}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-400">
            Datos protegidos según RGPD · Comunidad Parcela 8 ·{' '}
            <a href="/privacidad" className="hover:underline">Política de privacidad</a>
          </p>
        </div>
      </div>
    </div>
  )
}
