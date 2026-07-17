import { afterAll, beforeAll, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction, listTransactions } from "./transactions";

// Prova de que entrada maliciosa vira dado literal, nunca SQL executado.
// O Drizzle parametriza tudo — este teste existe pra travar regressão
// (alguém um dia concatenando string em query crua).

const A = "sqlinj-user-a";

beforeAll(async () => {
  await db.delete(user).where(eq(user.id, A));
  await db.insert(user).values({ id: A, name: "A", email: "sqlinj-a@fox.test", emailVerified: true });
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, A));
  await client.end();
});

test("payload clássico de injection é gravado como texto e a tabela sobrevive", async () => {
  const payload = `Robert'); DROP TABLE "transaction";--`;

  await createTransaction(A, {
    type: "expense",
    amountCents: 500,
    occurredAt: new Date(),
    description: payload,
  });

  // se o DROP tivesse executado, esta consulta explodiria
  const lista = await listTransactions(A);
  expect(lista.some((t) => t.description === payload)).toBe(true);
});

test("injection no lugar do userId não vaza dado de ninguém", async () => {
  expect(await listTransactions(`' OR '1'='1`)).toEqual([]);
  expect(await listTransactions(`${A}' OR 1=1 --`)).toEqual([]);
});
