import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        comentarios: { orderBy: { creadoEn: 'asc' } },
        afectados: true,
        comunicaciones: { orderBy: { creadoEn: 'desc' } },
        ticketsHijos: { include: { afectados: true } },
        ticketPadre: true,
      },
    })

    if (!ticket) {
      return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al obtener ticket' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const ticket = await prisma.ticket.update({
      where: { id },
      data: body,
      include: { comentarios: true, afectados: true },
    })

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al actualizar ticket' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await prisma.comunicacion.deleteMany({ where: { ticketId: id } })
    await prisma.comentario.deleteMany({ where: { ticketId: id } })
    await prisma.afectado.deleteMany({ where: { ticketId: id } })
    await prisma.ticket.delete({ where: { id } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al eliminar ticket' }, { status: 500 })
  }
}
