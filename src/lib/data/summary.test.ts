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
