import nodemailer from 'nodemailer'
import { prisma } from './prisma'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
})

// ── helpers ────────────────────────────────────────────────────────────────

async function saveCom(ticketId: string, data: {
  tipo: string
  destinatario: string
  asunto: string
  mensaje: string
  estado: string
}) {
  try {
    await prisma.comunicacion.create({ data: { ...data, ticketId } })
  } catch (e) {
    console.error('Error guardando comunicacion:', e)
  }
}

function waLink(telefono: string | null | undefined, mensaje: string): string | null {
  const tel = telefono?.replace(/\D/g, '')
  if (!tel) return null
  return `https://wa.me/${tel}?text=${encodeURIComponent(mensaje)}`
}

async function enviarEmail(
  ticketId: string,
  opts: { to: string; subject: string; html: string; destinatarioNombre?: string }
) {
  const destinatario = opts.destinatarioNombre ? `${opts.destinatarioNombre} <${opts.to}>` : opts.to
  try {
    await transporter.sendMail({
      from: `"Comunidad Vecinos" <${process.env.GMAIL_USER}>`,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    })
    await saveCom(ticketId, {
      tipo: 'Email',
      destinatario,
      asunto: opts.subject,
      mensaje: 'Email enviado correctamente',
      estado: 'Enviado',
    })
  } catch (e) {
    console.error(`Error enviando email a ${opts.to}:`, e)
    await saveCom(ticketId, {
      tipo: 'Email',
      destinatario,
      asunto: opts.subject,
      mensaje: `Error: ${e instanceof Error ? e.message : 'desconocido'}`,
      estado: 'Error',
    })
  }
}

async function registrarWA(
  ticketId: string,
  nombre: string,
  telefono: string | null | undefined,
  asunto: string,
  mensajeWA: string
) {
  const link = waLink(telefono, mensajeWA)
  if (!link) return
  const tel = telefono!.replace(/\D/g, '')
  await saveCom(ticketId, {
    tipo: 'WhatsApp',
    destinatario: `${nombre} (+${tel})`,
    asunto,
    mensaje: link,
    estado: 'Generado',
  })
}

// ── tipos ──────────────────────────────────────────────────────────────────

type PersonaContact = { nombre: string; email: string; telefono?: string | null }

type TicketBasico = {
  id: string
  numero: number
  titulo: string
  descripcion: string
  categoria: string
  prioridad: string
  estado: string
  zona: string
  piso?: string | null
  vecino: string
  emailVecino: string
  telefonoVecino?: string | null
}

type TicketProgreso = {
  id: string
  numero: number
  titulo: string
  emailVecino: string
  vecino: string
  telefonoVecino?: string | null
  comentario: string
  zona: string
  categoria: string
  afectados?: PersonaContact[]
}

type TicketCierre = {
  id: string
  numero: number
  titulo: string
  emailVecino: string
  vecino: string
  telefonoVecino?: string | null
  cerradoPor?: string | null
  comentarioCierre?: string
  fotoUrl?: string | null
  afectados?: Array<{ nombre: string; email: string; telefono?: string | null }>
  ticketsHijosVecinos?: Array<{ nombre: string; email: string; telefono?: string | null }>
}

// ── sendTicketEmail ────────────────────────────────────────────────────────

export async function sendTicketEmail(ticket: TicketBasico) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const waComun = process.env.WHATSAPP_TELEFONO || ''
  const adminEmail = process.env.ADMIN_EMAIL || ''
  const presidenteEmail = process.env.PRESIDENTE_EMAIL || ''

  const waComunLink = `https://wa.me/${waComun}?text=${encodeURIComponent(`Ticket #${ticket.numero}: ${ticket.titulo}`)}`
  const adminLink = `${appUrl}/admin`

  const infoRows = `
    <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Nº Ticket</td><td style="padding:8px 12px;background:#f8fafc">#${ticket.numero}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600">Título</td><td style="padding:8px 12px">${ticket.titulo}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Descripción</td><td style="padding:8px 12px;background:#f8fafc">${ticket.descripcion}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600">Categoría</td><td style="padding:8px 12px">${ticket.categoria}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Prioridad</td><td style="padding:8px 12px;background:#f8fafc">${ticket.prioridad}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600">Zona</td><td style="padding:8px 12px">${ticket.zona}${ticket.piso ? ` — Piso ${ticket.piso}` : ''}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Estado</td><td style="padding:8px 12px;background:#f8fafc">${ticket.estado}</td></tr>
    </table>`

  // Email → vecino
  await enviarEmail(ticket.id, {
    to: ticket.emailVecino,
    destinatarioNombre: ticket.vecino,
    subject: `Ticket #${ticket.numero} registrado — ${ticket.titulo}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#1d4ed8">Su incidencia ha sido registrada</h2>
      ${infoRows}
      <br>
      <p style="color:#6b7280;font-size:14px">Consulte el estado en: <a href="${appUrl}" style="color:#2563eb">${appUrl}</a></p>
      <p><a href="${waComunLink}" style="color:#16a34a;font-size:14px">Contactar a la administración por WhatsApp</a></p>
    </div>`,
  })

  // WA admin → vecino
  await registrarWA(
    ticket.id,
    ticket.vecino,
    ticket.telefonoVecino,
    `WhatsApp disponible — ${ticket.vecino}`,
    `Hola ${ticket.vecino}, le contactamos respecto a su incidencia #${ticket.numero} - ${ticket.titulo}`
  )

  // Email → admin
  const vecinoTel = ticket.telefonoVecino?.replace(/\D/g, '')
  const waVecino = vecinoTel
    ? `<a href="https://wa.me/${vecinoTel}?text=${encodeURIComponent(`Hola ${ticket.vecino}, le contactamos respecto a su incidencia #${ticket.numero} - ${ticket.titulo}`)}" style="color:#16a34a;font-family:sans-serif">WhatsApp vecino</a>`
    : `<span style="color:#9ca3af;font-size:13px">Sin teléfono</span>`

  await enviarEmail(ticket.id, {
    to: adminEmail,
    subject: `[NUEVO] Ticket #${ticket.numero} — ${ticket.titulo}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#1d4ed8">Nuevo ticket de incidencia</h2>
      <p><strong>Vecino:</strong> ${ticket.vecino} &lt;${ticket.emailVecino}&gt;</p>
      <p><strong>Teléfono:</strong> ${ticket.telefonoVecino || 'No facilitado'}</p>
      ${infoRows}
      <br>
      <a href="${adminLink}" style="background:#2563eb;color:white;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-family:sans-serif">Gestionar ticket</a>
      &nbsp;&nbsp;${waVecino}
    </div>`,
  })

  // Email → presidente (solo si distinto al admin)
  if (presidenteEmail && presidenteEmail !== adminEmail) {
    await enviarEmail(ticket.id, {
      to: presidenteEmail,
      subject: `[INFO] Ticket #${ticket.numero} — ${ticket.titulo}`,
      html: `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#1d4ed8">Nuevo ticket en la comunidad</h2>
        <p><strong>Vecino:</strong> ${ticket.vecino}</p>
        <p><strong>Categoría:</strong> ${ticket.categoria} | <strong>Prioridad:</strong> ${ticket.prioridad}</p>
        <p><strong>Zona:</strong> ${ticket.zona}</p>
        <br>
        <a href="${appUrl}/presidente" style="color:#2563eb">Ver estadísticas</a>
      </div>`,
    })
  }
}

// ── sendProgresoEmail ──────────────────────────────────────────────────────

export async function sendProgresoEmail(ticket: TicketProgreso) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const waComun = process.env.WHATSAPP_TELEFONO || ''
  const presidenteEmail = process.env.PRESIDENTE_EMAIL || ''

  const waComunLink = `https://wa.me/${waComun}?text=${encodeURIComponent(`Ticket #${ticket.numero} en gestión`)}`

  const htmlBody = (nombre: string) => `<div style="font-family:sans-serif;max-width:600px">
    <div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin-bottom:20px;border-radius:4px">
      <h2 style="color:#92400e;margin:0 0 8px 0">Su incidencia está siendo gestionada</h2>
    </div>
    <table style="border-collapse:collapse;width:100%;font-size:14px">
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Ticket</td><td style="padding:8px 12px;background:#f8fafc">#${ticket.numero} — ${ticket.titulo}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600">Zona</td><td style="padding:8px 12px">${ticket.zona}</td></tr>
      <tr><td style="padding:8px 12px;font-weight:600;background:#f8fafc">Estado</td><td style="padding:8px 12px;background:#f8fafc"><strong style="color:#d97706">En progreso</strong></td></tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:16px;margin-top:16px">
      <p style="font-weight:600;color:#78350f;margin:0 0 6px">Nota del administrador:</p>
      <p style="color:#451a03;margin:0;font-size:14px">${ticket.comentario}</p>
    </div>
    <p style="margin-top:20px"><a href="${waComunLink}" style="color:#16a34a;font-size:14px">Contactar a la administración por WhatsApp</a></p>
  </div>`

  // Todos los destinatarios: vecino + afectados (sin duplicados)
  const destinatarios: PersonaContact[] = [
    { nombre: ticket.vecino, email: ticket.emailVecino, telefono: ticket.telefonoVecino },
    ...(ticket.afectados || []),
  ]
  const vistos = new Set<string>()
  for (const p of destinatarios) {
    if (vistos.has(p.email)) continue
    vistos.add(p.email)
    await enviarEmail(ticket.id, {
      to: p.email,
      destinatarioNombre: p.nombre,
      subject: `Ticket #${ticket.numero} en gestión — ${ticket.titulo}`,
      html: htmlBody(p.nombre),
    })
    // WhatsApp disponible para el admin (si tiene teléfono)
    await registrarWA(
      ticket.id,
      p.nombre,
      p.telefono,
      `WhatsApp disponible — ${p.nombre}`,
      `Hola ${p.nombre}, su incidencia #${ticket.numero} está siendo gestionada: ${ticket.comentario}`
    )
  }

  // Email → presidente
  await enviarEmail(ticket.id, {
    to: presidenteEmail,
    subject: `[EN GESTIÓN] Ticket #${ticket.numero} — ${ticket.titulo}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#d97706">Ticket marcado en progreso</h2>
      <p><strong>Ticket:</strong> #${ticket.numero} — ${ticket.titulo}</p>
      <p><strong>Vecino:</strong> ${ticket.vecino} | <strong>Zona:</strong> ${ticket.zona}</p>
      <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:6px;padding:12px;margin-top:12px">
        <p style="font-weight:600;margin:0 0 4px">Nota del administrador:</p>
        <p style="margin:0;font-size:14px">${ticket.comentario}</p>
      </div>
      <p style="margin-top:16px"><a href="${appUrl}/presidente" style="color:#2563eb">Ver dashboard</a></p>
    </div>`,
  })
}

// ── sendCloseEmail ─────────────────────────────────────────────────────────

export async function sendCloseEmail(ticket: TicketCierre) {
  const appUrl = process.env.APP_URL || 'http://localhost:3000'
  const waComun = process.env.WHATSAPP_TELEFONO || ''
  const adminEmail = process.env.ADMIN_EMAIL || ''
  const presidenteEmail = process.env.PRESIDENTE_EMAIL || ''

  const waComunLink = `https://wa.me/${waComun}?text=${encodeURIComponent(`Ticket #${ticket.numero} resuelto`)}`
  const valorarLink = `${appUrl}/valorar/${ticket.id}`
  const fotoHtml = ticket.fotoUrl
    ? `<p><img src="${appUrl}${ticket.fotoUrl}" alt="Foto resolución" style="max-width:400px;border-radius:8px;border:1px solid #e5e7eb"/></p>`
    : ''

  const htmlVecino = (nombre: string) => `<div style="font-family:sans-serif;max-width:600px">
    <div style="background:#dcfce7;border-left:4px solid #16a34a;padding:16px;margin-bottom:20px;border-radius:4px">
      <h2 style="color:#14532d;margin:0">Su incidencia ha sido resuelta ✓</h2>
    </div>
    <p><strong>Ticket:</strong> #${ticket.numero} — ${ticket.titulo}</p>
    <p><strong>Resuelto por:</strong> ${ticket.cerradoPor || 'Administración'}</p>
    <p><strong>Resolución:</strong> ${ticket.comentarioCierre || '—'}</p>
    ${fotoHtml}
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin-top:24px;text-align:center">
      <p style="font-weight:600;color:#0c4a6e;margin:0 0 12px">¿Quedó satisfecho con la resolución?</p>
      <a href="${valorarLink}" style="background:#2563eb;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-family:sans-serif">Valorar la reparación</a>
    </div>
    <p style="margin-top:20px"><a href="${waComunLink}" style="color:#16a34a;font-size:14px">Contactar a la administración por WhatsApp</a></p>
  </div>`

  // Todos los destinatarios: vecino + afectados + vecinos de hijos fusionados
  const destinatarios: PersonaContact[] = [
    { nombre: ticket.vecino, email: ticket.emailVecino, telefono: ticket.telefonoVecino },
    ...(ticket.afectados || []),
    ...(ticket.ticketsHijosVecinos || []),
  ]
  const vistos = new Set<string>()
  for (const p of destinatarios) {
    if (vistos.has(p.email)) continue
    vistos.add(p.email)
    await enviarEmail(ticket.id, {
      to: p.email,
      destinatarioNombre: p.nombre,
      subject: `Ticket #${ticket.numero} RESUELTO — ${ticket.titulo}`,
      html: htmlVecino(p.nombre),
    })
    // WhatsApp disponible para el admin
    await registrarWA(
      ticket.id,
      p.nombre,
      p.telefono,
      `WhatsApp disponible — ${p.nombre}`,
      `Hola ${p.nombre}, su incidencia #${ticket.numero} ha sido resuelta. Valore la resolución en: ${valorarLink}`
    )
  }

  // Email → admin + presidente
  const notifEmails = [...new Set([adminEmail, presidenteEmail].filter(Boolean))]
  await enviarEmail(ticket.id, {
    to: notifEmails.join(','),
    subject: `[CERRADO] Ticket #${ticket.numero} — ${ticket.titulo}`,
    html: `<div style="font-family:sans-serif;max-width:600px">
      <h2 style="color:#16a34a">Ticket cerrado</h2>
      <p><strong>Ticket:</strong> #${ticket.numero} — ${ticket.titulo}</p>
      <p><strong>Resuelto por:</strong> ${ticket.cerradoPor || 'Administración'}</p>
      <p><strong>Resolución:</strong> ${ticket.comentarioCierre || '—'}</p>
    </div>`,
  })
}
