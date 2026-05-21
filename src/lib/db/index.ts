import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type DatabaseSchema = typeof schema;

declare global {
  var postgresClient: postgres.Sql | undefined;
  var drizzleDb: PostgresJsDatabase<DatabaseSchema> | undefined;
}

const getDatabaseUrl = (): string => {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
    throw new Error("DATABASE_URL não configurada");
  }

  return databaseUrl;
};

const createClient = (): postgres.Sql => {
  return postgres(getDatabaseUrl(), {
    max: 1,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
  });
};

export const getDb = (): PostgresJsDatabase<DatabaseSchema> => {
  if (globalThis.drizzleDb !== undefined) {
    return globalThis.drizzleDb;
  }

  const sqlClient = globalThis.postgresClient ?? createClient();
  const database = drizzle(sqlClient, { schema });

  if (process.env.NODE_ENV !== "production") {
    globalThis.postgresClient = sqlClient;
    globalThis.drizzleDb = database;
  }

  return database;
};
