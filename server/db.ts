import * as schema from "@shared/schema";
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Use postgres-js driver for both dev and production
// It works with both Neon and standard PostgreSQL connections
const sql = postgres(process.env.DATABASE_URL, {
  ssl: process.env.NODE_ENV === 'production' ? 'require' : false,
});
export const db = drizzle({ client: sql, schema });
export const rawSql = sql;
