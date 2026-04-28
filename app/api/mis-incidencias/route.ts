import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')
  if (!email || !email.includes('@')) {
    return Response.json({ error: 'Email requerido' }, { status: 400 })
  }

  const tickets = await prisma.ticket.findMany({
    where: { emailVecino: email },
    select: {
      id: true,
      numero: true,
      titulo: true,
      descripcion: true,
      categoria: true,
      prioridad: true,
      estado: true,
      zona: true,
      piso: true,
      calle: true,
      bloque: true,
      foto: true,
      creadoEn: true,
      cerradoEn: true,
      cerradoPor: true,
      comentarios: {
        select: { texto: true, autor: true, rol: true, creadoEn: true },
        orderBy: { creadoEn: 'asc' },
      },
    },
    orderBy: { creadoEn: 'desc' },
  })

  return Response.json(tickets)
}
