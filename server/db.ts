import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

function getPoolConfig() {
  const connStr =
    process.env.NODE_ENV === "production"
      ? (process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL)
      : (process.env.DATABASE_URL || process.env.SUPABASE_DATABASE_URL);

  if (!connStr) {
    throw new Error("DATABASE_URL or SUPABASE_DATABASE_URL must be set.");
  }

  const isSupabase = connStr.includes("supabase.co");

  try {
    const url = new URL(connStr);
    return {
      host: url.hostname,
      port: parseInt(url.port || "5432", 10),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database: url.pathname.replace("/", ""),
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    };
  } catch {
    return {
      connectionString: connStr,
      ssl: isSupabase ? { rejectUnauthorized: false } : undefined,
    };
  }
}

export const pool = new Pool(getPoolConfig());
export const db = drizzle(pool, { schema });
