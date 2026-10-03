import { afterAll, beforeAll, expect, test } from "vitest";
import { eq } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction } from "./transactions";
import { resumoDoPeriodo } from "./summary";

const U = "summary-user";

beforeAll(async () => {
  await db.delete(user).where(eq(user.id, U));
  await db.insert(user).values({ id: U, name: "S", email: "summary@fox.test", emailVerified: true });
});

afterAll(async () => {
  await db.delete(user).where(eq(user.id, U));
  await client.end();
});

test("o resumo soma entrou, saiu e saldo do período", async () => {
  await createTransaction(U, { type: "income", amountCents: 300000, occurredAt: new Date() });
  await createTransaction(U, { type: "expense", amountCents: 50000, occurredAt: new Date() });
  await createTransaction(U, { type: "expense", amountCents: 20000, occurredAt: new Date() });

  const r = await resumoDoPeriodo(U, "mes");
  expect(r.entrou).toBe(300000);
  expect(r.saiu).toBe(70000);
  expect(r.saldo).toBe(230000);
});

test("o total soma desde o primeiro lançamento, o mês só o mês corrente", async () => {
  const T = "summary-total-user";
  await db.delete(user).where(eq(user.id, T));
  await db.insert(user).values({ id: T, name: "T", email: "summary-total@fox.test", emailVerified: true });
  await createTransaction(T, { type: "income", amountCents: 100000, occurredAt: new Date(Date.now() - 40 * 86_400_000) });
  await createTransaction(T, { type: "expense", amountCents: 30000, occurredAt: new Date() });

  expect(await resumoDoPeriodo(T, "mes")).toMatchObject({ entrou: 0, saiu: 30000, saldo: -30000 });
  expect(await resumoDoPeriodo(T, "total")).toMatchObject({ entrou: 100000, saiu: 30000, saldo: 70000 });
  await db.delete(user).where(eq(user.id, T));
});
