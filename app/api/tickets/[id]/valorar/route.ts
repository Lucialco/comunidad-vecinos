import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { valoracionReparacion, valoracionRapidez, valoracionComunicacion, valoracionComentario } = body

    if (!valoracionReparacion || !valoracionRapidez || !valoracionComunicacion) {
      return Response.json(
        { error: 'Las tres valoraciones son obligatorias' },
        { status: 400 }
      )
    }

    const [r, rp, c] = [valoracionReparacion, valoracionRapidez, valoracionComunicacion]
    if ([r, rp, c].some((v) => v < 1 || v > 5 || !Number.isInteger(v))) {
      return Response.json(
        { error: 'Las valoraciones deben ser entre 1 y 5' },
        { status: 400 }
      )
    }

    const ticketActual = await prisma.ticket.findUnique({ where: { id } })
    if (!ticketActual) {
      return Response.json({ error: 'Ticket no encontrado' }, { status: 404 })
    }
    if (ticketActual.estado !== 'Cerrado') {
      return Response.json(
        { error: 'Solo se pueden valorar tickets cerrados' },
        { status: 400 }
      )
    }
    if (ticketActual.valoracionFecha) {
      return Response.json(
        { error: 'Este ticket ya ha sido valorado' },
        { status: 409 }
      )
    }

    const ticket = await prisma.ticket.update({
      where: { id },
      data: {
        valoracionReparacion: r,
        valoracionRapidez: rp,
        valoracionComunicacion: c,
        valoracionComentario: valoracionComentario || null,
        valoracionFecha: new Date(),
      },
    })

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al guardar valoración' }, { status: 500 })
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      select: {
        id: true,
        numero: true,
        titulo: true,
        estado: true,
        cerradoEn: true,
        cerradoPor: true,
        zona: true,
        categoria: true,
        valoracionFecha: true,
        valoracionReparacion: true,
        valoracionRapidez: true,
        valoracionComunicacion: true,
        valoracionComentario: true,
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
