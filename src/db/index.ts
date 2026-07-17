import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// Conexão preguiçosa: o postgres-js só abre a conexão de fato na primeira query.
// `prepare: false` é compatível com o pooler (transaction mode) do Supabase.
// Exportada também pra que os testes possam encerrar a conexão no fim.
export const client = postgres(env.DATABASE_URL, { prepare: false });

export const db = drizzle(client, { schema });
