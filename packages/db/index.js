import { PrismaClient } from "@prisma/client";

function normalizeDatabaseUrl(rawUrl) {
  if (!rawUrl) {
    throw new Error("Missing DATABASE_URL");
  }

  const url = new URL(rawUrl);
  url.searchParams.set("sslmode", url.searchParams.get("sslmode") || "require");

  if (url.port === "6543") {
    url.searchParams.set("pgbouncer", "true");
    url.searchParams.set("pool_timeout", url.searchParams.get("pool_timeout") || "30");
  }

  return url.toString();
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = normalizeDatabaseUrl(process.env.DATABASE_URL);
}

export const prisma = new PrismaClient();
