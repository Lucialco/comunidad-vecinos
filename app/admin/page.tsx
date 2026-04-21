'use client'

import { useState, useEffect, useCallback } from 'react'

type Afectado = { id: string; nombre: string; email: string; telefono?: string | null }
type Comentario = { id: string; texto: string; autor: string; rol: string; creadoEn: string }
type Comunicacion = { id: string; tipo: string; destinatario: string; asunto: string; estado: string; creadoEn: string }
type Ticket = {
  id: string
  numero: number
  titulo: string
  descripcion: string
  categoria: string
  prioridad: string
  estado: string
  zona: string
  piso?: string | null
  foto?: string | null
  vecino: string
  emailVecino: string
  telefonoVecino?: string | null
  creadoEn: string
  cerradoEn?: string | null
  cerradoPor?: string | null
  valoracionReparacion?: number | null
  valoracionRapidez?: number | null
  valoracionComunicacion?: number | null
  valoracionComentario?: string | null
  valoracionFecha?: string | null
  comentarios: Comentario[]
  afectados: Afectado[]
  comunicaciones?: Comunicacion[]
  _count?: { comunicaciones: number }
}

const PRIORIDAD_COLORS: Record<string, string> = {
  Urgente: 'bg-red-100 text-red-700',
  Alta: 'bg-orange-100 text-orange-700',
  Normal: 'bg-[#FBF3DA] text-[#8B6914]',
  Baja: 'bg-gray-100 text-gray-600',
}

const ESTADO_COLORS: Record<string, string> = {
  Abierto: 'bg-[#FBF3DA] text-[#8B6914]',
  'En progreso': 'bg-[#FBF3DA] text-[#8B6914]',
  Cerrado: 'bg-green-100 text-green-700',
}

function StarsDisplay({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="w-4 h-4" fill={value >= s ? '#f59e0b' : '#e5e7eb'} viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  )
}

export default function AdminPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)
  const [filtroEstado, setFiltroEstado] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const [ticketDetalle, setTicketDetalle] = useState<Ticket | null>(null)
  const [detalleCompleto, setDetalleCompleto] = useState<Ticket | null>(null)
  const [tabDetalle, setTabDetalle] = useState<'info' | 'comunicaciones'>('info')

  // Modal "En progreso"
  const [modalProgreso, setModalProgreso] = useState<Ticket | null>(null)
  const [comentarioProgreso, setComentarioProgreso] = useState('')
  const [marcandoProgreso, setMarcandoProgreso] = useState(false)
  const [errorProgreso, setErrorProgreso] = useState('')

  // Modal "Cerrar"
  const [modalCerrar, setModalCerrar] = useState<Ticket | null>(null)
  const [comentarioCierre, setComentarioCierre] = useState('')
  const [fotoCierre, setFotoCierre] = useState<File | null>(null)
  const [cerrando, setCerrando] = useState(false)
  const [errorCierre, setErrorCierre] = useState('')

  const cargarTickets = useCallback(async () => {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (filtroEstado) params.set('estado', filtroEstado)
      if (filtroCategoria) params.set('categoria', filtroCategoria)
      if (filtroPrioridad) params.set('prioridad', filtroPrioridad)
      if (filtroDesde) params.set('desde', filtroDesde)
      if (filtroHasta) params.set('hasta', filtroHasta)
      const res = await fetch(`/api/tickets?${params}`)
      const data = await res.json()
      setTickets(Array.isArray(data) ? data : data.tickets ?? [])
    } catch { /* silent */ }
    finally { setCargando(false) }
  }, [filtroEstado, filtroCategoria, filtroPrioridad, filtroDesde, filtroHasta])

  useEffect(() => { cargarTickets() }, [cargarTickets])

  function abrirDetalle(ticket: Ticket) {
    setTicketDetalle(ticket)
    setTabDetalle('info')
    setDetalleCompleto(null)
    fetch(`/api/tickets/${ticket.id}`)
      .then((r) => r.json())
      .then(setDetalleCompleto)
      .catch(console.error)
  }

  function cerrarDetalle() {
    setTicketDetalle(null)
    setDetalleCompleto(null)
  }

  async function marcarProgreso() {
    if (!modalProgreso) return
    if (!comentarioProgreso.trim()) { setErrorProgreso('El comentario es obligatorio'); return }
    setMarcandoProgreso(true); setErrorProgreso('')
    try {
      const res = await fetch(`/api/tickets/${modalProgreso.id}/progreso`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comentario: comentarioProgreso, autor: 'Administrador' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setModalProgreso(null); setComentarioProgreso(''); setTicketDetalle(null); setDetalleCompleto(null)
      cargarTickets()
    } catch (err: unknown) {
      setErrorProgreso(err instanceof Error ? err.message : 'Error')
    } finally { setMarcandoProgreso(false) }
  }

  async function cerrarTicket() {
    if (!modalCerrar) return
    if (!comentarioCierre.trim()) { setErrorCierre('El comentario es obligatorio'); return }
    if (!fotoCierre) { setErrorCierre('La foto es obligatoria'); return }
    setCerrando(true); setErrorCierre('')
    const fd = new FormData()
    fd.append('comentario', comentarioCierre)
    fd.append('cerradoPor', 'Administrador')
    fd.append('foto', fotoCierre)
    try {
      const res = await fetch(`/api/tickets/${modalCerrar.id}/cerrar`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setModalCerrar(null); setComentarioCierre(''); setFotoCierre(null)
      setTicketDetalle(null); setDetalleCompleto(null)
      cargarTickets()
    } catch (err: unknown) {
      setErrorCierre(err instanceof Error ? err.message : 'Error al cerrar')
    } finally { setCerrando(false) }
  }

  const abiertos = tickets.filter((t) => t.estado === 'Abierto').length
  const enProgreso = tickets.filter((t) => t.estado === 'En progreso').length
  const cerrados = tickets.filter((t) => t.estado === 'Cerrado').length

  function exportarCSV() {
    const headers = ['Nº', 'Título', 'Categoría', 'Prioridad', 'Estado', 'Zona', 'Piso', 'Vecino', 'Email', 'Teléfono', 'Fecha Creación', 'Fecha Cierre', 'Afectados', 'Val. Reparación', 'Val. Rapidez', 'Val. Comunicación']
    const escape = (v: string | number | null | undefined) => {
      const s = String(v ?? '')
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
    }
    const rows = tickets.map((t) => [
      t.numero,
      escape(t.titulo),
      t.categoria,
      t.prioridad,
      t.estado,
      t.zona,
      escape(t.piso),
      escape(t.vecino),
      t.emailVecino,
      t.telefonoVecino ?? '',
      new Date(t.creadoEn).toLocaleDateString('es-ES'),
      t.cerradoEn ? new Date(t.cerradoEn).toLocaleDateString('es-ES') : '',
      t.afectados.length,
      t.valoracionReparacion ?? '',
      t.valoracionRapidez ?? '',
      t.valoracionComunicacion ?? '',
    ].join(','))
    const csv = '\uFEFF' + [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tickets-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function exportarPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFontSize(18)
    doc.setTextColor(201, 162, 39)
    doc.text('Comunidad Parcela 8 — Informe de Incidencias', 14, 16)
    doc.setFontSize(10)
    doc.setTextColor(120, 120, 120)
    const periodo = filtroDesde || filtroHasta
      ? `Período: ${filtroDesde || '—'} → ${filtroHasta || '—'} · `
      : ''
    doc.text(`${periodo}Generado: ${new Date().toLocaleDateString('es-ES')} · Total: ${tickets.length} tickets`, 14, 24)

    autoTable(doc, {
      startY: 30,
      head: [['Nº', 'Título', 'Categoría', 'Estado', 'Prioridad', 'Zona', 'Vecino', 'Creado', 'Cierre', 'Afect.', 'Val.']],
      body: tickets.map((t) => [
        t.numero,
        t.titulo.slice(0, 35),
        t.categoria,
        t.estado,
        t.prioridad,
        t.zona,
        t.vecino,
        new Date(t.creadoEn).toLocaleDateString('es-ES'),
        t.cerradoEn ? new Date(t.cerradoEn).toLocaleDateString('es-ES') : '—',
        t.afectados.length,
        t.valoracionReparacion ? `${((t.valoracionReparacion + (t.valoracionRapidez ?? 0) + (t.valoracionComunicacion ?? 0)) / 3).toFixed(1)}★` : '—',
      ]),
      headStyles: { fillColor: [201, 162, 39], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [251, 243, 218] },
      styles: { fontSize: 8, cellPadding: 2 },
    })

    doc.save(`tickets-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Panel de Administración</h1>
          <p className="text-gray-500 mt-1 text-sm">Comunidad Parcela 8 — Gestión de incidencias</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Total', value: tickets.length, color: 'bg-[#FBF3DA] text-[#8B6914]' },
            { label: 'Abiertos', value: abiertos, color: 'bg-amber-50 text-amber-800' },
            { label: 'En progreso', value: enProgreso, color: 'bg-blue-50 text-blue-700' },
            { label: 'Cerrados', value: cerrados, color: 'bg-green-50 text-green-700' },
          ].map((stat) => (
            <div key={stat.label} className={`rounded-xl p-3 sm:p-4 ${stat.color}`}>
              <p className="text-2xl sm:text-3xl font-bold">{stat.value}</p>
              <p className="text-xs sm:text-sm font-medium mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 mb-5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-wrap">
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]">
                <option value="">Todos los estados</option>
                <option>Abierto</option><option>En progreso</option><option>Cerrado</option>
              </select>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]">
                <option value="">Todas las categorías</option>
                {['Ascensor', 'Iluminación', 'Estructura', 'Pintura', 'Limpieza', 'Otros'].map((c) => <option key={c}>{c}</option>)}
              </select>
              <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="w-full sm:w-auto border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]">
                <option value="">Todas las prioridades</option>
                {['Urgente', 'Alta', 'Normal', 'Baja'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:flex-wrap items-start sm:items-center">
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Desde</label>
                <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]" />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs font-medium text-gray-600 whitespace-nowrap">Hasta</label>
                <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]" />
              </div>
              <button onClick={() => { setFiltroEstado(''); setFiltroCategoria(''); setFiltroPrioridad(''); setFiltroDesde(''); setFiltroHasta('') }}
                className="text-sm text-gray-500 hover:text-gray-800 underline">
                Limpiar filtros
              </button>
              <div className="flex gap-2 sm:ml-auto">
                <button onClick={exportarCSV} disabled={tickets.length === 0}
                  className="flex items-center gap-1.5 text-sm bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  CSV
                </button>
                <button onClick={exportarPDF} disabled={tickets.length === 0}
                  className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  PDF
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket list */}
        {cargando ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {tickets.length === 0 && (
              <div className="text-center py-12 text-gray-400">No hay tickets con estos filtros</div>
            )}
            {tickets.map((ticket) => (
              <div key={ticket.id}
                className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 hover:border-[#C9A227] transition-colors cursor-pointer"
                onClick={() => abrirDetalle(ticket)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="text-xs font-mono text-gray-400">#{ticket.numero}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ESTADO_COLORS[ticket.estado] || 'bg-gray-100 text-gray-600'}`}>{ticket.estado}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PRIORIDAD_COLORS[ticket.prioridad] || 'bg-gray-100 text-gray-600'}`}>{ticket.prioridad}</span>
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full hidden sm:inline">{ticket.categoria}</span>
                      {ticket.valoracionFecha && <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">⭐</span>}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base truncate">{ticket.titulo}</p>
                    <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{ticket.vecino} · {ticket.zona}</p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 flex-shrink-0">
                    {ticket.afectados.length > 0 && (
                      <span className="flex items-center gap-1 text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded-full">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        +{ticket.afectados.length}
                      </span>
                    )}
                    {ticket.estado === 'Abierto' && (
                      <button onClick={(e) => { e.stopPropagation(); setModalProgreso(ticket); setErrorProgreso('') }}
                        className="text-xs bg-yellow-50 text-yellow-700 px-2.5 py-1.5 rounded-lg hover:bg-yellow-100 transition-colors font-medium whitespace-nowrap">
                        En progreso
                      </button>
                    )}
                    {ticket.estado === 'En progreso' && (
                      <button onClick={(e) => { e.stopPropagation(); setModalCerrar(ticket); setErrorCierre('') }}
                        className="text-xs bg-red-50 text-red-700 px-2.5 py-1.5 rounded-lg hover:bg-red-100 transition-colors font-medium">
                        Cerrar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ---- MODAL DETALLE ---- */}
      {ticketDetalle && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mt-2 sm:my-8">
            {/* Header */}
            <div className="flex items-start justify-between p-4 sm:p-6 border-b gap-3">
              <div>
                <span className="text-xs text-gray-400 font-mono">#{ticketDetalle.numero}</span>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{ticketDetalle.titulo}</h2>
              </div>
              <button onClick={cerrarDetalle} className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1 p-1">
                <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b px-4 sm:px-6">
              {(['info', 'comunicaciones'] as const).map((tab) => (
                <button key={tab}
                  onClick={() => setTabDetalle(tab)}
                  className={`px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px
                    ${tabDetalle === tab ? 'border-[#C9A227] text-[#C9A227]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'info' ? 'Información' : (
                    <span className="flex items-center gap-1.5">
                      Comunicaciones
                      {detalleCompleto?.comunicaciones && (
                        <span className="text-xs bg-[#FBF3DA] text-[#8B6914] px-1.5 py-0.5 rounded-full">
                          {detalleCompleto.comunicaciones.length}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              {tabDetalle === 'info' && (
                <>
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLORS[ticketDetalle.estado] || ''}`}>{ticketDetalle.estado}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORIDAD_COLORS[ticketDetalle.prioridad] || ''}`}>{ticketDetalle.prioridad}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{ticketDetalle.categoria}</span>
                  </div>
                  {/* Info grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Vecino:</span> <span className="font-medium">{ticketDetalle.vecino}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium break-all">{ticketDetalle.emailVecino}</span></div>
                    <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{ticketDetalle.telefonoVecino || '—'}</span></div>
                    <div><span className="text-gray-500">Zona:</span> <span className="font-medium">{ticketDetalle.zona}{ticketDetalle.piso ? ` · ${ticketDetalle.piso}` : ''}</span></div>
                    <div><span className="text-gray-500">Creado:</span> <span className="font-medium">{new Date(ticketDetalle.creadoEn).toLocaleString('es-ES')}</span></div>
                    {ticketDetalle.cerradoEn && <div><span className="text-gray-500">Cerrado:</span> <span className="font-medium">{new Date(ticketDetalle.cerradoEn).toLocaleString('es-ES')}</span></div>}
                    {ticketDetalle.cerradoPor && <div><span className="text-gray-500">Cerrado por:</span> <span className="font-medium">{ticketDetalle.cerradoPor}</span></div>}
                  </div>
                  {/* Descripción */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                    <p className="text-sm text-gray-600 bg-slate-50 p-3 rounded-lg">{ticketDetalle.descripcion}</p>
                  </div>
                  {/* Foto */}
                  {ticketDetalle.foto && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Foto</p>
                      <img src={ticketDetalle.foto} alt="Foto incidencia" className="max-h-48 sm:max-h-56 rounded-xl border w-auto" />
                    </div>
                  )}
                  {/* Afectados */}
                  {ticketDetalle.afectados.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Vecinos afectados ({ticketDetalle.afectados.length})</p>
                      <div className="space-y-1">
                        {ticketDetalle.afectados.map((a) => (
                          <div key={a.id} className="text-sm bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg break-all">
                            {a.nombre} · {a.email}{a.telefono ? ` · ${a.telefono}` : ''}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Historial comentarios */}
                  {ticketDetalle.comentarios.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Historial de comentarios</p>
                      <div className="space-y-2 max-h-48 sm:max-h-60 overflow-y-auto">
                        {ticketDetalle.comentarios.map((c) => (
                          <div key={c.id} className={`text-sm p-3 rounded-lg ${c.rol === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mb-1">
                              <span className={`text-xs font-semibold ${c.rol === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}>{c.autor}</span>
                              {c.rol === 'admin' && <span className="text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded">Admin</span>}
                              <span className="text-xs text-gray-400 sm:ml-auto">{new Date(c.creadoEn).toLocaleString('es-ES')}</span>
                            </div>
                            <p className="text-gray-700">{c.texto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Valoración */}
                  {ticketDetalle.valoracionFecha && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-3">Valoración del vecino</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Calidad reparación', value: ticketDetalle.valoracionReparacion },
                          { label: 'Rapidez', value: ticketDetalle.valoracionRapidez },
                          { label: 'Comunicación', value: ticketDetalle.valoracionComunicacion },
                        ].map(({ label, value }) => value != null && (
                          <div key={label} className="flex items-center justify-between gap-2">
                            <span className="text-sm text-amber-700">{label}</span>
                            <StarsDisplay value={value} />
                          </div>
                        ))}
                        {ticketDetalle.valoracionComentario && (
                          <p className="text-sm text-amber-700 mt-2 pt-2 border-t border-amber-200">
                            &ldquo;{ticketDetalle.valoracionComentario}&rdquo;
                          </p>
                        )}
                        <p className="text-xs text-amber-500 mt-1">{new Date(ticketDetalle.valoracionFecha).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    {ticketDetalle.estado === 'Abierto' && (
                      <button onClick={() => { setModalProgreso(ticketDetalle); setErrorProgreso('') }}
                        className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-semibold hover:bg-yellow-600 transition-colors text-sm sm:text-base">
                        Marcar en progreso
                      </button>
                    )}
                    {ticketDetalle.estado === 'En progreso' && (
                      <button onClick={() => { setModalCerrar(ticketDetalle); setErrorCierre('') }}
                        className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors text-sm sm:text-base">
                        Cerrar ticket
                      </button>
                    )}
                  </div>
                </>
              )}

              {tabDetalle === 'comunicaciones' && (
                <div>
                  {!detalleCompleto ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : !detalleCompleto.comunicaciones || detalleCompleto.comunicaciones.length === 0 ? (
                    <p className="text-gray-400 text-sm text-center py-10">Sin comunicaciones registradas</p>
                  ) : (
                    <div className="space-y-2">
                      {detalleCompleto.comunicaciones.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                          <span className="text-base flex-shrink-0 mt-0.5">{c.tipo === 'Email' ? '✉️' : '💬'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-0.5">
                              <span className="font-medium text-gray-700 truncate">{c.destinatario}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                                c.estado === 'Enviado' ? 'bg-green-100 text-green-700' :
                                c.estado === 'Error' ? 'bg-red-100 text-red-700' :
                                'bg-[#FBF3DA] text-[#8B6914]'
                              }`}>{c.estado}</span>
                            </div>
                            <p className="text-gray-600 text-xs sm:text-sm truncate">{c.asunto}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{new Date(c.creadoEn).toLocaleString('es-ES')}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL EN PROGRESO ---- */}
      {modalProgreso && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Marcar en progreso</h3>
            <p className="text-sm text-gray-500 mb-4">#{modalProgreso.numero} — {modalProgreso.titulo}</p>
            {errorProgreso && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorProgreso}</div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Comentario para el vecino <span className="text-red-500">*</span>
              </label>
              <textarea value={comentarioProgreso} onChange={(e) => setComentarioProgreso(e.target.value)}
                rows={3} placeholder="Ej: Avisado técnico del ascensor, vendrá el martes 23..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
              <p className="text-xs text-gray-400 mt-1">Este comentario se enviará al vecino y al presidente por email.</p>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setModalProgreso(null); setComentarioProgreso(''); setErrorProgreso('') }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
              <button onClick={marcarProgreso} disabled={marcandoProgreso}
                className="flex-1 bg-yellow-500 text-white py-2.5 rounded-xl font-semibold hover:bg-yellow-600 transition-colors disabled:opacity-50 text-sm">
                {marcandoProgreso ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- MODAL CERRAR ---- */}
      {modalCerrar && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-[60]">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full p-4 sm:p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-1">Cerrar ticket #{modalCerrar.numero}</h3>
            <p className="text-sm text-gray-500 mb-4">{modalCerrar.titulo}</p>
            {errorCierre && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{errorCierre}</div>
            )}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Comentario de resolución <span className="text-red-500">*</span>
                </label>
                <textarea value={comentarioCierre} onChange={(e) => setComentarioCierre(e.target.value)}
                  rows={3} placeholder="Describa cómo se resolvió la incidencia..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227] resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Foto de resolución <span className="text-red-500">*</span>
                </label>
                <input type="file" accept="image/*" onChange={(e) => setFotoCierre(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#FBF3DA] file:text-[#8B6914] hover:file:bg-[#F5E9C0]" />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => { setModalCerrar(null); setComentarioCierre(''); setFotoCierre(null); setErrorCierre('') }}
                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm">Cancelar</button>
              <button onClick={cerrarTicket} disabled={cerrando}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 text-sm">
                {cerrando ? 'Cerrando...' : 'Confirmar cierre'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
