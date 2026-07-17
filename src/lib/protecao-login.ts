import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempt } from "@/db/schema";

// Trava de força bruta por CONTA (o rate limit por IP fica no Better Auth):
// 5 senhas erradas seguidas bloqueiam o login por 10 minutos, mesmo que cada
// tentativa venha de um IP diferente. Login certo zera tudo.

const LIMITE_DE_ERROS = 5;
const BLOQUEIO_MS = 10 * 60 * 1000;

export function normalizarEmail(email: unknown): string | null {
  if (typeof email !== "string") return null;
  const e = email.toLowerCase().trim();
  return e.includes("@") ? e : null;
}

/** Se a conta está travada, retorna até quando. Senão, null. */
export async function bloqueadoAte(email: string): Promise<Date | null> {
  const [row] = await db
    .select({ lockedUntil: loginAttempt.lockedUntil })
    .from(loginAttempt)
    .where(eq(loginAttempt.email, email));
  if (row?.lockedUntil && row.lockedUntil.getTime() > Date.now()) return row.lockedUntil;
  return null;
}

/** Conta mais um erro de senha; no 5º, trava a conta por 10 minutos. */
export async function registrarErroDeSenha(email: string): Promise<void> {
  const [row] = await db
    .insert(loginAttempt)
    .values({ email, failures: 1, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: loginAttempt.email,
      set: { failures: sql`${loginAttempt.failures} + 1`, updatedAt: new Date() },
    })
    .returning({ failures: loginAttempt.failures });

  if ((row?.failures ?? 0) >= LIMITE_DE_ERROS) {
    await db
      .update(loginAttempt)
      .set({ failures: 0, lockedUntil: new Date(Date.now() + BLOQUEIO_MS), updatedAt: new Date() })
      .where(eq(loginAttempt.email, email));
  }
}

/** Login certo: apaga o histórico de erros da conta. */
export async function limparErrosDeSenha(email: string): Promise<void> {
  await db.delete(loginAttempt).where(eq(loginAttempt.email, email));
}
