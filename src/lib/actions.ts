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
import {
  countUserCategories,
  createCategory,
  deleteCategory,
} from "@/lib/data/categories";
import {
  corValida,
  formaPagamentoValida,
  iconeValido,
  MAX_CATEGORIAS_USUARIO,
} from "@/lib/categorias";

const base = {
  type: z.enum(["expense", "income"]),
  amountCents: z.number().int().positive().max(100_000_000_00), // teto sanitário: R$ 100 mi
  categoryId: z.string().uuid().nullish(),
  description: z.string().trim().max(200).optional(),
  // Data do lançamento: opcional (default = agora). Recusa datas absurdas —
  // nada antes de 2000 nem mais de ~36h no futuro (folga de fuso).
  occurredAt: z.coerce
    .date()
    .refine(
      (d) =>
        d.getTime() >= new Date("2000-01-01").getTime() &&
        d.getTime() <= Date.now() + 36 * 60 * 60 * 1000,
      "Data fora do intervalo.",
    )
    .optional(),
  // Forma de pagamento: opcional, só ids do catálogo fechado.
  paymentMethod: z.string().refine(formaPagamentoValida, "Forma de pagamento inválida.").nullish(),
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
      occurredAt: parsed.data.occurredAt ?? new Date(),
      categoryId: parsed.data.categoryId ?? null,
      description: parsed.data.description || null,
      paymentMethod: parsed.data.paymentMethod ?? null,
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
      occurredAt: parsed.data.occurredAt ?? new Date(),
      paymentMethod: parsed.data.paymentMethod ?? null,
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

const criarCategoriaSchema = z.object({
  name: z.string().trim().min(1).max(24),
  type: z.enum(["expense", "income"]),
  // Ícone e cor só valem se estiverem no catálogo fechado (nada de SVG/hex solto).
  icon: z.string().refine(iconeValido, "Ícone inválido."),
  color: z.string().refine(corValida, "Cor inválida."),
});

export async function criarCategoria(raw: unknown) {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };

  const parsed = criarCategoriaSchema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };

  const total = await countUserCategories(userId);
  if (total >= MAX_CATEGORIAS_USUARIO) {
    return {
      ok: false as const,
      erro: `Você já tem ${MAX_CATEGORIAS_USUARIO} categorias. Apague alguma antes.`,
    };
  }

  try {
    const row = await createCategory(userId, parsed.data);
    revalidatePath("/");
    revalidatePath("/novo");
    revalidatePath("/conta");
    return {
      ok: true as const,
      categoria: {
        id: row.id,
        name: row.name,
        type: row.type as "expense" | "income",
        icon: row.icon,
        color: row.color,
      },
    };
  } catch {
    return { ok: false as const, erro: "Não foi possível criar a categoria." };
  }
}

export async function excluirCategoria(id: string) {
  const userId = await sessaoUserId();
  if (!userId) return { ok: false as const, erro: "Não autenticado." };
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false as const, erro: "Inválido." };
  }

  const r = await deleteCategory(userId, id);
  if (!r) return { ok: false as const, erro: "Categoria não encontrada." };

  revalidatePath("/");
  revalidatePath("/novo");
  revalidatePath("/conta");
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
