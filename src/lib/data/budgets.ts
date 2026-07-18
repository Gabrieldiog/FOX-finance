import "server-only";
import { and, desc, eq, gte, isNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import { budget, category, transaction } from "@/db/schema";

export type MetaProgresso = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  limitCents: number;
  gastoCents: number;
};

// Define (ou atualiza) a meta de uma categoria. Uma por (dono, categoria):
// a constraint única faz o insert virar update quando já existe.
export async function setBudget(sessionUserId: string, categoryId: string, limitCents: number) {
  const [row] = await db
    .insert(budget)
    .values({ userId: sessionUserId, categoryId, limitCents })
    .onConflictDoUpdate({
      target: [budget.userId, budget.categoryId],
      set: { limitCents, updatedAt: new Date() },
    })
    .returning();
  return row;
}

// Remove a meta de uma categoria — só a do próprio dono.
export async function deleteBudget(sessionUserId: string, categoryId: string) {
  const [row] = await db
    .delete(budget)
    .where(and(eq(budget.userId, sessionUserId), eq(budget.categoryId, categoryId)))
    .returning({ id: budget.id });
  return row ?? null;
}

// Metas do usuário + quanto já gastou na categoria no mês pedido. O gasto é
// sempre derivado (soma dos lançamentos), nunca guardado.
export async function metasComProgresso(
  sessionUserId: string,
  ano: number,
  mes: number,
): Promise<MetaProgresso[]> {
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = mes === 12 ? 1 : mes + 1;
  const inicio = sql`(make_timestamp(${ano}, ${mes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;
  const fim = sql`(make_timestamp(${proxAno}, ${proxMes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;

  const rows = await db
    .select({
      categoryId: budget.categoryId,
      name: category.name,
      icon: category.icon,
      color: category.color,
      limitCents: budget.limitCents,
      gasto: sql<string>`coalesce(sum(${transaction.amountCents}), 0)`,
    })
    .from(budget)
    .innerJoin(category, eq(category.id, budget.categoryId))
    .leftJoin(
      transaction,
      and(
        eq(transaction.categoryId, budget.categoryId),
        eq(transaction.userId, budget.userId),
        isNull(transaction.deletedAt),
        eq(transaction.type, "expense"),
        gte(transaction.occurredAt, inicio),
        lt(transaction.occurredAt, fim),
      ),
    )
    .where(eq(budget.userId, sessionUserId))
    .groupBy(budget.categoryId, category.name, category.icon, category.color, budget.limitCents)
    .orderBy(desc(budget.limitCents));

  return rows.map((r) => ({
    categoryId: r.categoryId,
    name: r.name,
    icon: r.icon,
    color: r.color,
    limitCents: r.limitCents,
    gastoCents: Number(r.gasto),
  }));
}
