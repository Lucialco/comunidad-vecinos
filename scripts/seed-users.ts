import * as dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  const adminHash = await bcrypt.hash('admin123', 12)
  const presidenteHash = await bcrypt.hash('presidente123', 12)

  await prisma.usuario.upsert({
    where: { email: 'pabloiglesias@cofincas.es' },
    update: { password: adminHash, nombre: 'Pablo Iglesias', rol: 'ADMIN' },
    create: {
      email: 'pabloiglesias@cofincas.es',
      password: adminHash,
      nombre: 'Pablo Iglesias',
      rol: 'ADMIN',
    },
  })

  await prisma.usuario.upsert({
    where: { email: 'parcela8pi@gmail.com' },
    update: { password: presidenteHash, nombre: 'Presidente Parcela 8', rol: 'PRESIDENTE' },
    create: {
      email: 'parcela8pi@gmail.com',
      password: presidenteHash,
      nombre: 'Presidente Parcela 8',
      rol: 'PRESIDENTE',
    },
  })

  console.log('✓ Usuarios creados:')
  console.log('  Admin: pabloiglesias@cofincas.es / admin123')
  console.log('  Presidente: parcela8pi@gmail.com / presidente123')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
