import { afterAll, beforeAll, expect, test } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { budget, category, user } from "@/db/schema";
import { createTransaction } from "./transactions";
import { deleteBudget, metasComProgresso, setBudget } from "./budgets";

const A = "xmeta-user-a";
const B = "xmeta-user-b";

const partes = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
}).formatToParts(new Date());
const curAno = Number(partes.find((p) => p.type === "year")!.value);
const curMes = Number(partes.find((p) => p.type === "month")!.value);
function dia15(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes - 1, 15, 12, 0, 0));
}

let catA: string;

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xmeta-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xmeta-b@fox.test", emailVerified: true },
  ]);
  const [c] = await db
    .insert(category)
    .values({ userId: A, name: "Mercado", type: "expense", icon: "cart", color: "#f59e0b" })
    .returning();
  catA = c.id;
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("setBudget faz upsert: uma meta por categoria (redefine, não duplica)", async () => {
  await setBudget(A, catA, 60000);
  await setBudget(A, catA, 80000);
  const linhas = await db.select().from(budget).where(eq(budget.userId, A));
  expect(linhas).toHaveLength(1);
  expect(linhas[0].limitCents).toBe(80000);
});

test("metasComProgresso soma o gasto do mês da categoria", async () => {
  await createTransaction(A, { type: "expense", amountCents: 20000, occurredAt: dia15(curAno, curMes), categoryId: catA });
  await createTransaction(A, { type: "expense", amountCents: 5000, occurredAt: dia15(curAno, curMes), categoryId: catA });

  const metas = await metasComProgresso(A, curAno, curMes);
  const m = metas.find((x) => x.categoryId === catA)!;
  expect(m.limitCents).toBe(80000);
  expect(m.gastoCents).toBe(25000);

  // B não tem meta nenhuma.
  expect(await metasComProgresso(B, curAno, curMes)).toHaveLength(0);
});

test("deleteBudget só remove a meta do próprio dono", async () => {
  expect(await deleteBudget(B, catA)).toBeNull(); // B não tem meta nessa categoria
  expect(await db.select().from(budget).where(eq(budget.userId, A))).toHaveLength(1);
  expect(await deleteBudget(A, catA)).not.toBeNull();
  expect(await db.select().from(budget).where(eq(budget.userId, A))).toHaveLength(0);
});
