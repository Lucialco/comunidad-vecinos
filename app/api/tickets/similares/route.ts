import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const categoria = searchParams.get('categoria')
    const zona = searchParams.get('zona')
    const palabras = searchParams.get('q') || ''

    if (!categoria && !zona && !palabras) {
      return Response.json([])
    }

    const where: Prisma.TicketWhereInput = {
      estado: { not: 'Cerrado' },
    }

    if (categoria) where.categoria = categoria
    if (zona) where.zona = zona

    const allTickets = await prisma.ticket.findMany({
      where,
      include: { afectados: true },
      orderBy: { creadoEn: 'desc' },
      take: 10,
    })

    if (palabras.trim().length > 2) {
      const terms = palabras
        .toLowerCase()
        .split(' ')
        .filter((t: string) => t.length > 2)

      const filtrados = allTickets.filter((t) =>
        terms.some(
          (term) =>
            t.titulo.toLowerCase().includes(term) ||
            t.descripcion.toLowerCase().includes(term)
        )
      )
      return Response.json(filtrados.slice(0, 5))
    }

    return Response.json(allTickets.slice(0, 5))
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error buscando similares' }, { status: 500 })
  }
}
