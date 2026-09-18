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

// Reuse the connection across hot reloads in dev.
const client =
  global.__kbeautyPgClient ??
  postgres(connectionString, {
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__kbeautyPgClient = client;
}

export const db = drizzle(client, { schema });
