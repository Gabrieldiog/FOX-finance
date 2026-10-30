import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/db";

export const dynamic = "force-dynamic";

// Só devolve o CÓDIGO do erro (ECONNREFUSED, 28P01, ENOTFOUND…), nunca a
// mensagem crua: ela carrega host e usuário do banco. O filtro de formato
// garante que nada de texto livre do driver escape por aqui.
//
// O Drizzle embrulha o erro do driver num DrizzleQueryError, cujo `.code` é
// undefined — o código útil fica lá embaixo, no `.cause`. Por isso a busca
// desce a corrente de causas (com teto, que corrente circular existe).
function codigoDoErro(e: unknown): string {
  let atual: unknown = e;
  for (let i = 0; atual != null && i < 5; i++) {
    const code = (atual as { code?: unknown }).code;
    if (typeof code === "string" && /^[A-Za-z0-9_]{1,32}$/.test(code)) return code;
    atual = (atual as { cause?: unknown }).cause;
  }
  if (e instanceof Error && /^[A-Za-z]{1,32}$/.test(e.name)) return e.name;
  return "desconhecido";
}

// Liveness + checagem do banco.
//
// Responde 503 quando o Postgres não atende — de propósito. A versão anterior
// devolvia 200 com `db: "down"` no corpo, e um health check que nunca falha não
// dispara alarme nenhum: foi assim que o projeto ficou semanas fora do ar (banco
// pausado por inatividade) sem ninguém saber, até alguém tentar criar conta.
//
// A checagem lê uma tabela DO APP (e não só `select 1`): em out/2026 o projeto
// foi pausado por "pouca atividade" mesmo com o ping de 6 em 6 horas rodando —
// a última transação real era de 6 dias antes. Um `select 1` aparentemente não
// conta como uso; uma leitura numa tabela de verdade se parece com uso real.
// Só conta linhas: nenhum dado sai daqui.
export async function GET() {
  try {
    await db.execute(sql`select count(*) from "transaction"`);
    return NextResponse.json({ ok: true, db: "up" });
  } catch (e) {
    return NextResponse.json({ ok: false, db: "down", erro: codigoDoErro(e) }, { status: 503 });
  }
}
