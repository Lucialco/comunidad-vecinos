import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendProgresoEmail } from '@/lib/email'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { comentario, autor } = body

    if (!comentario || comentario.trim().length === 0) {
      return Response.json({ error: 'El comentario es obligatorio' }, { status: 400 })
    }

    const ticketActual = await prisma.ticket.findUnique({
      where: { id },
      include: { afectados: true },
    })
    if (!ticketActual) {
      return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }
    if (ticketActual.estado !== 'Abierto') {
      return Response.json(
        { error: 'Solo se pueden marcar en progreso tickets Abiertos' },
        { status: 400 }
      )
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { estado: 'En progreso' },
    })

    await prisma.comentario.create({
      data: {
        ticketId: id,
        texto: comentario,
        autor: autor || 'Administrador',
        rol: 'admin',
      },
    })

    sendProgresoEmail({
      id: ticket.id,
      numero: ticket.numero,
      titulo: ticket.titulo,
      emailVecino: ticket.emailVecino,
      vecino: ticket.vecino,
      telefonoVecino: ticket.telefonoVecino,
      comentario,
      zona: ticket.zona,
      categoria: ticket.categoria,
      afectados: ticketActual.afectados,
    }).catch(console.error)

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
