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

/**
 * Se a conta está travada, retorna até quando. Senão, null.
 *
 * Roda dentro do hook `before` do login, antes de qualquer verificação. Se ela
 * lançar, o endpoint inteiro devolve 500 e ninguém entra — então o banco fora
 * derrubava o login por completo, e a tela ainda acusava a senha da pessoa.
 * Aqui a falha de leitura vira "não está travado": o caminho normal segue e o
 * erro aparece onde deve, na verificação de credencial.
 */
export async function bloqueadoAte(email: string): Promise<Date | null> {
  try {
    const [row] = await db
      .select({ lockedUntil: loginAttempt.lockedUntil })
      .from(loginAttempt)
      .where(eq(loginAttempt.email, email));
    if (row?.lockedUntil && row.lockedUntil.getTime() > Date.now()) return row.lockedUntil;
  } catch {
    // Banco indisponível não é motivo para trancar ninguém — nem para dar 500.
  }
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
