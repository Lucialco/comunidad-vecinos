import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createHash } from 'crypto'
import { logActividad } from '@/lib/log'

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'No autorizado' }, { status: 401 })

  const { email } = await request.json()
  if (!email) return Response.json({ error: 'Email requerido' }, { status: 400 })

  const anonEmail = createHash('sha256').update(email).digest('hex').substring(0, 16) + '@anonimizado.com'
  const anonNombre = 'Vecino Anonimizado'

  await prisma.ticket.updateMany({
    where: { emailVecino: email },
    data: { vecino: anonNombre, emailVecino: anonEmail, telefonoVecino: null },
  })

  await prisma.afectado.updateMany({
    where: { email },
    data: { nombre: anonNombre, email: anonEmail, telefono: null },
  })

  await logActividad(
    session.user?.email || 'admin',
    'rgpd-anonimizar',
    `Datos anonimizados para email: ${email}`
  )

  return Response.json({ ok: true })
}
