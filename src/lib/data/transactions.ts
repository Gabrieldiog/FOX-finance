import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { transaction } from "@/db/schema";
import { categoryIsUsable } from "./categories";

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
  // A categoria referenciada precisa ser global ou do próprio usuário (anti-IDOR).
  if (input.categoryId && !(await categoryIsUsable(sessionUserId, input.categoryId))) {
    throw new Error("categoria inválida");
  }
  // Campos explícitos, sem spread: o cliente não injeta id/householdId/deletedAt/timestamps.
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
