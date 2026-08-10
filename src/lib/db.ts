import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

export async function checkDatabaseConnection() {
  try {
    await db.$queryRaw`SELECT 1`;
    return { ok: true as const };
  } catch (error) {
    console.error(
      "[ClassConnect] Database health check failed",
      error instanceof Error ? error.message : "Unknown database error",
    );
    return { ok: false as const };
  }
}
