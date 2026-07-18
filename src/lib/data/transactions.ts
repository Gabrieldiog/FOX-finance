import "server-only";
import { and, desc, eq, ilike, isNull, or, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";
import { categoryIsUsable } from "./categories";

// Uma linha da lista de lançamentos (com a categoria já resolvida). Compartilhada
// entre o dashboard, o histórico e o <ItemLancamento>.
export type LancamentoLista = {
  id: string;
  type: string;
  amountCents: number;
  occurredAt: Date;
  paymentMethod: string | null;
  description: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

export type NovaTransacao = {
  type: "expense" | "income" | "transfer";
  amountCents: number;
  occurredAt: Date;
  categoryId?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
};

// REGRA DE OURO: sessionUserId vem SEMPRE da sessão no servidor, nunca de
// req/body/param. Toda leitura e escrita é escopada por ele; dado de outro
// usuário responde null/vazio (que vira 404 na rota).

export async function listTransactions(sessionUserId: string) {
  return db
    .select()
    .from(transaction)
    .where(and(eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)))
    .orderBy(desc(transaction.occurredAt));
}

export async function listRecentTransactions(sessionUserId: string, limit = 20) {
  return db
    .select({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredAt: transaction.occurredAt,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(and(eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)))
    .orderBy(desc(transaction.occurredAt))
    .limit(limit);
}

// Busca no histórico: filtra por texto (descrição ou nome da categoria) e por
// tipo, sempre escopado ao dono. Traz limit+1 linhas pra a página saber se há
// mais a mostrar.
export async function searchTransactions(
  sessionUserId: string,
  opts: { q?: string; tipo?: "expense" | "income"; limit?: number },
): Promise<LancamentoLista[]> {
  const limite = Math.min(Math.max(opts.limit ?? 30, 1), 300);
  const conds: SQL[] = [eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)];
  if (opts.tipo) conds.push(eq(transaction.type, opts.tipo));
  const termo = opts.q?.trim();
  if (termo) {
    const like = `%${termo}%`;
    conds.push(or(ilike(transaction.description, like), ilike(category.name, like))!);
  }
  return db
    .select({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredAt: transaction.occurredAt,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(and(...conds))
    .orderBy(desc(transaction.occurredAt))
    .limit(limite + 1);
}

export async function getTransaction(sessionUserId: string, id: string) {
  const [row] = await db
    .select()
    .from(transaction)
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createTransaction(sessionUserId: string, input: NovaTransacao) {
  if (input.categoryId && !(await categoryIsUsable(sessionUserId, input.categoryId))) {
    throw new Error("categoria inválida");
  }
  const [row] = await db
    .insert(transaction)
    .values({
      userId: sessionUserId,
      type: input.type,
      amountCents: input.amountCents,
      occurredAt: input.occurredAt,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      paymentMethod: input.paymentMethod ?? null,
    })
    .returning();
  return row;
}

export async function updateTransaction(
  sessionUserId: string,
  id: string,
  input: Pick<
    NovaTransacao,
    "type" | "amountCents" | "categoryId" | "description" | "occurredAt" | "paymentMethod"
  >,
) {
  if (input.categoryId && !(await categoryIsUsable(sessionUserId, input.categoryId))) {
    throw new Error("categoria inválida");
  }
  const [row] = await db
    .update(transaction)
    .set({
      type: input.type,
      amountCents: input.amountCents,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      occurredAt: input.occurredAt,
      paymentMethod: input.paymentMethod ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function softDeleteTransaction(sessionUserId: string, id: string) {
  const [row] = await db
    .update(transaction)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}
