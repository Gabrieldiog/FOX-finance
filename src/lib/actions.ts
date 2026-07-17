"use server";

import { z } from "zod";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { createTransaction } from "@/lib/data/transactions";

const schema = z.object({
  type: z.enum(["expense", "income"]),
  amountCents: z.number().int().positive().max(100_000_000_00), // teto sanitário: R$ 100 mi
  categoryId: z.string().uuid().nullish(),
  description: z.string().trim().max(200).optional(),
});

export async function criarLancamento(raw: unknown) {
  // O userId vem SEMPRE da sessão no servidor, nunca do cliente.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return { ok: false as const, erro: "Não autenticado." };

  const parsed = schema.safeParse(raw);
  if (!parsed.success) return { ok: false as const, erro: "Dados inválidos." };

  try {
    await createTransaction(session.user.id, {
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
