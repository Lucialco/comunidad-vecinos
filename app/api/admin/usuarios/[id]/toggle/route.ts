import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActividad } from '@/lib/log'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const usuario = await prisma.usuario.findUnique({ where: { id } })
  if (!usuario) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })

  const updated = await prisma.usuario.update({
    where: { id },
    data: { activo: !usuario.activo },
  })

  await logActividad(
    session.user?.email || 'admin',
    updated.activo ? 'activar-usuario' : 'desactivar-usuario',
    `Usuario: ${usuario.email}`
  )

  return Response.json({ ok: true, activo: updated.activo })
}
