import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const logs = await prisma.logActividad.findMany({
    orderBy: { creadoEn: 'desc' },
    take: 100,
  })
  return Response.json(logs)
}
