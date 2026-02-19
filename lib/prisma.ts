import { PrismaClient, Prisma } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined
}

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * Executa uma query raw dentro de uma transaction que primeiro
 * configura sql_mode='ALLOW_INVALID_DATES' para lidar com datas
 * '0000-00-00' no banco de produção.
 */
export async function safeQueryRaw<T>(query: Prisma.Sql): Promise<T> {
  return prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe("SET sql_mode = 'ALLOW_INVALID_DATES'");
    return tx.$queryRaw<T>(query);
  }) as Promise<T>;
}
