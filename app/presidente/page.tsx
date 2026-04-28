'use client'

import { useState, useEffect, useMemo } from 'react'
import dynamic from 'next/dynamic'

const BarMonthChart = dynamic(() => import('../components/DashboardCharts').then(m => ({ default: m.BarMonthChart })), { ssr: false, loading: () => <ChartSkeleton /> })
const DonutCategoryChart = dynamic(() => import('../components/DashboardCharts').then(m => ({ default: m.DonutCategoryChart })), { ssr: false, loading: () => <ChartSkeleton /> })
const LineResolutionChart = dynamic(() => import('../components/DashboardCharts').then(m => ({ default: m.LineResolutionChart })), { ssr: false, loading: () => <ChartSkeleton /> })
const HBarZoneChart = dynamic(() => import('../components/DashboardCharts').then(m => ({ default: m.HBarZoneChart })), { ssr: false, loading: () => <ChartSkeleton /> })

function ChartSkeleton() {
  return <div className="h-full bg-stone-100 rounded-lg animate-pulse" />
}

type Comentario = { id: string; texto: string; autor: string; rol: string; creadoEn: string }
type Afectado = { id: string; nombre: string; email: string }
type Comunicacion = { id: string; tipo: string; destinatario: string; asunto: string; estado: string; creadoEn: string }
type Ticket = {
  id: string; numero: number; titulo: string; descripcion: string; categoria: string; prioridad: string
  estado: string; zona: string; piso?: string | null; calle?: string | null; bloque?: string | null
  foto?: string | null; vecino: string; emailVecino: string; telefonoVecino?: string | null
  creadoEn: string; actualizadoEn: string; cerradoEn?: string | null; cerradoPor?: string | null
  valoracionReparacion?: number | null; valoracionRapidez?: number | null; valoracionComunicacion?: number | null
  valoracionComentario?: string | null; valoracionFecha?: string | null
  comentarios: Comentario[]; afectados: Afectado[]
  comunicaciones?: Comunicacion[]; _count?: { comunicaciones: number }
}

const CATEGORIAS = ['Obra / Pintura', 'Ascensor', 'Iluminación', 'Estructura', 'Limpieza', 'Otros']
const PRIORIDADES = ['Urgente', 'Alta', 'Normal', 'Baja']
const ESTADOS = ['Abierto', 'En progreso', 'Cerrado']
const PAGE_SIZE = 20

const ESTADO_BADGE: Record<string, string> = {
  Abierto: 'bg-amber-100 text-amber-800',
  'En progreso': 'bg-blue-100 text-blue-800',
  Cerrado: 'bg-green-100 text-green-800',
}
const PRIORIDAD_BADGE: Record<string, string> = {
  Urgente: 'bg-red-100 text-red-700',
  Alta: 'bg-orange-100 text-orange-700',
  Normal: 'bg-stone-100 text-stone-600',
  Baja: 'bg-gray-100 text-gray-500',
}
const TIMELINE_DOT: Record<string, string> = {
  Abierto: 'bg-red-500 ring-red-300',
  'En progreso': 'bg-amber-400 ring-amber-300',
  Cerrado: 'bg-green-500 ring-green-300',
}

function calcularDias(inicio: string, fin?: string | null): number {
  return Math.round(((fin ? new Date(fin) : new Date()).getTime() - new Date(inicio).getTime()) / 86400000)
}

function StarRow({ value }: { value: number }) {
  const n = Math.round(value)
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className="w-3 h-3" fill={n >= s ? '#f59e0b' : '#e5e7eb'} viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  )
}

function SortIcon({ field, current, dir }: { field: string; current: string; dir: 'asc' | 'desc' }) {
  if (field !== current) return <span className="ml-1 opacity-25">↕</span>
  return <span className="ml-1 text-[#D4A017]">{dir === 'asc' ? '↑' : '↓'}</span>
}

export default function PresidentePage() {
  const [allTickets, setAllTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroPrioridad, setFiltroPrioridad] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')
  const [applied, setApplied] = useState({ desde: '', hasta: '', categoria: '', prioridad: '', estado: '' })

  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState('creadoEn')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [page, setPage] = useState(1)

  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detalleCompleto, setDetalleCompleto] = useState<Ticket | null>(null)
  const [tabDetalle, setTabDetalle] = useState<'info' | 'comunicaciones'>('info')

  useEffect(() => {
    setLoading(true)
    fetch('/api/tickets')
      .then((r) => r.json())
      .then((data) => { setAllTickets(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => { setFetchError('Error al cargar tickets'); setLoading(false) })
  }, [])

  const tickets = useMemo(() => allTickets.filter((t) => {
    if (applied.desde && t.creadoEn.slice(0, 10) < applied.desde) return false
    if (applied.hasta && t.creadoEn.slice(0, 10) > applied.hasta) return false
    if (applied.categoria && t.categoria !== applied.categoria) return false
    if (applied.prioridad && t.prioridad !== applied.prioridad) return false
    if (applied.estado && t.estado !== applied.estado) return false
    return true
  }), [allTickets, applied])

  const total = tickets.length
  const abiertos = tickets.filter((t) => t.estado === 'Abierto').length
  const enProgreso = tickets.filter((t) => t.estado === 'En progreso').length
  const cerrados = tickets.filter((t) => t.estado === 'Cerrado').length
  const urgentes = tickets.filter((t) => t.prioridad === 'Urgente' && t.estado !== 'Cerrado').length

  const ticketsCerrados = tickets.filter((t) => t.cerradoEn)
  const tiempoMedio = ticketsCerrados.length > 0
    ? Math.round(ticketsCerrados.reduce((acc, t) => acc + calcularDias(t.creadoEn, t.cerradoEn), 0) / ticketsCerrados.length)
    : null

  const now = new Date()
  const currM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const prevM = `${now.getFullYear()}-${String(now.getMonth()).padStart(2, '0')}`
  const avgMes = (m: string) => { const cl = tickets.filter((t) => t.cerradoEn?.slice(0, 7) === m); return cl.length > 0 ? Math.round(cl.reduce((a, t) => a + calcularDias(t.creadoEn, t.cerradoEn), 0) / cl.length) : null }
  const tiempoActual = avgMes(currM); const tiempoPrev = avgMes(prevM)
  const tendencia = tiempoActual !== null && tiempoPrev !== null ? (tiempoActual < tiempoPrev ? 'mejor' : tiempoActual > tiempoPrev ? 'peor' : 'igual') : null

  const ticketsValorados = tickets.filter((t) => t.valoracionFecha && t.valoracionReparacion)
  const mediaValoracion = ticketsValorados.length > 0
    ? ticketsValorados.reduce((a, t) => a + ((t.valoracionReparacion || 0) + (t.valoracionRapidez || 0) + (t.valoracionComunicacion || 0)) / 3, 0) / ticketsValorados.length
    : null

  const totalComunicaciones = allTickets.reduce((a, t) => a + (t._count?.comunicaciones || 0), 0)

  const tableFiltered = useMemo(() => {
    let list = [...tickets]
    if (search) {
      const q = search.toLowerCase()
      list = list.filter((t) => t.titulo.toLowerCase().includes(q) || t.vecino.toLowerCase().includes(q) || String(t.numero).includes(q) || t.categoria.toLowerCase().includes(q))
    }
    list.sort((a, b) => {
      const av = (a as Record<string, unknown>)[sortField]
      const bv = (b as Record<string, unknown>)[sortField]
      if (av == null) return 1; if (bv == null) return -1
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [tickets, search, sortField, sortDir])

  const totalPages = Math.ceil(tableFiltered.length / PAGE_SIZE)
  const paginated = tableFiltered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function applyFilters() { setApplied({ desde: filtroDesde, hasta: filtroHasta, categoria: filtroCategoria, prioridad: filtroPrioridad, estado: filtroEstado }); setPage(1) }
  function clearFilters() { setFiltroDesde(''); setFiltroHasta(''); setFiltroCategoria(''); setFiltroPrioridad(''); setFiltroEstado(''); setApplied({ desde: '', hasta: '', categoria: '', prioridad: '', estado: '' }); setPage(1) }
  function toggleSort(field: string) { if (sortField === field) setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); else { setSortField(field); setSortDir('asc') }; setPage(1) }

  async function abrirDetalle(ticket: Ticket) {
    setSelectedTicket(ticket); setTabDetalle('info'); setDetalleCompleto(null)
    const res = await fetch(`/api/tickets/${ticket.id}`)
    if (res.ok) setDetalleCompleto(await res.json())
  }

  function exportCSV() {
    const headers = ['Nº', 'Título', 'Categoría', 'Zona', 'Vecino', 'Prioridad', 'Estado', 'Fecha apertura', 'Días', 'Valoración']
    const rows = tableFiltered.map((t) => [
      t.numero, `"${t.titulo.replace(/"/g, '""')}"`, t.categoria, t.zona, `"${t.vecino.replace(/"/g, '""')}"`,
      t.prioridad, t.estado, new Date(t.creadoEn).toLocaleDateString('es-ES'), calcularDias(t.creadoEn, t.cerradoEn),
      t.valoracionFecha ? (((t.valoracionReparacion || 0) + (t.valoracionRapidez || 0) + (t.valoracionComunicacion || 0)) / 3).toFixed(1) : '',
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }))
    a.download = `informe-presidente-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a); a.click(); document.body.removeChild(a)
  }

  async function exportPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()
    doc.setFontSize(20); doc.setTextColor(212, 160, 23); doc.text('Comunidad Parcela 8', 14, 18)
    doc.setFontSize(13); doc.setTextColor(60, 60, 60); doc.text('Informe del Presidente', 14, 26)
    doc.setFontSize(9); doc.setTextColor(120, 120, 120); doc.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 33)
    autoTable(doc, {
      startY: 40, head: [['KPI', 'Valor']],
      body: [['Total tickets', total], ['Abiertos', abiertos], ['En progreso', enProgreso], ['Cerrados', cerrados], ['Urgentes pendientes', urgentes], ['T. medio resolución', tiempoMedio !== null ? `${tiempoMedio} días` : '—'], ['Valoración media', mediaValoracion !== null ? `${mediaValoracion.toFixed(1)}/5` : '—'], ['Comunicaciones enviadas', totalComunicaciones], ['Tickets valorados', ticketsValorados.length], ['Tasa resolución', total > 0 ? `${Math.round((cerrados / total) * 100)}%` : '0%']],
      headStyles: { fillColor: [212, 160, 23], textColor: 255 }, alternateRowStyles: { fillColor: [255, 253, 245] }, styles: { fontSize: 10 }, columnStyles: { 0: { fontStyle: 'bold' } },
    })
    const nextY = ((doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100) + 10
    autoTable(doc, {
      startY: nextY, head: [['Nº', 'Título', 'Cat.', 'Zona', 'Estado', 'Prioridad', 'Días']],
      body: tableFiltered.slice(0, 100).map((t) => [t.numero, t.titulo.slice(0, 40), t.categoria, t.zona, t.estado, t.prioridad, calcularDias(t.creadoEn, t.cerradoEn)]),
      headStyles: { fillColor: [212, 160, 23], textColor: 255 }, alternateRowStyles: { fillColor: [255, 253, 245] }, styles: { fontSize: 8 },
    })
    doc.save(`informe-presidente-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  if (loading) return (
    <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin" />
    </div>
  )
  if (fetchError) return (
    <div className="min-h-screen bg-[#fffdf5] flex items-center justify-center">
      <div className="bg-white rounded-2xl p-8 text-center border border-red-200">
        <p className="text-red-600 font-medium">{fetchError}</p>
        <button onClick={() => window.location.reload()} className="mt-4 text-sm text-[#D4A017] underline">Reintentar</button>
      </div>
    </div>
  )

  const hasActiveFilters = applied.desde || applied.hasta || applied.categoria || applied.prioridad || applied.estado
  const tasaResolucion = total > 0 ? Math.round((cerrados / total) * 100) : 0

  return (
    <div className="min-h-screen bg-[#fffdf5]">
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard Presidente</h1>
            <p className="text-sm text-gray-500 mt-0.5">Comunidad Parcela 8 · {total} incidencias{hasActiveFilters ? ' (filtradas)' : ''} · Tasa de resolución: <span className="font-semibold text-green-700">{tasaResolucion}%</span></p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 text-sm border border-stone-300 text-stone-700 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV
            </button>
            <button onClick={exportPDF}
              className="flex items-center gap-1.5 text-sm border border-stone-300 text-stone-700 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              PDF
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-stone-200 p-4 mb-6">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
              <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
              <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Categoría</label>
              <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]">
                <option value="">Todas</option>
                {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Prioridad</label>
              <select value={filtroPrioridad} onChange={(e) => setFiltroPrioridad(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]">
                <option value="">Todas</option>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017]">
                <option value="">Todos</option>
                {ESTADOS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <button onClick={applyFilters}
              className="bg-[#D4A017] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#b8880f] transition-colors">
              Aplicar
            </button>
            {hasActiveFilters && (
              <button onClick={clearFilters}
                className="border border-gray-200 text-gray-600 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors">
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          {([
            { label: 'Total', value: total, sub: 'incidencias', bg: 'bg-[#D4A017]', fg: 'text-white', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
            { label: 'Abiertas', value: abiertos, sub: 'sin resolver', bg: urgentes > 0 ? 'bg-red-500' : 'bg-amber-50', fg: urgentes > 0 ? 'text-white' : 'text-amber-800', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' },
            { label: 'Progreso', value: enProgreso, sub: 'en gestión', bg: 'bg-blue-50', fg: 'text-blue-800', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
            { label: 'Cerradas', value: cerrados, sub: 'resueltas', bg: 'bg-green-50', fg: 'text-green-800', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Urgentes', value: urgentes, sub: 'pendientes', bg: urgentes > 0 ? 'bg-red-600' : 'bg-stone-50', fg: urgentes > 0 ? 'text-white' : 'text-stone-500', icon: 'M12 8v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z' },
            { label: 'T. medio', value: tiempoMedio !== null ? `${tiempoMedio}d` : '—', sub: tendencia === 'mejor' ? '↓ mejorando' : tendencia === 'peor' ? '↑ empeorando' : 'días resolución', bg: 'bg-purple-50', fg: tendencia === 'mejor' ? 'text-green-700' : tendencia === 'peor' ? 'text-red-700' : 'text-purple-800', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Valoración', value: mediaValoracion !== null ? `${mediaValoracion.toFixed(1)}★` : '—', sub: `${ticketsValorados.length} valorados`, bg: 'bg-amber-50', fg: 'text-amber-800', icon: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
          ] as const).map((k) => (
            <div key={k.label} className={`rounded-2xl p-4 ${k.bg} ${k.fg}`}>
              <svg className="w-5 h-5 mb-2 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={k.icon} />
              </svg>
              <p className="text-2xl font-bold leading-none">{k.value}</p>
              <p className="text-xs font-semibold mt-1">{k.label}</p>
              <p className="text-xs opacity-60 mt-0.5">{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Extra KPIs row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Tasa de resolución</p>
            <p className="text-2xl font-bold text-gray-900">{tasaResolucion}%</p>
            <div className="w-full bg-stone-100 rounded-full h-1.5 mt-2">
              <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${tasaResolucion}%` }} />
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Comunicaciones enviadas</p>
            <p className="text-2xl font-bold text-gray-900">{totalComunicaciones}</p>
            <p className="text-xs text-gray-400 mt-1">Total acumulado</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Tickets valorados</p>
            <p className="text-2xl font-bold text-gray-900">{ticketsValorados.length}</p>
            <p className="text-xs text-gray-400 mt-1">{total > 0 ? Math.round((ticketsValorados.length / total) * 100) : 0}% del total</p>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-4">
            <p className="text-xs text-gray-500 mb-1">Vecinos afectados</p>
            <p className="text-2xl font-bold text-gray-900">{tickets.reduce((a, t) => a + t.afectados.length, 0) + total}</p>
            <p className="text-xs text-gray-400 mt-1">Total notificados</p>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-1">Línea de tiempo</h2>
          <p className="text-xs text-gray-400 mb-4">Últimas 20 incidencias · haz clic para ver detalle</p>
          {tickets.length === 0 ? <p className="text-sm text-gray-400">Sin incidencias</p> : (
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 min-w-max">
                {[...tickets].sort((a, b) => new Date(b.creadoEn).getTime() - new Date(a.creadoEn).getTime()).slice(0, 20).map((t) => (
                  <button key={t.id} onClick={() => abrirDetalle(t)}
                    title={`#${t.numero} · ${t.titulo} · ${t.zona}`}
                    className="flex flex-col items-center gap-1.5 group">
                    <span className="text-xs text-gray-400 whitespace-nowrap">{new Date(t.creadoEn).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    <span className={`w-4 h-4 rounded-full border-2 border-white shadow ring-2 ring-offset-1 flex-shrink-0 ${TIMELINE_DOT[t.estado] || 'bg-gray-400 ring-gray-300'} group-hover:scale-125 transition-transform`} />
                    <span className="text-xs text-gray-400 font-mono">#{t.numero}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-4 mt-3 text-xs text-gray-400">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Abierto</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />En progreso</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500 inline-block" />Cerrado</span>
              </div>
            </div>
          )}
        </div>

        {/* Charts 2x2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Abiertas vs Cerradas por mes</h2>
            <p className="text-xs text-gray-400 mb-4">Últimos 6 meses</p>
            <div className="h-52"><BarMonthChart tickets={tickets} /></div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Distribución por categoría</h2>
            <p className="text-xs text-gray-400 mb-4">{total} incidencias totales</p>
            <div className="h-52"><DonutCategoryChart tickets={tickets} /></div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Tiempo medio de resolución</h2>
            <p className="text-xs text-gray-400 mb-4">Días promedio por mes de cierre</p>
            <div className="h-52"><LineResolutionChart tickets={tickets} /></div>
          </div>
          <div className="bg-white rounded-2xl border border-stone-200 p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-0.5">Top zonas con incidencias</h2>
            <p className="text-xs text-gray-400 mb-4">Acumulado del período filtrado</p>
            <div className="h-52"><HBarZoneChart tickets={tickets} /></div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden mb-8">
          <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">Listado completo ({tableFiltered.length})</h2>
            <input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              placeholder="Buscar por nº, título, vecino..."
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4A017] w-full sm:w-64" />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 text-xs text-gray-500 uppercase tracking-wide border-b border-stone-100">
                <tr>
                  {([['numero', 'Nº'], ['titulo', 'Título'], ['categoria', 'Cat.'], ['zona', 'Zona'], ['vecino', 'Vecino'], ['prioridad', 'Prior.'], ['estado', 'Estado'], ['creadoEn', 'Apertura']] as [string, string][]).map(([f, l]) => (
                    <th key={f} onClick={() => toggleSort(f)} className="px-4 py-3 text-left cursor-pointer hover:text-gray-800 select-none whitespace-nowrap">
                      {l}<SortIcon field={f} current={sortField} dir={sortDir} />
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Días</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Val.</th>
                  <th className="px-4 py-3 text-left text-xs text-gray-500 uppercase">Detalle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-50">
                {paginated.length === 0 ? (
                  <tr><td colSpan={11} className="px-4 py-10 text-center text-gray-400">Sin resultados</td></tr>
                ) : paginated.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-gray-400 text-xs">#{t.numero}</td>
                    <td className="px-4 py-3 max-w-[160px]">
                      <span className="font-medium text-gray-900 line-clamp-1">{t.titulo}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{t.categoria}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{t.zona}</td>
                    <td className="px-4 py-3 text-gray-700 text-xs max-w-[100px] truncate">{t.vecino}</td>
                    <td className="px-4 py-3"><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${PRIORIDAD_BADGE[t.prioridad] || ''}`}>{t.prioridad}</span></td>
                    <td className="px-4 py-3"><span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ESTADO_BADGE[t.estado] || ''}`}>{t.estado}</span></td>
                    <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(t.creadoEn).toLocaleDateString('es-ES')}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{calcularDias(t.creadoEn, t.cerradoEn)}d</td>
                    <td className="px-4 py-3">{t.valoracionFecha ? <StarRow value={((t.valoracionReparacion || 0) + (t.valoracionRapidez || 0) + (t.valoracionComunicacion || 0)) / 3} /> : <span className="text-gray-200 text-xs">—</span>}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => abrirDetalle(t)}
                        className="text-xs border border-gray-200 text-gray-500 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-stone-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">Página {page} de {totalPages}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">← Anterior</button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i
                  return (
                    <button key={p} onClick={() => setPage(p)}
                      className={`px-3 py-1.5 text-xs border rounded-lg transition-colors ${p === page ? 'bg-[#D4A017] text-white border-[#D4A017]' : 'border-gray-200 hover:bg-gray-50'}`}>
                      {p}
                    </button>
                  )
                })}
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                  className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40">Siguiente →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center p-2 sm:p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mt-2 sm:my-8">
            <div className="flex items-start justify-between p-5 border-b gap-3">
              <div>
                <span className="text-xs text-gray-400 font-mono">#{selectedTicket.numero}</span>
                <h2 className="text-lg font-bold text-gray-900">{selectedTicket.titulo}</h2>
              </div>
              <button onClick={() => { setSelectedTicket(null); setDetalleCompleto(null) }} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex border-b px-5">
              {(['info', 'comunicaciones'] as const).map((tab) => (
                <button key={tab} onClick={() => setTabDetalle(tab)}
                  className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${tabDetalle === tab ? 'border-[#D4A017] text-[#D4A017]' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                  {tab === 'info' ? 'Información' : 'Comunicaciones'}
                </button>
              ))}
            </div>
            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              {tabDetalle === 'info' && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_BADGE[selectedTicket.estado] || ''}`}>{selectedTicket.estado}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORIDAD_BADGE[selectedTicket.prioridad] || ''}`}>{selectedTicket.prioridad}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{selectedTicket.categoria}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Vecino:</span> <span className="font-medium">{selectedTicket.vecino}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium break-all">{selectedTicket.emailVecino}</span></div>
                    <div><span className="text-gray-500">Zona:</span> <span className="font-medium">{selectedTicket.zona}</span></div>
                    <div><span className="text-gray-500">Afectados:</span> <span className="font-medium">{selectedTicket.afectados.length + 1} vecinos</span></div>
                    <div><span className="text-gray-500">Apertura:</span> <span className="font-medium">{new Date(selectedTicket.creadoEn).toLocaleString('es-ES')}</span></div>
                    {selectedTicket.cerradoEn && <div><span className="text-gray-500">Cerrado:</span> <span className="font-medium">{new Date(selectedTicket.cerradoEn).toLocaleString('es-ES')}</span></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                    <p className="text-sm text-gray-600 bg-slate-50 p-3 rounded-lg">{selectedTicket.descripcion}</p>
                  </div>
                  {selectedTicket.foto && <img src={selectedTicket.foto} alt="Foto" className="max-h-48 rounded-xl border w-auto" />}
                  {selectedTicket.comentarios.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Historial ({selectedTicket.comentarios.length})</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {selectedTicket.comentarios.map((c) => (
                          <div key={c.id} className={`text-sm p-3 rounded-lg ${c.rol === 'admin' ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                            <div className="flex justify-between mb-1">
                              <span className={`text-xs font-semibold ${c.rol === 'admin' ? 'text-blue-700' : 'text-gray-600'}`}>{c.autor}</span>
                              <span className="text-xs text-gray-400">{new Date(c.creadoEn).toLocaleString('es-ES')}</span>
                            </div>
                            <p className="text-gray-700">{c.texto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedTicket.valoracionFecha && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                      <p className="text-sm font-semibold text-amber-800 mb-3">Valoración del vecino</p>
                      <div className="space-y-2">
                        {[['Calidad reparación', selectedTicket.valoracionReparacion], ['Rapidez', selectedTicket.valoracionRapidez], ['Comunicación', selectedTicket.valoracionComunicacion]].map(([label, value]) => value != null && (
                          <div key={String(label)} className="flex items-center justify-between">
                            <span className="text-sm text-amber-700">{label}</span>
                            <StarRow value={value as number} />
                          </div>
                        ))}
                        {selectedTicket.valoracionComentario && <p className="text-sm text-amber-700 pt-2 border-t border-amber-200">&ldquo;{selectedTicket.valoracionComentario}&rdquo;</p>}
                      </div>
                    </div>
                  )}
                </>
              )}
              {tabDetalle === 'comunicaciones' && (
                <div>
                  {!detalleCompleto ? (
                    <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-[#D4A017] border-t-transparent rounded-full animate-spin" /></div>
                  ) : !detalleCompleto.comunicaciones?.length ? (
                    <p className="text-gray-400 text-sm text-center py-10">Sin comunicaciones registradas</p>
                  ) : (
                    <div className="space-y-2">
                      {detalleCompleto.comunicaciones.map((c) => (
                        <div key={c.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm border border-slate-100">
                          <span className="text-base">{c.tipo === 'Email' ? '✉️' : '💬'}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-medium text-gray-700 truncate">{c.destinatario}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${c.estado === 'Enviado' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{c.estado}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{c.asunto}</p>
                            <p className="text-xs text-gray-400">{new Date(c.creadoEn).toLocaleString('es-ES')}</p>
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
    </div>
  )
}
