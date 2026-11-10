import { loadEnv } from "./loadEnv.js";

// Ensure apps/api env vars (DATABASE_URL) are loaded before the Prisma
// client module is evaluated — it instantiates PrismaClient at import time.
loadEnv();

const { prisma } = await import("@project-a/db");

export default prisma;
