'use client'

import { useState, useEffect, useCallback } from 'react'

type Comentario = { id: string; texto: string; autor: string; rol: string; creadoEn: string }
type Afectado = { id: string; nombre: string; email: string }
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
  calle?: string | null
  bloque?: string | null
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

function calcularDias(inicio: string, fin?: string | null): number {
  const start = new Date(inicio).getTime()
  const end = fin ? new Date(fin).getTime() : Date.now()
  return Math.round((end - start) / (1000 * 60 * 60 * 24))
}

function StarsDisplay({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' }) {
  const cls = size === 'md' ? 'w-5 h-5' : 'w-4 h-4'
  return (
    <span className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <svg key={s} className={cls} fill={value >= s ? '#f59e0b' : '#e5e7eb'} viewBox="0 0 24 24">
          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </span>
  )
}

function StarsMedia({ value }: { value: number }) {
  const filled = Math.round(value)
  return (
    <div className="flex items-center gap-2">
      <StarsDisplay value={filled} size="md" />
      <span className="font-bold text-gray-800">{value.toFixed(1)}</span>
      <span className="text-xs text-gray-400">/ 5</span>
    </div>
  )
}

const ESTADO_COLORS: Record<string, string> = {
  Abierto: 'bg-[#FBF3DA] text-[#8B6914]',
  'En progreso': 'bg-[#FBF3DA] text-[#8B6914]',
  Cerrado: 'bg-green-100 text-green-700',
}
const PRIORIDAD_COLORS: Record<string, string> = {
  Urgente: 'bg-red-100 text-red-700',
  Alta: 'bg-orange-100 text-orange-700',
  Normal: 'bg-[#FBF3DA] text-[#8B6914]',
  Baja: 'bg-gray-100 text-gray-600',
}

export default function PresidentePage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [cargando, setCargando] = useState(true)
  const [ticketDetalle, setTicketDetalle] = useState<Ticket | null>(null)
  const [detalleCompleto, setDetalleCompleto] = useState<Ticket | null>(null)
  const [tabDetalle, setTabDetalle] = useState<'info' | 'comunicaciones'>('info')
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  // Config section
  const [vistaActual, setVistaActual] = useState<'dashboard' | 'config'>('dashboard')
  const [configTab, setConfigTab] = useState<'general' | 'usuarios' | 'vecinos' | 'logs'>('general')
  const [configVals, setConfigVals] = useState<Record<string, string>>({
    nombreComunidad: 'Parcela 8', emailAdmin: '', whatsapp: '', emailPresidente: '',
  })
  const [savingConfig, setSavingConfig] = useState(false)
  const [configMsg, setConfigMsg] = useState('')
  const [usuariosAdmin, setUsuariosAdmin] = useState<{ id: string; nombre: string; email: string; rol: string; activo: boolean }[]>([])
  const [changePassId, setChangePassId] = useState<string | null>(null)
  const [newPass, setNewPass] = useState('')
  const [savingPass, setSavingPass] = useState(false)
  const [passMsg, setPassMsg] = useState('')
  const [vecinosData, setVecinosData] = useState<{ nombre: string; email: string; telefono?: string | null; count: number }[]>([])
  const [logsData, setLogsData] = useState<{ id: string; usuario: string; accion: string; detalle?: string; creadoEn: string }[]>([])
  const [anonEmail, setAnonEmail] = useState('')
  const [anonMsg, setAnonMsg] = useState('')
  const [cargandoConfig, setCargandoConfig] = useState(false)

  useEffect(() => {
    setCargando(true)
    const params = new URLSearchParams()
    if (filtroDesde) params.set('desde', filtroDesde)
    if (filtroHasta) params.set('hasta', filtroHasta)
    fetch(`/api/tickets?${params}`)
      .then((r) => r.json())
      .then((data) => { setTickets(Array.isArray(data) ? data : data.tickets ?? []); setCargando(false) })
      .catch(() => setCargando(false))
  }, [filtroDesde, filtroHasta])

  function abrirDetalle(ticket: Ticket) {
    setTicketDetalle(ticket)
    setTabDetalle('info')
    setDetalleCompleto(null)
    fetch(`/api/tickets/${ticket.id}`)
      .then((r) => r.json())
      .then(setDetalleCompleto)
      .catch(console.error)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const total = tickets.length
  const abiertos = tickets.filter((t) => t.estado === 'Abierto').length
  const enProgreso = tickets.filter((t) => t.estado === 'En progreso').length
  const cerrados = tickets.filter((t) => t.estado === 'Cerrado').length
  const urgentes = tickets.filter((t) => t.prioridad === 'Urgente' && t.estado !== 'Cerrado').length

  const ticketsCerrados = tickets.filter((t) => t.estado === 'Cerrado' && t.cerradoEn)
  const tiempoMedio = ticketsCerrados.length > 0
    ? Math.round(ticketsCerrados.reduce((acc, t) => acc + calcularDias(t.creadoEn, t.cerradoEn), 0) / ticketsCerrados.length)
    : null

  const totalComunicaciones = tickets.reduce((acc, t) => acc + (t._count?.comunicaciones || 0), 0)

  const ticketsValorados = tickets.filter(
    (t) => t.valoracionFecha && t.valoracionReparacion && t.valoracionRapidez && t.valoracionComunicacion
  )
  const mediaReparacion = ticketsValorados.length > 0
    ? ticketsValorados.reduce((acc, t) => acc + (t.valoracionReparacion || 0), 0) / ticketsValorados.length
    : null
  const mediaRapidez = ticketsValorados.length > 0
    ? ticketsValorados.reduce((acc, t) => acc + (t.valoracionRapidez || 0), 0) / ticketsValorados.length
    : null
  const mediaComunicacion = ticketsValorados.length > 0
    ? ticketsValorados.reduce((acc, t) => acc + (t.valoracionComunicacion || 0), 0) / ticketsValorados.length
    : null
  const mediaGlobal = mediaReparacion && mediaRapidez && mediaComunicacion
    ? (mediaReparacion + mediaRapidez + mediaComunicacion) / 3
    : null

  const porCategoria: Record<string, number> = {}
  tickets.forEach((t) => { porCategoria[t.categoria] = (porCategoria[t.categoria] || 0) + 1 })
  const maxCategoria = Math.max(...Object.values(porCategoria), 1)

  const porMes: Record<string, number> = {}
  tickets.forEach((t) => {
    const fecha = new Date(t.creadoEn)
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
    porMes[key] = (porMes[key] || 0) + 1
  })
  const mesesOrdenados = Object.keys(porMes).sort().slice(-6)
  const maxMes = Math.max(...mesesOrdenados.map((m) => porMes[m]), 1)

  const porZona: Record<string, number> = {}
  tickets.forEach((t) => { porZona[t.zona] = (porZona[t.zona] || 0) + 1 })
  const zonasOrdenadas = Object.entries(porZona).sort((a, b) => b[1] - a[1]).slice(0, 5)

  const formatMes = (key: string) => {
    const [year, month] = key.split('-')
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    return `${meses[parseInt(month) - 1]} ${year.slice(2)}`
  }

  const cargarConfigData = useCallback(async () => {
    setCargandoConfig(true)
    try {
      const [cfgRes, usrRes, vecRes, logRes] = await Promise.all([
        fetch('/api/admin/config'),
        fetch('/api/admin/usuarios'),
        fetch('/api/admin/vecinos'),
        fetch('/api/admin/logs'),
      ])
      const cfg = await cfgRes.json()
      const usr = await usrRes.json()
      const vec = await vecRes.json()
      const log = await logRes.json()
      if (Array.isArray(cfg)) {
        const vals: Record<string, string> = {}
        cfg.forEach((c: { clave: string; valor: string }) => { vals[c.clave] = c.valor })
        setConfigVals(prev => ({ ...prev, ...vals }))
      }
      if (Array.isArray(usr)) setUsuariosAdmin(usr)
      if (Array.isArray(vec)) setVecinosData(vec)
      if (Array.isArray(log)) setLogsData(log)
    } catch (e) { console.error(e) }
    finally { setCargandoConfig(false) }
  }, [])

  async function guardarConfig() {
    setSavingConfig(true); setConfigMsg('')
    try {
      const values = Object.entries(configVals).map(([clave, valor]) => ({ clave, valor }))
      const res = await fetch('/api/admin/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values }),
      })
      if (!res.ok) throw new Error('Error')
      setConfigMsg('Configuración guardada correctamente')
    } catch { setConfigMsg('Error al guardar la configuración') }
    finally { setSavingConfig(false) }
  }

  async function cambiarPassword() {
    if (!changePassId || newPass.length < 6) { setPassMsg('Mínimo 6 caracteres'); return }
    setSavingPass(true); setPassMsg('')
    try {
      const res = await fetch(`/api/admin/usuarios/${changePassId}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPass }),
      })
      if (!res.ok) throw new Error('Error')
      setChangePassId(null); setNewPass('')
      await cargarConfigData()
    } catch { setPassMsg('Error al cambiar contraseña') }
    finally { setSavingPass(false) }
  }

  async function toggleUsuario(id: string) {
    try {
      await fetch(`/api/admin/usuarios/${id}/toggle`, { method: 'POST' })
      await cargarConfigData()
    } catch (e) { console.error(e) }
  }

  async function anonimizarVecino() {
    if (!anonEmail) return
    if (!confirm(`¿Anonimizar todos los datos del vecino "${anonEmail}"? Esta acción es irreversible.`)) return
    setAnonMsg('')
    try {
      const res = await fetch('/api/admin/rgpd/anonimizar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: anonEmail }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error')
      setAnonMsg(`Vecino anonimizado correctamente`); setAnonEmail('')
      await cargarConfigData()
    } catch (err: unknown) { setAnonMsg(err instanceof Error ? err.message : 'Error') }
  }

  async function exportarPDF() {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')
    const doc = new jsPDF()

    const periodo = filtroDesde || filtroHasta
      ? `Período: ${filtroDesde || 'inicio'} → ${filtroHasta || 'hoy'}`
      : `Todos los períodos`

    doc.setFontSize(20)
    doc.setTextColor(201, 162, 39)
    doc.text('Comunidad Parcela 8', 14, 18)
    doc.setFontSize(13)
    doc.setTextColor(60, 60, 60)
    doc.text('Informe del Presidente', 14, 26)
    doc.setFontSize(9)
    doc.setTextColor(120, 120, 120)
    doc.text(`${periodo} · Generado: ${new Date().toLocaleDateString('es-ES')}`, 14, 33)

    autoTable(doc, {
      startY: 40,
      head: [['KPI', 'Valor']],
      body: [
        ['Total tickets', total],
        ['Tickets abiertos', abiertos],
        ['En progreso', enProgreso],
        ['Cerrados / resueltos', cerrados],
        ['Urgentes pendientes', urgentes],
        ['Tiempo medio resolución', tiempoMedio !== null ? `${tiempoMedio} días` : 'Sin datos'],
        ['Valoración media global', mediaGlobal !== null ? `${mediaGlobal.toFixed(1)} / 5` : 'Sin datos'],
        ['Tickets valorados', ticketsValorados.length],
        ['Tasa de resolución', total > 0 ? `${Math.round((cerrados / total) * 100)}%` : '0%'],
      ],
      headStyles: { fillColor: [201, 162, 39], textColor: 255 },
      alternateRowStyles: { fillColor: [251, 243, 218] },
      styles: { fontSize: 10 },
      columnStyles: { 0: { fontStyle: 'bold' } },
    })

    const nextY = (doc as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 100

    doc.setFontSize(11)
    doc.setTextColor(60, 60, 60)
    doc.text('Incidencias por categoría', 14, nextY + 12)

    autoTable(doc, {
      startY: nextY + 18,
      head: [['Categoría', 'Tickets', '% del total']],
      body: Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, count]) => [
        cat, count, `${Math.round((count / total) * 100)}%`
      ]),
      headStyles: { fillColor: [201, 162, 39], textColor: 255 },
      alternateRowStyles: { fillColor: [251, 243, 218] },
      styles: { fontSize: 9 },
    })

    doc.save(`informe-presidente-${new Date().toISOString().slice(0, 10)}.pdf`)
  }

  const comentariosVecinos = ticketsValorados
    .filter((t) => t.valoracionComentario)
    .sort((a, b) => new Date(b.valoracionFecha!).getTime() - new Date(a.valoracionFecha!).getTime())
    .slice(0, 10)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Dashboard Presidente</h1>
            <p className="text-gray-500 mt-1 text-sm">Comunidad Parcela 8 — Estadísticas de incidencias</p>
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
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
            {(filtroDesde || filtroHasta) && (
              <button onClick={() => { setFiltroDesde(''); setFiltroHasta('') }}
                className="text-xs text-gray-500 hover:text-gray-800 underline whitespace-nowrap">
                Limpiar
              </button>
            )}
            <button onClick={exportarPDF} disabled={tickets.length === 0}
              className="flex items-center gap-1.5 text-sm bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Exportar PDF
            </button>
            <button onClick={() => { setVistaActual('config'); setConfigTab('general'); cargarConfigData() }}
              className="flex items-center gap-1.5 text-sm bg-slate-700 text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Configuración
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total tickets', value: total, sub: 'registrados', color: 'bg-[#C9A227]', text: 'text-white' },
            { label: 'Abiertos', value: abiertos, sub: 'sin resolver', color: 'bg-[#FBF3DA]', text: 'text-[#7D5A00]' },
            { label: 'En progreso', value: enProgreso, sub: 'en gestión', color: 'bg-blue-100', text: 'text-blue-800' },
            { label: 'Cerrados', value: cerrados, sub: 'resueltos', color: 'bg-green-100', text: 'text-green-800' },
            { label: 'Urgentes', value: urgentes, sub: 'pendientes', color: urgentes > 0 ? 'bg-red-500' : 'bg-stone-100', text: urgentes > 0 ? 'text-white' : 'text-stone-500' },
          ].map((s) => (
            <div key={s.label} className={`rounded-2xl p-4 sm:p-5 ${s.color} ${s.text}`}>
              <p className="text-3xl sm:text-4xl font-bold">{s.value}</p>
              <p className="font-semibold mt-1 text-sm sm:text-base">{s.label}</p>
              <p className="text-xs sm:text-sm opacity-80">{s.sub}</p>
            </div>
          ))}
        </div>

        {/* Tiempo medio + valoración global + comunicaciones */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {tiempoMedio !== null && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{tiempoMedio} días</p>
                <p className="text-xs sm:text-sm text-gray-500">Tiempo medio de resolución ({ticketsCerrados.length} tickets)</p>
              </div>
            </div>
          )}
          {mediaGlobal !== null && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{mediaGlobal.toFixed(1)}<span className="text-base text-gray-400">/5</span></p>
                <p className="text-xs sm:text-sm text-gray-500">Valoración media ({ticketsValorados.length} valorados)</p>
              </div>
            </div>
          )}
          {totalComunicaciones > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 flex items-center gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">{totalComunicaciones}</p>
                <p className="text-xs sm:text-sm text-gray-500">Comunicaciones enviadas</p>
              </div>
            </div>
          )}
        </div>

        {/* Valoraciones medias */}
        {ticketsValorados.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Valoraciones medias de vecinos</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              {[
                { label: 'Calidad de reparación', value: mediaReparacion },
                { label: 'Rapidez de respuesta', value: mediaRapidez },
                { label: 'Comunicación', value: mediaComunicacion },
              ].map(({ label, value }) => value !== null && (
                <div key={label} className="text-center">
                  <p className="text-sm font-medium text-gray-600 mb-2">{label}</p>
                  <div className="flex justify-center mb-1">
                    <StarsMedia value={value} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Incidencias por categoría</h2>
            {Object.keys(porCategoria).length === 0 ? (
              <p className="text-gray-400 text-sm">Sin datos</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(porCategoria).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
                  <div key={cat}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{cat}</span>
                      <span className="text-gray-500">{count}</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div className="bg-[#C9A227] h-2 rounded-full transition-all" style={{ width: `${(count / maxCategoria) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Incidencias últimos 6 meses</h2>
            {mesesOrdenados.length === 0 ? (
              <p className="text-gray-400 text-sm">Sin datos</p>
            ) : (
              <div className="flex items-end gap-1 sm:gap-2 h-28 sm:h-32">
                {mesesOrdenados.map((mes) => (
                  <div key={mes} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-xs text-gray-500 font-medium">{porMes[mes]}</span>
                    <div className="w-full bg-[#C9A227] rounded-t-md min-h-[4px]" style={{ height: `${Math.max((porMes[mes] / maxMes) * 100, 4)}px` }} />
                    <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">{formatMes(mes)}</span>
                    <span className="text-xs text-gray-400 sm:hidden">{formatMes(mes).slice(0, 3)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Zonas + Estado sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Top zonas con incidencias</h2>
            {zonasOrdenadas.length === 0 ? <p className="text-gray-400 text-sm">Sin datos</p> : (
              <div className="space-y-2">
                {zonasOrdenadas.map(([zona, count], i) => (
                  <div key={zona} className="flex items-center gap-3">
                    <span className="w-6 text-sm font-bold text-gray-400">{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-gray-700">{zona}</span>
                    <span className="text-sm font-bold text-gray-900">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Estado del sistema</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tasa de resolución</span>
                <span className="font-bold text-gray-900">{total > 0 ? Math.round((cerrados / total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3">
                <div className="bg-green-500 h-3 rounded-full" style={{ width: `${total > 0 ? (cerrados / total) * 100 : 0}%` }} />
              </div>
              <div className="pt-2 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Tickets con afectados</span><span className="font-medium">{tickets.filter((t) => t.afectados.length > 0).length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total vecinos afectados</span><span className="font-medium">{tickets.reduce((acc, t) => acc + t.afectados.length, 0) + tickets.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Comunicaciones enviadas</span><span className="font-medium text-green-600">{totalComunicaciones}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tickets valorados</span><span className="font-medium text-amber-600">{ticketsValorados.length}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tickets urgentes pendientes</span><span className={`font-medium ${urgentes > 0 ? 'text-red-600' : 'text-green-600'}`}>{urgentes}</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Comentarios de vecinos */}
        {comentariosVecinos.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6">
            <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Comentarios de vecinos</h2>
            <div className="space-y-3">
              {comentariosVecinos.map((t) => (
                <div key={t.id} className="bg-amber-50 border border-amber-100 rounded-xl p-3 sm:p-4 cursor-pointer hover:border-amber-300 transition-colors"
                  onClick={() => abrirDetalle(t)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800">&ldquo;{t.valoracionComentario}&rdquo;</p>
                      <p className="text-xs text-gray-500 mt-1">Ticket #{t.numero} — {t.titulo}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <StarsDisplay value={Math.round(((t.valoracionReparacion || 0) + (t.valoracionRapidez || 0) + (t.valoracionComunicacion || 0)) / 3)} />
                      <p className="text-xs text-gray-400 mt-1">{new Date(t.valoracionFecha!).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Listado completo de tickets */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 mb-6">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Todos los tickets ({total})</h2>
          {tickets.length === 0 ? <p className="text-gray-400 text-sm">Sin tickets</p> : (
            <div className="space-y-1 sm:space-y-2">
              {tickets.map((t) => (
                <div key={t.id} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-slate-50 cursor-pointer transition-colors"
                  onClick={() => abrirDetalle(t)}>
                  <span className="text-xs font-mono text-gray-400 w-7 sm:w-8 flex-shrink-0">#{t.numero}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${ESTADO_COLORS[t.estado] || ''}`}>{t.estado}</span>
                  <span className="text-sm font-medium text-gray-800 flex-1 truncate">{t.titulo}</span>
                  <span className="text-xs text-gray-400 hidden sm:block">{t.zona}</span>
                  {t.valoracionFecha && <StarsDisplay value={Math.round(((t.valoracionReparacion || 0) + (t.valoracionRapidez || 0) + (t.valoracionComunicacion || 0)) / 3)} />}
                  <span className="text-xs text-gray-400 flex-shrink-0">{calcularDias(t.creadoEn, t.cerradoEn)}d</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Urgentes */}
        {tickets.filter((t) => t.estado !== 'Cerrado' && t.prioridad === 'Urgente').length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5">
            <h2 className="text-sm sm:text-base font-semibold text-red-800 mb-3">
              Tickets urgentes pendientes ({tickets.filter((t) => t.estado !== 'Cerrado' && t.prioridad === 'Urgente').length})
            </h2>
            <div className="space-y-2">
              {tickets.filter((t) => t.estado !== 'Cerrado' && t.prioridad === 'Urgente').map((t) => (
                <div key={t.id} className="flex items-center gap-2 sm:gap-3 text-sm cursor-pointer hover:bg-red-100 rounded-lg p-2 transition-colors"
                  onClick={() => abrirDetalle(t)}>
                  <span className="font-mono text-red-400 flex-shrink-0">#{t.numero}</span>
                  <span className="font-medium text-red-900 flex-1 truncate">{t.titulo}</span>
                  <span className="text-red-400 flex-shrink-0 text-xs">{calcularDias(t.creadoEn)}d</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8 py-4 border-t border-slate-200 text-center">
        <p className="text-xs text-gray-400">
          Datos protegidos según RGPD · Comunidad Parcela 8 ·{' '}
          <a href="/privacidad" className="hover:underline">Política de privacidad</a>
        </p>
      </div>

      {/* ---- CONFIGURACIÓN OVERLAY ---- */}
      {vistaActual === 'config' && (
        <div className="fixed inset-0 bg-slate-50 overflow-y-auto z-40">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-4 mb-6">
              <button onClick={() => setVistaActual('dashboard')}
                className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al dashboard
              </button>
              <h1 className="text-xl font-bold text-gray-900">Configuración</h1>
            </div>

            {/* Sub-tabs */}
            <div className="flex gap-1 mb-6 bg-white border border-slate-200 rounded-xl p-1">
              {([['general', 'General'], ['usuarios', 'Usuarios'], ['vecinos', 'Vecinos / RGPD'], ['logs', 'Actividad']] as const).map(([tab, label]) => (
                <button key={tab} onClick={() => setConfigTab(tab)}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-lg transition-colors ${configTab === tab ? 'bg-slate-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
                  {label}
                </button>
              ))}
            </div>

            {cargandoConfig && (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {!cargandoConfig && configTab === 'general' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Datos de la comunidad</h2>
                <div className="space-y-4">
                  {[
                    { clave: 'nombreComunidad', label: 'Nombre de la comunidad' },
                    { clave: 'emailAdmin', label: 'Email del administrador de fincas' },
                    { clave: 'whatsapp', label: 'Teléfono WhatsApp (con prefijo, ej: 34680207244)' },
                    { clave: 'emailPresidente', label: 'Email del presidente' },
                  ].map(({ clave, label }) => (
                    <div key={clave}>
                      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                      <input
                        type="text"
                        value={configVals[clave] || ''}
                        onChange={(e) => setConfigVals(prev => ({ ...prev, [clave]: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]"
                      />
                    </div>
                  ))}
                </div>
                {configMsg && (
                  <div className={`mt-4 p-3 rounded-lg text-sm ${configMsg.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                    {configMsg}
                  </div>
                )}
                <button onClick={guardarConfig} disabled={savingConfig}
                  className="mt-6 bg-[#C9A227] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50">
                  {savingConfig ? 'Guardando...' : 'Guardar configuración'}
                </button>
              </div>
            )}

            {!cargandoConfig && configTab === 'usuarios' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Usuarios del sistema ({usuariosAdmin.length})</h2>
                  <div className="space-y-3">
                    {usuariosAdmin.map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{u.nombre}</p>
                          <p className="text-xs text-gray-500">{u.email} · <span className="capitalize">{u.rol}</span></p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {u.activo ? 'Activo' : 'Inactivo'}
                          </span>
                          <button onClick={() => toggleUsuario(u.id)}
                            className="text-xs border border-gray-300 text-gray-700 px-2 py-1 rounded-lg hover:bg-gray-50 transition-colors">
                            {u.activo ? 'Desactivar' : 'Activar'}
                          </button>
                          <button onClick={() => { setChangePassId(u.id); setNewPass(''); setPassMsg('') }}
                            className="text-xs bg-slate-700 text-white px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors">
                            Contraseña
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {changePassId && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6">
                    <h3 className="font-semibold text-gray-900 mb-3">
                      Cambiar contraseña — {usuariosAdmin.find(u => u.id === changePassId)?.nombre}
                    </h3>
                    <div className="flex gap-3">
                      <input type="password" value={newPass} onChange={(e) => setNewPass(e.target.value)}
                        placeholder="Nueva contraseña (mín. 6 caracteres)"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A227]" />
                      <button onClick={cambiarPassword} disabled={savingPass}
                        className="bg-[#C9A227] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#A07D1A] transition-colors disabled:opacity-50 text-sm">
                        {savingPass ? 'Guardando...' : 'Guardar'}
                      </button>
                      <button onClick={() => { setChangePassId(null); setNewPass(''); setPassMsg('') }}
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm">
                        Cancelar
                      </button>
                    </div>
                    {passMsg && <p className="mt-2 text-sm text-red-600">{passMsg}</p>}
                  </div>
                )}
              </div>
            )}

            {!cargandoConfig && configTab === 'vecinos' && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                  <h2 className="font-semibold text-gray-900 mb-4">Vecinos registrados ({vecinosData.length})</h2>
                  <div className="space-y-2">
                    {vecinosData.map((v) => (
                      <div key={v.email} className="flex items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{v.nombre}</p>
                          <p className="text-xs text-gray-500">{v.email}{v.telefono ? ` · ${v.telefono}` : ''}</p>
                        </div>
                        <span className="text-xs bg-[#FBF3DA] text-[#8B6914] px-2 py-0.5 rounded-full font-medium flex-shrink-0">
                          {v.count} incidencia{v.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                    {vecinosData.length === 0 && <p className="text-gray-400 text-sm">Sin vecinos registrados</p>}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-red-200 p-6">
                  <h2 className="font-semibold text-red-800 mb-1">Derecho al olvido (RGPD Art. 17)</h2>
                  <p className="text-sm text-gray-500 mb-4">
                    Anonimiza todos los datos personales de un vecino (nombre, email, teléfono) manteniendo el historial de incidencias.
                    Esta acción es <strong>irreversible</strong>.
                  </p>
                  <div className="flex gap-3">
                    <input type="email" value={anonEmail} onChange={(e) => setAnonEmail(e.target.value)}
                      placeholder="email@del.vecino.com"
                      className="flex-1 border border-red-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    <button onClick={anonimizarVecino} disabled={!anonEmail}
                      className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-40 text-sm whitespace-nowrap">
                      Anonimizar
                    </button>
                  </div>
                  {anonMsg && (
                    <div className={`mt-3 p-3 rounded-lg text-sm ${anonMsg.includes('Error') || anonMsg.includes('error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                      {anonMsg}
                    </div>
                  )}
                </div>
              </div>
            )}

            {!cargandoConfig && configTab === 'logs' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6">
                <h2 className="font-semibold text-gray-900 mb-4">Registro de actividad ({logsData.length})</h2>
                {logsData.length === 0 ? (
                  <p className="text-gray-400 text-sm">Sin registros de actividad</p>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                    {logsData.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl text-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-gray-800">{log.usuario}</span>
                            <span className="text-xs bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono">{log.accion}</span>
                          </div>
                          {log.detalle && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.detalle}</p>}
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">{new Date(log.creadoEn).toLocaleString('es-ES')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

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
              <button onClick={() => { setTicketDetalle(null); setDetalleCompleto(null) }}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 mt-1 p-1">
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
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${ESTADO_COLORS[ticketDetalle.estado] || ''}`}>{ticketDetalle.estado}</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${PRIORIDAD_COLORS[ticketDetalle.prioridad] || ''}`}>{ticketDetalle.prioridad}</span>
                    <span className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">{ticketDetalle.categoria}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                    <div><span className="text-gray-500">Vecino:</span> <span className="font-medium">{ticketDetalle.vecino}</span></div>
                    <div><span className="text-gray-500">Email:</span> <span className="font-medium break-all">{ticketDetalle.emailVecino}</span></div>
                    <div><span className="text-gray-500">Teléfono:</span> <span className="font-medium">{ticketDetalle.telefonoVecino || '—'}</span></div>
                    <div><span className="text-gray-500">Zona:</span> <span className="font-medium">{ticketDetalle.zona}</span></div>
                    {(ticketDetalle.calle || ticketDetalle.bloque || ticketDetalle.piso) && (
                      <div><span className="text-gray-500">Ubicación:</span> <span className="font-medium">{[ticketDetalle.calle, ticketDetalle.bloque, ticketDetalle.piso].filter(Boolean).join(' · ')}</span></div>
                    )}
                    <div><span className="text-gray-500">Creado:</span> <span className="font-medium">{new Date(ticketDetalle.creadoEn).toLocaleString('es-ES')}</span></div>
                    {ticketDetalle.cerradoEn && <div><span className="text-gray-500">Cerrado:</span> <span className="font-medium">{new Date(ticketDetalle.cerradoEn).toLocaleString('es-ES')}</span></div>}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Descripción</p>
                    <p className="text-sm text-gray-600 bg-slate-50 p-3 rounded-lg">{ticketDetalle.descripcion}</p>
                  </div>
                  {ticketDetalle.foto && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Foto</p>
                      <img src={ticketDetalle.foto} alt="Foto" className="max-h-48 sm:max-h-56 rounded-xl border w-auto" />
                    </div>
                  )}
                  {ticketDetalle.afectados.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Vecinos afectados ({ticketDetalle.afectados.length})</p>
                      <div className="space-y-1">
                        {ticketDetalle.afectados.map((a) => (
                          <div key={a.id} className="text-sm bg-purple-50 text-purple-800 px-3 py-1.5 rounded-lg break-all">{a.nombre} · {a.email}</div>
                        ))}
                      </div>
                    </div>
                  )}
                  {ticketDetalle.comentarios.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Historial de cambios y comentarios</p>
                      <div className="space-y-2 max-h-48 sm:max-h-64 overflow-y-auto">
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
                          <p className="text-sm text-amber-700 mt-2 pt-2 border-t border-amber-200">&ldquo;{ticketDetalle.valoracionComentario}&rdquo;</p>
                        )}
                        <p className="text-xs text-amber-500">{new Date(ticketDetalle.valoracionFecha).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {tabDetalle === 'comunicaciones' && (
                <div>
                  {!detalleCompleto ? (
                    <div className="flex justify-center py-10">
                      <div className="w-6 h-6 border-2 border-[#C9A227] border-t-transparent rounded-full animate-spin" />
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
    </div>
  )
}
