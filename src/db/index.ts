import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// Conexão preguiçosa: o postgres-js só abre a conexão de fato na primeira query.
// `prepare: false` + `max: 1` casam com o pooler (transaction mode) do Supabase
// e são seguros no serverless da Vercel (cada instância abre poucas conexões).
// Exportada também pra que os testes possam encerrar a conexão no fim.
export const client = postgres(env.DATABASE_URL, { prepare: false, max: 1 });

export const db = drizzle(client, { schema });
