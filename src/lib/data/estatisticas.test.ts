import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { category, user } from "@/db/schema";
import { createTransaction } from "./transactions";
import { detalheMes, serieMensal } from "./summary";

const A = "xstat-user-a";
const B = "xstat-user-b";

// Ano/mês corrente em São Paulo (igual ao que as funções usam).
const partes = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
}).formatToParts(new Date());
const curAno = Number(partes.find((p) => p.type === "year")!.value);
const curMes = Number(partes.find((p) => p.type === "month")!.value);
const mesAnterior = new Date(Date.UTC(curAno, curMes - 2, 1));
const antAno = mesAnterior.getUTCFullYear();
const antMes = mesAnterior.getUTCMonth() + 1;

// Dia 15 ao meio-dia UTC (09h em SP): fica no mesmo mês em qualquer fuso razoável.
function dia15(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes - 1, 15, 12, 0, 0));
}

let catMercado: string;
let catSalario: string;

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xstat-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xstat-b@fox.test", emailVerified: true },
  ]);
  const [m] = await db
    .insert(category)
    .values({ userId: A, name: "Mercado", type: "expense", icon: "cart", color: "#f59e0b" })
    .returning();
  const [s] = await db
    .insert(category)
    .values({ userId: A, name: "Salário", type: "income", icon: "salary", color: "#22c55e" })
    .returning();
  catMercado = m.id;
  catSalario = s.id;

  // Mês atual de A: entrou 10000, saiu 4500 (3000 Mercado + 1500 sem categoria).
  await createTransaction(A, { type: "income", amountCents: 10000, occurredAt: dia15(curAno, curMes), categoryId: catSalario });
  await createTransaction(A, { type: "expense", amountCents: 3000, occurredAt: dia15(curAno, curMes), categoryId: catMercado });
  await createTransaction(A, { type: "expense", amountCents: 1500, occurredAt: dia15(curAno, curMes) });
  // Mês anterior de A: saiu 4000.
  await createTransaction(A, { type: "expense", amountCents: 4000, occurredAt: dia15(antAno, antMes) });
  // B no mês atual: não pode contaminar A.
  await createTransaction(B, { type: "expense", amountCents: 99999, occurredAt: dia15(curAno, curMes) });
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("serieMensal traz os últimos 6 meses com zero-fill e só do dono", async () => {
  const serie = await serieMensal(A, 6);
  expect(serie).toHaveLength(6);

  const atual = serie[serie.length - 1];
  expect(atual.ano).toBe(curAno);
  expect(atual.mes).toBe(curMes);
  expect(atual.entrou).toBe(10000);
  expect(atual.saiu).toBe(4500); // não inclui os 99999 de B

  const anterior = serie.find((s) => s.ano === antAno && s.mes === antMes)!;
  expect(anterior.saiu).toBe(4000);
  expect(anterior.entrou).toBe(0); // zero-fill onde não houve receita
});

test("detalheMes separa onde mais gastou e onde mais ganhou", async () => {
  const d = await detalheMes(A, curAno, curMes);
  expect(d.entrou).toBe(10000);
  expect(d.saiu).toBe(4500);
  expect(d.saldo).toBe(5500);

  expect(d.gastos[0]).toMatchObject({ name: "Mercado", total: 3000 });
  expect(d.gastos.some((g) => g.name === "Sem categoria" && g.total === 1500)).toBe(true);
  expect(d.ganhos[0]).toMatchObject({ name: "Salário", total: 10000 });
});
