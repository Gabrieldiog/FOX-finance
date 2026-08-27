import "server-only";
import { and, eq, gte, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { monthlyGoal, transaction } from "@/db/schema";
import type { Metas, MovimentoDoMes } from "@/lib/metas-do-mes";

// REGRA DE OURO: sessionUserId vem SEMPRE da sessão no servidor.

export const METAS_VAZIAS: Metas = { spendLimitCents: 0, saveTargetCents: 0 };

export async function getMetas(sessionUserId: string): Promise<Metas> {
  const [row] = await db
    .select()
    .from(monthlyGoal)
    .where(eq(monthlyGoal.userId, sessionUserId))
    .limit(1);
  if (!row) return { ...METAS_VAZIAS };
  return { spendLimitCents: row.spendLimitCents, saveTargetCents: row.saveTargetCents };
}

export async function setMetas(sessionUserId: string, metas: Metas): Promise<void> {
  await db
    .insert(monthlyGoal)
    .values({ userId: sessionUserId, ...metas })
    .onConflictDoUpdate({
      target: monthlyGoal.userId,
      set: { ...metas, updatedAt: new Date() },
    });
}

// Quanto entrou e saiu no mês pedido, no fuso de São Paulo. Mesma disciplina
// das outras agregações do app: transferência fora, soft delete fora, janela
// fechada dos dois lados.
export async function movimentoDoMes(
  sessionUserId: string,
  ano: number,
  mes: number,
): Promise<{ entrouCents: number; saiuCents: number }> {
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = mes === 12 ? 1 : mes + 1;
  const inicio = sql`(make_timestamp(${ano}, ${mes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;
  const fim = sql`(make_timestamp(${proxAno}, ${proxMes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;

  const [t] = await db
    .select({
      entrou: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'income'), 0)`,
      saiu: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'expense'), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicio),
        lt(transaction.occurredAt, fim),
      ),
    );

  return { entrouCents: Number(t?.entrou ?? 0), saiuCents: Number(t?.saiu ?? 0) };
}

// Dia de hoje e tamanho do mês, para as frases de ritmo e de "mês fechado".
// Quando o mês pedido não é o corrente, ele conta como fechado.
export function janelaDoMes(
  ano: number,
  mes: number,
  hoje: { ano: number; mes: number; dia: number },
): Pick<MovimentoDoMes, "diaDoMes" | "diasNoMes"> {
  const diasNoMes = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
  const ehCorrente = ano === hoje.ano && mes === hoje.mes;
  return { diaDoMes: ehCorrente ? hoje.dia : diasNoMes, diasNoMes };
}
