// Configuration settings and client setups for prisma.
// Manages initializations for databases and external service integrations.

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "pg";
const { Pool } = pkg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in environment variables");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
});

// pass schema to driver to isolate queries
const adapter = new PrismaPg(pool, { schema: "public" });
const prisma = new PrismaClient({ adapter });

export default prisma;