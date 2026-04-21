import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const { nombre, email, telefono } = body

    if (!nombre || !email) {
      return Response.json({ error: 'Nombre y email son obligatorios' }, { status: 400 })
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } })
    if (!ticket) {
      return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }

    const existente = await prisma.afectado.findFirst({
      where: { ticketId: id, email },
    })

    if (existente) {
      return Response.json({ error: 'Ya estás unido a este ticket' }, { status: 409 })
    }

    const afectado = await prisma.afectado.create({
      data: {
        ticketId: id,
        nombre,
        email,
        telefono: telefono || null,
      },
    })

    await prisma.comentario.create({
      data: {
        ticketId: id,
        texto: `${nombre} se ha unido a este ticket como vecino afectado.`,
        autor: nombre,
        rol: 'vecino',
      },
    })

    return Response.json(afectado, { status: 201 })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al unirse al ticket' }, { status: 500 })
  }
}
