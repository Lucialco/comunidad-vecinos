import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { PrismaClient } from '@prisma/client'
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'

function createClient() {
  const rawUrl = process.env.DATABASE_URL || 'file:./dev.db'
  const dbPath = rawUrl.startsWith('file:') ? rawUrl.slice(5) : rawUrl
  const resolved = path.isAbsolute(dbPath)
    ? dbPath
    : path.join(__dirname, '..', dbPath)
  const adapter = new PrismaBetterSqlite3({ url: resolved })
  return new PrismaClient({ adapter })
}

const prisma = createClient()

async function main() {
  // Clear existing data (safe for dev only)
  await prisma.comunicacion.deleteMany()
  await prisma.comentario.deleteMany()
  await prisma.afectado.deleteMany()
  await prisma.ticket.deleteMany()

  console.log('Seeding tickets...')

  // Ticket 1: Abierto / Urgente / Ascensor
  const t1 = await prisma.ticket.create({
    data: {
      numero: 1,
      titulo: 'Ascensor del Portal A fuera de servicio',
      descripcion: 'El ascensor lleva 3 días parado. Hay vecinos mayores en las plantas altas que no pueden bajar sin ayuda. Se escuchan ruidos metálicos antes de que se detuviera.',
      categoria: 'Ascensor',
      prioridad: 'Urgente',
      estado: 'Abierto',
      zona: 'Portal A',
      piso: '4ºB',
      vecino: 'María García Fernández',
      emailVecino: 'maria.garcia@ejemplo.com',
      telefonoVecino: '612345678',
    },
  })
  await prisma.comentario.create({
    data: {
      ticketId: t1.id,
      texto: 'Confirmo el problema, llevamos varios días sin ascensor.',
      autor: 'María García Fernández',
      rol: 'vecino',
    },
  })
  await prisma.afectado.create({
    data: {
      ticketId: t1.id,
      nombre: 'Antonio Ruiz López',
      email: 'antonio.ruiz@ejemplo.com',
      telefono: '698765432',
    },
  })

  // Ticket 2: En progreso / Alta / Iluminación
  const t2 = await prisma.ticket.create({
    data: {
      numero: 2,
      titulo: 'Farolas de los jardines sin luz',
      descripcion: 'Las cuatro farolas del jardín central llevan apagadas desde la semana pasada. Por las noches es peligroso caminar por la zona.',
      categoria: 'Iluminación',
      prioridad: 'Alta',
      estado: 'En progreso',
      zona: 'Jardines',
      vecino: 'Carlos Pérez Martínez',
      emailVecino: 'carlos.perez@ejemplo.com',
      telefonoVecino: '634567890',
    },
  })
  await prisma.comentario.create({
    data: {
      ticketId: t2.id,
      texto: 'Hemos contactado con la empresa eléctrica. El técnico vendrá el próximo miércoles para revisar el cuadro eléctrico exterior.',
      autor: 'Administrador',
      rol: 'admin',
    },
  })
  await prisma.comunicacion.create({
    data: {
      ticketId: t2.id,
      tipo: 'Email',
      destinatario: 'carlos.perez@ejemplo.com',
      asunto: `Incidencia #2 — En progreso: Farolas de los jardines sin luz`,
      mensaje: 'Su incidencia está siendo gestionada.',
      estado: 'Enviado',
    },
  })

  // Ticket 3: Cerrado / Normal / Limpieza
  const t3 = await prisma.ticket.create({
    data: {
      numero: 3,
      titulo: 'Suciedad acumulada en zona de contenedores',
      descripcion: 'La zona de contenedores del sótano está muy sucia, con bolsas rotas en el suelo y mal olor. Necesita una limpieza urgente.',
      categoria: 'Limpieza',
      prioridad: 'Normal',
      estado: 'Cerrado',
      zona: 'Sótano',
      vecino: 'Laura Sánchez Gómez',
      emailVecino: 'laura.sanchez@ejemplo.com',
      cerradoEn: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      cerradoPor: 'Administrador',
    },
  })
  await prisma.comentario.create({
    data: {
      ticketId: t3.id,
      texto: 'El servicio de limpieza ha pasado esta mañana. Zona limpia y desinfectada.',
      autor: 'Administrador',
      rol: 'admin',
    },
  })
  await prisma.ticket.update({
    where: { id: t3.id },
    data: {
      valoracionReparacion: 5,
      valoracionRapidez: 4,
      valoracionComunicacion: 5,
      valoracionComentario: 'Muy rápidos y eficientes. La zona quedó perfecta.',
      valoracionFecha: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.comunicacion.createMany({
    data: [
      {
        ticketId: t3.id,
        tipo: 'Email',
        destinatario: 'laura.sanchez@ejemplo.com',
        asunto: 'Incidencia #3 — Cerrada: Suciedad acumulada en zona de contenedores',
        mensaje: 'Su incidencia ha sido resuelta.',
        estado: 'Enviado',
      },
      {
        ticketId: t3.id,
        tipo: 'Email',
        destinatario: 'cesarmorcilloretuerce@gmail.com',
        asunto: 'Incidencia #3 cerrada',
        mensaje: 'Ticket cerrado por administrador.',
        estado: 'Enviado',
      },
    ],
  })

  // Ticket 4: Abierto / Baja / Pintura
  await prisma.ticket.create({
    data: {
      numero: 4,
      titulo: 'Pintura deteriorada en escalera Portal B',
      descripcion: 'La pintura de la escalera del portal B tiene varias zonas desconchadas, especialmente en el tercer piso. Estaría bien repintarlo antes de las fiestas.',
      categoria: 'Pintura',
      prioridad: 'Baja',
      estado: 'Abierto',
      zona: 'Portal B',
      piso: '3ºA',
      vecino: 'Pedro Jiménez Torres',
      emailVecino: 'pedro.jimenez@ejemplo.com',
    },
  })

  console.log('✓ 4 tickets creados:')
  console.log('  #1 Ascensor Portal A — Urgente / Abierto (con 1 afectado)')
  console.log('  #2 Farolas jardines — Alta / En progreso (con comentario admin + comunicación)')
  console.log('  #3 Limpieza sótano — Normal / Cerrado + valorado ⭐⭐⭐⭐⭐')
  console.log('  #4 Pintura Portal B — Baja / Abierto')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
