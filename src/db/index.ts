import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare global {
  var __kbeautyPgClient: ReturnType<typeof postgres> | undefined;
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and configure it.");
}

// Managed Postgres providers (Render, Railway, Supabase, Neon, ...) require
// SSL on external connections; a local dev database on localhost does not
// speak SSL at all. Detect which one we're talking to instead of hardcoding
// either behavior.
const isLocal = /localhost|127\.0\.0\.1/.test(connectionString);

// Reuse the connection across hot reloads in dev.
const client =
  global.__kbeautyPgClient ??
  postgres(connectionString, {
    max: 10,
    ssl: isLocal ? false : "require",
  });

if (process.env.NODE_ENV !== "production") {
  global.__kbeautyPgClient = client;
}

export const db = drizzle(client, { schema });
