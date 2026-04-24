import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'
import nodemailer from 'nodemailer'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    if (!email) return Response.json({ error: 'Email requerido' }, { status: 400 })

    const usuario = await prisma.usuario.findUnique({ where: { email } })
    if (!usuario) return Response.json({ ok: true })

    const token = randomBytes(32).toString('hex')
    const expiry = new Date(Date.now() + 60 * 60 * 1000)

    await prisma.usuario.update({
      where: { email },
      data: { resetToken: token, resetTokenExpiry: expiry },
    })

    const appUrl = process.env.APP_URL || 'http://localhost:3000'
    const resetLink = `${appUrl}/reset-password?token=${token}`

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_PASS },
    })

    await transporter.sendMail({
      from: `"Comunidad Vecinos" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '[PARCELA 8] Restablecer contraseña',
      html: `<div style="font-family:sans-serif;max-width:600px">
        <h2 style="color:#C9A227">Restablecer contraseña — Parcela 8</h2>
        <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
        <p style="margin:24px 0">
          <a href="${resetLink}" style="background:#C9A227;color:white;padding:12px 24px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-family:sans-serif">
            Restablecer contraseña
          </a>
        </p>
        <p style="color:#6b7280;font-size:13px">Este enlace expira en 1 hora. Si no solicitaste este cambio, ignora este email.</p>
        <p style="color:#9ca3af;font-size:12px">O copia este enlace en tu navegador: ${resetLink}</p>
      </div>`,
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error(error)
    return Response.json({ error: 'Error al procesar solicitud' }, { status: 500 })
  }
}
