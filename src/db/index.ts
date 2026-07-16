import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";

// Conexão preguiçosa: o postgres-js só abre a conexão de fato na primeira query.
const client = postgres(env.DATABASE_URL);

export const db = drizzle(client);
