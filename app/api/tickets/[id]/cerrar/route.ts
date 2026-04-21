import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendCloseEmail } from '@/lib/email'
import { put } from '@vercel/blob'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const formData = await request.formData()

    const comentario = formData.get('comentario') as string
    const cerradoPor = (formData.get('cerradoPor') as string) || 'Administrador'
    const fotoFile = formData.get('foto') as File | null

    if (!comentario || comentario.trim().length === 0) {
      return Response.json({ error: 'El comentario de cierre es obligatorio' }, { status: 400 })
    }

    if (!fotoFile || fotoFile.size === 0) {
      return Response.json({ error: 'La foto de cierre es obligatoria' }, { status: 400 })
    }

    let fotoPath = ''
    try {
      const ext = fotoFile.name.split('.').pop() || 'jpg'
      const filename = `cierre-${id}-${Date.now()}.${ext}`
      const blob = await put(filename, fotoFile, { access: 'public' })
      fotoPath = blob.url
      console.log('[cerrar] foto subida a Blob:', fotoPath)
    } catch (fotoErr) {
      console.error('[cerrar] No se pudo subir foto:', fotoErr)
      return Response.json({ error: 'No se pudo subir la foto de cierre' }, { status: 500 })
    }

    // Obtener ticket con afectados y tickets hijos (para fusionados)
    const ticketCompleto = await prisma.ticket.findUnique({
      where: { id },
      include: {
        afectados: true,
        ticketsHijos: { include: { afectados: true } },
      },
    })

    const ticket = await prisma.ticket.update({
      where: { id },
      data: { estado: 'Cerrado', cerradoEn: new Date(), cerradoPor, foto: fotoPath },
    })

    await prisma.comentario.create({
      data: { ticketId: id, texto: comentario, autor: cerradoPor, rol: 'admin' },
    })

    // Vecinos de tickets fusionados (hijos)
    const vecinosHijos = (ticketCompleto?.ticketsHijos ?? []).flatMap((hijo: { vecino: string; emailVecino: string; telefonoVecino?: string | null; afectados: { nombre: string; email: string; telefono?: string | null }[] }) => [
      { nombre: hijo.vecino, email: hijo.emailVecino, telefono: hijo.telefonoVecino },
      ...hijo.afectados.map((a) => ({ nombre: a.nombre, email: a.email, telefono: a.telefono })),
    ])

    sendCloseEmail({
      id: ticket.id,
      numero: ticket.numero,
      titulo: ticket.titulo,
      emailVecino: ticket.emailVecino,
      vecino: ticket.vecino,
      telefonoVecino: ticket.telefonoVecino,
      cerradoPor: ticket.cerradoPor,
      comentarioCierre: comentario,
      fotoUrl: fotoPath,
      afectados: ticketCompleto?.afectados ?? [],
      ticketsHijosVecinos: vecinosHijos,
    }).catch(console.error)

    return Response.json(ticket)
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al cerrar ticket' }, { status: 500 })
  }
}
