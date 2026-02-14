import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const connectionString =
  process.env.NODE_ENV === "production"
    ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
    : (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);

if (!connectionString) {
  throw new Error(
    "DATABASE_URL or SUPABASE_DATABASE_URL must be set.",
  );
}

export const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("supabase.co") ? { rejectUnauthorized: false } : undefined,
});
export const db = drizzle(pool, { schema });
