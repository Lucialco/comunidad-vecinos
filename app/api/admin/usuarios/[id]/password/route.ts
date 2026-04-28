import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { logActividad } from '@/lib/log'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const { password } = await request.json()
  if (!password || password.length < 6) {
    return Response.json({ error: 'Mínimo 6 caracteres' }, { status: 400 })
  }

  const hashed = await bcrypt.hash(password, 10)
  const usuario = await prisma.usuario.update({ where: { id }, data: { password: hashed } })

  await logActividad(
    session.user?.email || 'admin',
    'cambiar-password',
    `Contraseña cambiada para usuario: ${usuario.email}`
  )

  return Response.json({ ok: true })
}
