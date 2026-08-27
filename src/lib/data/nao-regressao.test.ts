import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction, softDeleteTransaction } from "./transactions";
import { resumoDoPeriodo } from "./summary";
import { getCustos, setCustos } from "./custos";

// A promessa central do módulo de ganhos: ele NUNCA muda o caixa do Fox.
// Custo por km é operacional; o saldo é dinheiro real entrando e saindo. São
// dois números diferentes e ambos verdadeiros, e nunca podem se misturar.

const U = "xnaoreg-user";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await db
    .insert(user)
    .values({ id: U, name: "N", email: "xnaoreg@fox.test", emailVerified: true });
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await client.end();
});

test("configurar custos NÃO altera o resumo do Fox", async () => {
  await createTransaction(U, { type: "income", amountCents: 18700, occurredAt: new Date() });
  await createTransaction(U, { type: "expense", amountCents: 6000, occurredAt: new Date() });

  const antes = await resumoDoPeriodo(U, "mes");
  expect(antes.saldo).toBe(12700); // 18700 - 6000, o número real do caixa

  // O módulo novo grava a configuração dele, com custo por km alto de propósito...
  await setCustos(U, {
    fuelPriceCents: 715,
    maintenanceCentsPerKm: 50,
    targetCentsPerHour: 3000,
    vehicleValueCents: 2_000_000,
  });

  // ...e o caixa continua idêntico. Custo por km é operacional, nunca entra aqui.
  const depois = await resumoDoPeriodo(U, "mes");
  expect(depois.entrou).toBe(antes.entrou);
  expect(depois.saiu).toBe(antes.saiu);
  expect(depois.saldo).toBe(antes.saldo);
  expect(depois.saldo).toBe(12700);
});

test("uma transação sem nenhum detalhe do módulo novo continua funcionando", async () => {
  const tx = await createTransaction(U, {
    type: "income",
    amountCents: 5000,
    occurredAt: new Date(),
  });
  expect(tx.id).toBeTruthy();

  const r = await resumoDoPeriodo(U, "mes");
  expect(r.entrou).toBe(23700); // 18700 + 5000
  expect(r.saldo).toBe(17700);
});

test("o soft delete continua valendo com o módulo novo instalado", async () => {
  const tx = await createTransaction(U, {
    type: "expense",
    amountCents: 3300,
    occurredAt: new Date(),
  });
  expect((await resumoDoPeriodo(U, "mes")).saiu).toBe(9300); // 6000 + 3300

  await softDeleteTransaction(U, tx.id);
  expect((await resumoDoPeriodo(U, "mes")).saiu).toBe(6000); // voltou ao que era
});

test("a configuração de custo não vaza para dentro de nenhum agregado do caixa", async () => {
  // Um custo por km absurdo não pode aparecer em lugar nenhum do resumo.
  await setCustos(U, { maintenanceCentsPerKm: 99999 });
  const r = await resumoDoPeriodo(U, "mes");
  expect(r.entrou).toBe(23700);
  expect(r.saiu).toBe(6000);
  expect(r.saldo).toBe(17700);

  // e a configuração continua legível, só que do lado de lá
  expect((await getCustos(U)).maintenanceCentsPerKm).toBe(99999);
});
