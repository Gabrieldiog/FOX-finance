import { afterAll, beforeAll, expect, test } from "vitest";

// Cada login de verdade custa Argon2 + idas ao banco remoto; a suíte faz vários
// em sequência, então o timeout padrão de 5s não serve aqui.
const FOLGA = { timeout: 90_000 };
import { eq, like } from "drizzle-orm";
import { client, db } from "@/db";
import { loginAttempt, rateLimit, user } from "@/db/schema";
import { auth } from "@/lib/auth";

// Teste de integração da trava de força bruta, batendo no banco de verdade
// e passando pelo pipeline real do Better Auth (hooks incluídos).

const EMAIL = "trava-bruta@fox.test";
const SENHA_CERTA = "cavalo-verde-toma-cafe-77";

async function limpar() {
  await db.delete(user).where(eq(user.email, EMAIL));
  await db.delete(loginAttempt).where(eq(loginAttempt.email, EMAIL));
  // zera janelas de rate limit dos endpoints de auth pra reexecuções do teste
  // não esbarrarem no limite por IP no meio do caminho
  await db.delete(rateLimit).where(like(rateLimit.key, "%sign%"));
}

beforeAll(async () => {
  await limpar();
  await auth.api.signUpEmail({ body: { name: "Trava", email: EMAIL, password: SENHA_CERTA } });
});

afterAll(async () => {
  await limpar();
  await client.end();
});

function statusDe(e: unknown): number | string | undefined {
  const err = e as { statusCode?: number; status?: number | string };
  return err.statusCode ?? err.status;
}

test("5 senhas erradas travam a conta por 10 minutos, mesmo com a senha certa depois", FOLGA, async () => {
  for (let i = 0; i < 5; i++) {
    await expect(
      auth.api.signInEmail({ body: { email: EMAIL, password: `senha-errada-${i}` } }),
    ).rejects.toThrow();
  }

  // 6ª tentativa, agora com a senha CERTA: tem que bater na trava (429)
  let travou = false;
  try {
    await auth.api.signInEmail({ body: { email: EMAIL, password: SENHA_CERTA } });
  } catch (e) {
    travou = true;
    const status = statusDe(e);
    expect(status === 429 || status === "TOO_MANY_REQUESTS").toBe(true);
    expect(String((e as Error).message)).toMatch(/tentativa/i);
  }
  expect(travou).toBe(true);
});

test("passado o bloqueio, login certo entra e zera o contador", FOLGA, async () => {
  // encurta o bloqueio na mão pra não esperar 10 minutos de verdade
  await db
    .update(loginAttempt)
    .set({ lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(loginAttempt.email, EMAIL));

  const r = await auth.api.signInEmail({ body: { email: EMAIL, password: SENHA_CERTA } });
  expect(r.user.email).toBe(EMAIL);

  const linhas = await db.select().from(loginAttempt).where(eq(loginAttempt.email, EMAIL));
  expect(linhas).toHaveLength(0);
});

test("senha fraca é barrada no cadastro pelo pipeline real", FOLGA, async () => {
  await expect(
    auth.api.signUpEmail({ body: { name: "Robo", email: "robo-senha@fox.test", password: "12345678" } }),
  ).rejects.toThrow(/mais usadas/);
  // garante que a conta não foi criada
  const criados = await db.select().from(user).where(eq(user.email, "robo-senha@fox.test"));
  expect(criados).toHaveLength(0);
});
