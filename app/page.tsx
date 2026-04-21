'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const CATEGORIAS = ['Ascensor', 'Iluminación', 'Estructura', 'Pintura', 'Limpieza', 'Otros']
const PRIORIDADES = ['Baja', 'Normal', 'Alta', 'Urgente']
const ZONAS = ['Portal A', 'Portal B', 'Portal C', 'Jardines', 'Aparcamiento', 'Azotea', 'Sótano', 'Zona común']

type TicketSimilar = {
  id: string
  numero: number
  titulo: string
  descripcion: string
  categoria: string
  zona: string
  estado: string
  creadoEn: string
  afectados: Array<{ nombre: string; email: string }>
}

type FormState = {
  vecino: string
  email: string
  telefono: string
  categoria: string
  prioridad: string
  zona: string
  piso: string
  titulo: string
  descripcion: string
  foto: File | null
}

export default function Home() {
  const [form, setForm] = useState<FormState>({
    vecino: '',
    email: '',
    telefono: '',
    categoria: '',
    prioridad: 'Normal',
    zona: '',
    piso: '',
    titulo: '',
    descripcion: '',
    foto: null,
  })

  const [similares, setSimilares] = useState<TicketSimilar[]>([])
  const [buscandoSimilares, setBuscandoSimilares] = useState(false)
  const [mostrarSimilares, setMostrarSimilares] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito] = useState<{ numero: number } | null>(null)
  const [error, setError] = useState('')

  const [modalUnirse, setModalUnirse] = useState<TicketSimilar | null>(null)
  const [uniendose, setUniendose] = useState(false)
  const [exitoUnido, setExitoUnido] = useState(false)

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const buscarSimilares = useCallback(async (data: FormState) => {
    if (!data.categoria && !data.zona && data.descripcion.length < 3) return

    setBuscandoSimilares(true)
    try {
      const params = new URLSearchParams()
      if (data.categoria) params.set('categoria', data.categoria)
      if (data.zona) params.set('zona', data.zona)
      if (data.descripcion.length >= 3) params.set('q', data.descripcion)

      const res = await fetch(`/api/tickets/similares?${params}`)
      const data2 = await res.json()
      setSimilares(data2)
      setMostrarSimilares(data2.length > 0)
    } catch {
      // silent
    } finally {
      setBuscandoSimilares(false)
    }
  }, [])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => buscarSimilares(form), 600)
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current)
    }
  }, [form.categoria, form.zona, form.descripcion, buscarSimilares])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleFoto(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, foto: e.target.files?.[0] || null }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError('')

    const fd = new FormData()
    fd.append('titulo', form.titulo)
    fd.append('descripcion', form.descripcion)
    fd.append('categoria', form.categoria)
    fd.append('prioridad', form.prioridad)
    fd.append('zona', form.zona)
    if (form.piso) fd.append('piso', form.piso)
    fd.append('vecino', form.vecino)
    fd.append('emailVecino', form.email)
    if (form.telefono) fd.append('telefonoVecino', form.telefono)
    if (form.foto) fd.append('foto', form.foto)

    try {
      const res = await fetch('/api/tickets', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error desconocido')
      setExito({ numero: data.numero })
      setForm({
        vecino: '', email: '', telefono: '', categoria: '', prioridad: 'Normal',
        zona: '', piso: '', titulo: '', descripcion: '', foto: null,
      })
      setSimilares([])
      setMostrarSimilares(false)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al enviar')
    } finally {
      setEnviando(false)
    }
  }

  async function handleUnirse(ticket: TicketSimilar) {
    if (!form.vecino || !form.email) {
      alert('Por favor rellena tu nombre y email antes de unirte a un ticket')
      return
    }
    setModalUnirse(ticket)
  }

  async function confirmarUnirse() {
    if (!modalUnirse) return
    setUniendose(true)
    try {
      const res = await fetch(`/api/tickets/${modalUnirse.id}/unirse`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: form.vecino, email: form.email, telefono: form.telefono }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setExitoUnido(true)
      setModalUnirse(null)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al unirse')
    } finally {
      setUniendose(false)
    }
  }

  if (exito) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ticket registrado!</h2>
          <p className="text-gray-600 mb-1">
            Su incidencia ha sido registrada con el número
          </p>
          <p className="text-4xl font-bold text-[#C9A227] mb-4">#{exito.numero}</p>
          <p className="text-sm text-gray-500 mb-6">
            Recibirá un email de confirmación. La administración gestionará su incidencia.
          </p>
          <button
            onClick={() => setExito(null)}
            className="bg-[#C9A227] text-white px-6 py-2 rounded-lg hover:bg-[#A07D1A] transition-colors"
          >
            Registrar otra incidencia
          </button>
        </div>
      </div>
    )
  }

  if (exitoUnido) {
    return (
      <div className="min-h-screen bg-[#FAFAF7] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-[#FBF3DA] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#C9A227]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Te has unido al ticket!</h2>
          <p className="text-sm text-gray-500 mb-6">
            Recibirás notificaciones cuando el ticket sea actualizado o resuelto.
          </p>
          <button
            onClick={() => setExitoUnido(false)}
            className="bg-[#C9A227] text-white px-6 py-2 rounded-lg hover:bg-[#A07D1A] transition-colors"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF7] py-4 sm:py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-4 sm:p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Comunidad Parcela 8 — Incidencias</h1>
            <p className="text-gray-500 mt-1">Comunique cualquier problema en las zonas comunes</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {mostrarSimilares && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 mb-2">
                    Encontramos {similares.length} incidencia{similares.length > 1 ? 's' : ''} similar{similares.length > 1 ? 'es' : ''}
                  </p>
                  <div className="space-y-2">
                    {similares.map((t) => (
                      <div key={t.id} className="bg-white border border-amber-200 rounded-lg p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-mono text-gray-400">#{t.numero}</span>
                            <p className="text-sm font-medium text-gray-800">{t.titulo}</p>
                            <p className="text-xs text-gray-500">{t.categoria} · {t.zona} · {t.afectados.length + 1} afectados</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleUnirse(t)}
                            className="text-xs bg-[#C9A227] text-white px-3 py-1.5 rounded-lg hover:bg-[#A07D1A] transition-colors whitespace-nowrap flex-shrink-0"
                          >
                            Unirme
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-700 mt-2">
                    ¿Sufres el mismo problema? Únete en lugar de crear un ticket nuevo, o continúa para reportar una incidencia diferente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                  name="vecino"
                  value={form.vecino}
                  onChange={handleChange}
                  required
                  placeholder="Juan García López"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="juan@ejemplo.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                placeholder="600 000 000"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoría <span className="text-red-500">*</span>
                </label>
                <select
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                >
                  <option value="">Seleccionar...</option>
                  {CATEGORIAS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridad</label>
                <select
                  name="prioridad"
                  value={form.prioridad}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                >
                  {PRIORIDADES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona <span className="text-red-500">*</span>
                </label>
                <select
                  name="zona"
                  value={form.zona}
                  onChange={handleChange}
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                >
                  <option value="">Seleccionar zona...</option>
                  {ZONAS.map((z) => (
                    <option key={z} value={z}>{z}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Piso / Vivienda</label>
                <input
                  name="piso"
                  value={form.piso}
                  onChange={handleChange}
                  placeholder="2ºA"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título de la incidencia <span className="text-red-500">*</span>
              </label>
              <input
                name="titulo"
                value={form.titulo}
                onChange={handleChange}
                required
                placeholder="Ej: Ascensor fuera de servicio en portal A"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción detallada <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Describa el problema con el mayor detalle posible..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] focus:border-transparent resize-none"
                />
                {buscandoSimilares && (
                  <div className="absolute right-2 top-2">
                    <div className="w-4 h-4 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto (opcional)</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleFoto}
                className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#FBF3DA] file:text-[#8B6914] hover:file:bg-[#F5E9C0]"
              />
              {form.foto && (
                <p className="text-xs text-gray-500 mt-1">{form.foto.name}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={enviando}
              className="w-full bg-[#C9A227] text-white py-3 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                'Enviar incidencia'
              )}
            </button>
          </form>
        </div>
      </div>

      {modalUnirse && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Unirse al ticket #{modalUnirse.numero}</h3>
            <p className="text-sm text-gray-600 mb-1 font-medium">{modalUnirse.titulo}</p>
            <p className="text-sm text-gray-500 mb-4">{modalUnirse.descripcion}</p>
            <p className="text-sm text-gray-700 mb-6">
              Te unirás como vecino afectado con tu nombre <strong>{form.vecino}</strong> y email <strong>{form.email}</strong>.
              Recibirás notificaciones cuando se actualice o resuelva.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setModalUnirse(null)}
                className="flex-1 border border-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarUnirse}
                disabled={uniendose}
                className="flex-1 bg-[#C9A227] text-white py-2 rounded-lg hover:bg-[#A07D1A] transition-colors disabled:opacity-50"
              >
                {uniendose ? 'Uniéndose...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
