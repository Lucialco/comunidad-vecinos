import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const tickets = await prisma.ticket.findMany({
    select: { vecino: true, emailVecino: true, telefonoVecino: true },
  })

  const vecinoMap = new Map<string, { nombre: string; email: string; telefono: string | null; count: number }>()
  tickets.forEach((t) => {
    if (vecinoMap.has(t.emailVecino)) {
      vecinoMap.get(t.emailVecino)!.count++
    } else {
      vecinoMap.set(t.emailVecino, {
        nombre: t.vecino,
        email: t.emailVecino,
        telefono: t.telefonoVecino,
        count: 1,
      })
    }
  })

  const vecinos = Array.from(vecinoMap.values()).sort((a, b) => b.count - a.count)
  return Response.json(vecinos)
}
