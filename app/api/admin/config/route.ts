import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { logActividad } from '@/lib/log'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const configs = await prisma.configuracion.findMany()
  return Response.json(configs)
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { values } = await request.json() as { values: { clave: string; valor: string }[] }

  for (const { clave, valor } of values) {
    await prisma.configuracion.upsert({
      where: { clave },
      update: { valor },
      create: { clave, valor },
    })
  }

  await logActividad(session.user?.email || 'admin', 'config-update', 'Configuración actualizada')
  return Response.json({ ok: true })
}
