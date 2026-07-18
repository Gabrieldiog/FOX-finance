import "server-only";
import { and, desc, eq, gte, isNull, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";

export type Periodo = "semana" | "mes";

export type Resumo = {
  entrou: number;
  saiu: number;
  saldo: number;
  categorias: { name: string; icon: string; color: string; total: number }[];
};

export async function resumoDoPeriodo(sessionUserId: string, periodo: Periodo): Promise<Resumo> {
  const unit = periodo === "semana" ? "week" : "month";
  // Início do período no fuso de São Paulo (não do calendário UTC).
  const inicio = sql`date_trunc(${unit}, now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'`;

  // Transferência fica fora do "entrou/saiu": é dinheiro andando entre contas próprias.
  const [totais] = await db
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
      ),
    );

  const cats = await db
    .select({
      name: category.name,
      icon: category.icon,
      color: category.color,
      total: sql<string>`coalesce(sum(${transaction.amountCents}), 0)`,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        eq(transaction.type, "expense"),
        gte(transaction.occurredAt, inicio),
      ),
    )
    .groupBy(category.id, category.name, category.icon, category.color)
    .orderBy(desc(sql`coalesce(sum(${transaction.amountCents}), 0)`))
    .limit(5);

  const entrou = Number(totais?.entrou ?? 0);
  const saiu = Number(totais?.saiu ?? 0);
  return {
    entrou,
    saiu,
    saldo: entrou - saiu,
    categorias: cats.map((c) => ({
      name: c.name ?? "Sem categoria",
      icon: c.icon ?? "dots",
      color: c.color ?? "#64748b",
      total: Number(c.total),
    })),
  };
}
