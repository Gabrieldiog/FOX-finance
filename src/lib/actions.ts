"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import {
  createTransaction,
  softDeleteTransaction,
  updateTransaction,
} from "@/lib/data/transactions";

const base = {
  type: z.enum(["expense", "income"]),
  amountCents: z.number().int().positive().max(100_000_000_00), // teto sanitário: R$ 100 mi
  categoryId: z.string().uuid().nullish(),
  description: z.string().trim().max(200).optional(),
};

const criarSchema = z.object(base);
const editarSchema = z.object({ id: z.string().uuid(), ...base });

async function sessaoUserId() {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user.id ?? null;
}

export async function criarLancamento(raw: unknown) {
  // O userId vem SEMPRE da sessão no servidor, nunca do cliente.
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };

  const parsed = criarSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };

  try {
    await createTransaction(userId, {
      type: parsed.data.type,
      amountCents: parsed.data.amountCents,
      occurredAt: new Date(),
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description || null,
    });
  } catch {
    return { ok: false as const, erro: "Não foi possível salvar." };
  }

  revalidatePath("/");
  return { ok: true as const };
}

export async function editarLancamento(raw: unknown) {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };

  const parsed = editarSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };

  try {
    const r = await updateTransaction(userId, parsed.data.id, {
      type: parsed.data.type,
      amountCents: parsed.data.amountCents,
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description || null,
    });
    if (!r) return { ok: false as const, erro: "Lançamento não encontrado." };
  } catch {
    return { ok: false as const, erro: "Não foi possível salvar." };
  }

  revalidatePath("/");
  return { ok: true as const };
}

export async function excluirLancamento(id: string) {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false as const, erro: "Inválido." };
  }

  const r = await softDeleteTransaction(userId, id);
  if (!r) return { ok: false as const, erro: "Lançamento não encontrado." };

  revalidatePath("/");
  return { ok: true as const };
}

// LGPD (art. 18): exclusão real. A cascata apaga transações, sessões, contas
// de autenticação e categorias do usuário.
export async function excluirConta() {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };
  await db.delete(user).where(eq(user.id, userId));
  return { ok: true as const };
}
