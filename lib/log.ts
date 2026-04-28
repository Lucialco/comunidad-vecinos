import { prisma } from './prisma'

export async function logActividad(
  usuario: string,
  accion: string,
  detalle?: string,
  ip?: string
) {
  try {
    await prisma.logActividad.create({ data: { usuario, accion, detalle, ip } })
  } catch (e) {
    console.error('Error logging activity:', e)
  }
}
