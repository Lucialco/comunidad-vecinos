import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const categoria = searchParams.get('categoria')
    const zona = searchParams.get('zona')
    const palabras = searchParams.get('q') || ''

    if (!categoria && !zona && !palabras) {
      return Response.json([])
    }

    const where: Record<string, unknown> = {
      estado: { not: 'Cerrado' },
    }

    if (categoria) where.categoria = categoria
    if (zona) where.zona = zona

    let tickets = await prisma.ticket.findMany({
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

      tickets = tickets.filter((t) =>
        terms.some(
          (term) =>
            t.titulo.toLowerCase().includes(term) ||
            t.descripcion.toLowerCase().includes(term)
        )
      )
    }

    return Response.json(tickets.slice(0, 5))
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error buscando similares' }, { status: 500 })
  }
}
