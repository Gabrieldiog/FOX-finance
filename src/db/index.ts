import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/env";
import * as schema from "./schema";

// Conexão preguiçosa: o postgres-js só abre a conexão de fato na primeira query.
// Exportada também pra que os testes possam encerrar a conexão no fim.
//
// Estes três parâmetros são o que decide se uma tela leva 200ms ou 1,5s:
//
// `prepare: true` — com prepare:false, TODA query com parâmetro (ou seja, todas,
// porque todas filtram por user_id) custava DUAS idas ao banco em vez de uma: o
// driver mandava Parse+Describe, esperava a resposta, e só então Bind+Execute
// (postgres/src/connection.js:238). Pior, ele jogava a conexão na fila `full`,
// o que desligava o pipelining e transformava todo Promise.all em código
// sequencial. Medido com um proxy TCP injetando latência: 4 queries em
// Promise.all custavam 8,5 idas-e-voltas com prepare:false e 1,1 com true.
// O comentário antigo dizia que o pooler exigia prepare:false — o Supavisor
// aceita prepared statements em transaction mode, e o próprio driver refaz o
// prepare sozinho se o pooler reclamar (connection.js:540).
//
// `max: 3` — cinto e suspensório. Se algum dia o pooler recusar prepared
// statements e for preciso voltar prepare para false, o pool de 3 sozinho já
// evita o pior da serialização (2,2 idas-e-voltas em vez de 8,5). Três conexões
// por instância serverless é folgado para o tamanho deste app.
//
// `fetch_types: false` — corta um `select ... from pg_catalog.pg_type` extra em
// cada conexão nova (connection.js:768). Nenhuma coluna deste schema é array,
// então o driver não precisa desse catálogo.
export const client = postgres(env.DATABASE_URL, {
  prepare: true,
  max: 3,
  fetch_types: false,
});

export const db = drizzle(client, { schema });
