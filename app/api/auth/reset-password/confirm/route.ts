import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()
    if (!token || !password) {
      return Response.json({ error: 'Token y contraseña requeridos' }, { status: 400 })
    }
    if (password.length < 6) {
      return Response.json({ error: 'La contraseña debe tener al menos 6 caracteres' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    })

    if (!usuario) {
      return Response.json({ error: 'El enlace ha expirado o no es válido' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { password: hashed, resetToken: null, resetTokenExpiry: null },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al restablecer contraseña' }, { status: 500 })
  }
}
