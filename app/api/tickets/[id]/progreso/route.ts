import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendProgresoEmail } from '@/lib/email'
import { put } from '@vercel/blob'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    let comentario: string
    let autor: string
    let fotoUrl: string | null = null

    const contentType = request.headers.get('content-type') || ''
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      comentario = formData.get('comentario') as string
      autor = (formData.get('autor') as string) || 'Administrador'
      const fotoFile = formData.get('foto') as File | null
      if (fotoFile && fotoFile.size > 0) {
        try {
          const ext = fotoFile.name.split('.').pop() || 'jpg'
          const filename = `progreso-${id}-${Date.now()}.${ext}`
          const blob = await put(filename, fotoFile, { access: 'public' })
          fotoUrl = blob.url
        } catch (fotoErr) {
          console.error('[progreso] No se pudo subir foto:', fotoErr)
        }
      }
    } else {
      const body = await request.json()
      comentario = body.comentario
      autor = body.autor || 'Administrador'
    }

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
      fotoUrl,
    }).catch(console.error)

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al actualizar estado' }, { status: 500 })
  }
}
