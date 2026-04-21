import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTicketEmail } from '@/lib/email'
import { put } from '@vercel/blob'
import type { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl
    const estado = searchParams.get('estado')
    const categoria = searchParams.get('categoria')
    const prioridad = searchParams.get('prioridad')

    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where: Prisma.TicketWhereInput = {}
    if (estado) where.estado = estado
    if (categoria) where.categoria = categoria
    if (prioridad) where.prioridad = prioridad
    if (desde || hasta) {
      where.creadoEn = {
        ...(desde ? { gte: new Date(desde) } : {}),
        ...(hasta ? { lte: new Date(hasta + 'T23:59:59') } : {}),
      }
    }

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        comentarios: { orderBy: { creadoEn: 'asc' } },
        afectados: true,
      },
      orderBy: { creadoEn: 'desc' },
    })

    return Response.json(tickets)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al obtener tickets' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const titulo = formData.get('titulo') as string
    const descripcion = formData.get('descripcion') as string
    const categoria = formData.get('categoria') as string
    const prioridad = (formData.get('prioridad') as string) || 'Normal'
    const zona = formData.get('zona') as string
    const piso = formData.get('piso') as string | null
    const vecino = formData.get('vecino') as string
    const emailVecino = formData.get('emailVecino') as string
    const telefonoVecino = formData.get('telefonoVecino') as string | null
    const fotoFile = formData.get('foto') as File | null

    console.log('[POST /api/tickets] campos recibidos:', { titulo, categoria, zona, vecino, emailVecino, hasFoto: !!(fotoFile && fotoFile.size > 0) })

    if (!titulo || !descripcion || !categoria || !zona || !vecino || !emailVecino) {
      return Response.json({ error: 'Faltan campos obligatorios' }, { status: 400 })
    }

    let fotoPath: string | null = null
    if (fotoFile && fotoFile.size > 0) {
      try {
        const ext = fotoFile.name.split('.').pop() || 'jpg'
        const filename = `ticket-${Date.now()}.${ext}`
        const blob = await put(filename, fotoFile, { access: 'public' })
        fotoPath = blob.url
        console.log('[POST /api/tickets] foto subida a Blob:', fotoPath)
      } catch (fotoErr) {
        console.error('[POST /api/tickets] No se pudo subir foto (ignorado):', fotoErr)
      }
    }

    console.log('[POST /api/tickets] calculando numero...')
    const maxNumero = await prisma.ticket.aggregate({ _max: { numero: true } })
    const numero = (maxNumero._max.numero ?? 0) + 1
    console.log('[POST /api/tickets] numero asignado:', numero)

    const ticket = await prisma.ticket.create({
      data: {
        numero,
        titulo,
        descripcion,
        categoria,
        prioridad,
        zona,
        piso: piso || null,
        vecino,
        emailVecino,
        telefonoVecino: telefonoVecino || null,
        foto: fotoPath,
        estado: 'Abierto',
      },
      include: { comentarios: true, afectados: true },
    })

    console.log('[POST /api/tickets] ticket creado:', ticket.id, 'numero:', ticket.numero)
    sendTicketEmail(ticket).catch(console.error)

    return Response.json(ticket, { status: 201 })
  } catch (error) {
    console.error('[POST /api/tickets] ERROR:', error)
    return Response.json({
      error: 'Error al crear ticket',
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
