'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

type TicketInfo = {
  id: string
  numero: number
  titulo: string
  estado: string
  cerradoEn?: string | null
  zona: string
  categoria: string
  valoracionFecha?: string | null
}

function StarRating({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  const [hover, setHover] = useState(0)
  const LABELS = ['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente']

  return (
    <div className="mb-6">
      <p className="text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="p-1 transition-transform hover:scale-110 focus:outline-none"
          >
            <svg
              className="w-9 h-9 transition-colors"
              fill={(hover || value) >= star ? '#C9A227' : 'none'}
              stroke={(hover || value) >= star ? '#C9A227' : '#d1d5db'}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </button>
        ))}
        {(hover || value) > 0 && (
          <span className="ml-2 text-sm text-[#C9A227] font-medium">
            {LABELS[hover || value]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function ValorarPage() {
  const { id } = useParams<{ id: string }>()
  const [ticket, setTicket] = useState<TicketInfo | null>(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  const [reparacion, setReparacion] = useState(0)
  const [rapidez, setRapidez] = useState(0)
  const [comunicacion, setComunicacion] = useState(0)
  const [comentario, setComentario] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/tickets/${id}/valorar`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error)
        } else {
          setTicket(data)
        }
        setCargando(false)
      })
      .catch(() => {
        setError('Error al cargar el ticket')
        setCargando(false)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reparacion || !rapidez || !comunicacion) {
      setError('Por favor puntúe las tres categorías')
      return
    }
    setEnviando(true)
    setError('')
    try {
      const res = await fetch(`/api/tickets/${id}/valorar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valoracionReparacion: reparacion,
          valoracionRapidez: rapidez,
          valoracionComunicacion: comunicacion,
          valoracionComentario: comentario || null,
        }),
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

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">¡Gracias por su valoración!</h2>
          <p className="text-gray-500 mb-2">
            Su opinión nos ayuda a mejorar el servicio para toda la comunidad.
          </p>
          {ticket && (
            <p className="text-sm text-gray-400">Ticket #{ticket.numero} — {ticket.titulo}</p>
          )}
        </div>
      </div>
    )
  }

  if (!ticket || ticket.estado !== 'Cerrado') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">No disponible</h2>
          <p className="text-gray-500 text-sm">
            {error || 'Este ticket no está disponible para valorar.'}
          </p>
        </div>
      </div>
    )
  }

  if (ticket.valoracionFecha) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Ya valorado</h2>
          <p className="text-gray-500 text-sm">Este ticket ya ha sido valorado. ¡Gracias!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 py-4 sm:py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Valore la reparación</h1>
            <p className="text-gray-500 mt-1 text-sm">Su opinión mejora el servicio de la comunidad</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <p className="text-xs text-gray-400 mb-1">Ticket #{ticket.numero}</p>
            <p className="font-semibold text-gray-800">{ticket.titulo}</p>
            <p className="text-sm text-gray-500">{ticket.categoria} · {ticket.zona}</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <StarRating
              label="Calidad de la reparación"
              value={reparacion}
              onChange={setReparacion}
            />
            <StarRating
              label="Rapidez de respuesta"
              value={rapidez}
              onChange={setRapidez}
            />
            <StarRating
              label="Comunicación recibida"
              value={comunicacion}
              onChange={setComunicacion}
            />

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Comentario (opcional)
              </label>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                rows={3}
                placeholder="¿Desea añadir algún comentario sobre la resolución?"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={enviando || !reparacion || !rapidez || !comunicacion}
              className="w-full bg-[#C9A227] text-white py-3 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar valoración'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
