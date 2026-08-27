import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction, softDeleteTransaction } from "./transactions";
import { getMetas, janelaDoMes, movimentoDoMes, setMetas } from "./metas-mes";

const A = "xmetames-a";
const B = "xmetames-b";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xmetames-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xmetames-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("quem nunca definiu meta recebe zeros, sem linha no banco", async () => {
  const m = await getMetas(A);
  expect(m.spendLimitCents).toBe(0);
  expect(m.saveTargetCents).toBe(0);
});

test("salvar cria; salvar de novo atualiza, não duplica", async () => {
  await setMetas(A, { spendLimitCents: 200000, saveTargetCents: 100000 });
  expect((await getMetas(A)).spendLimitCents).toBe(200000);

  await setMetas(A, { spendLimitCents: 250000, saveTargetCents: 120000 });
  const m = await getMetas(A);
  expect(m.spendLimitCents).toBe(250000);
  expect(m.saveTargetCents).toBe(120000);
});

test("uma conta não enxerga nem sobrescreve a meta da outra", async () => {
  await setMetas(A, { spendLimitCents: 999900, saveTargetCents: 111100 });
  expect((await getMetas(B)).spendLimitCents).toBe(0);

  await setMetas(B, { spendLimitCents: 50000, saveTargetCents: 10000 });
  expect((await getMetas(A)).spendLimitCents).toBe(999900);
  expect((await getMetas(B)).spendLimitCents).toBe(50000);
});

test("o banco recusa meta negativa", async () => {
  await expect(setMetas(A, { spendLimitCents: -1, saveTargetCents: 0 })).rejects.toThrow();
});

test("movimentoDoMes soma só o mês pedido, do dono, sem soft delete", async () => {
  await createTransaction(A, {
    type: "income",
    amountCents: 300000,
    occurredAt: new Date("2026-04-10T15:00:00.000Z"),
  });
  await createTransaction(A, {
    type: "expense",
    amountCents: 120000,
    occurredAt: new Date("2026-04-20T15:00:00.000Z"),
  });
  // outro mês: não pode entrar
  await createTransaction(A, {
    type: "expense",
    amountCents: 999900,
    occurredAt: new Date("2026-05-05T15:00:00.000Z"),
  });
  // de outra pessoa: não pode entrar
  await createTransaction(B, {
    type: "income",
    amountCents: 777700,
    occurredAt: new Date("2026-04-15T15:00:00.000Z"),
  });

  const m = await movimentoDoMes(A, 2026, 4);
  expect(m.entrouCents).toBe(300000);
  expect(m.saiuCents).toBe(120000);

  // apagar tira da conta
  const apagavel = await createTransaction(A, {
    type: "expense",
    amountCents: 50000,
    occurredAt: new Date("2026-04-25T15:00:00.000Z"),
  });
  expect((await movimentoDoMes(A, 2026, 4)).saiuCents).toBe(170000);
  await softDeleteTransaction(A, apagavel.id);
  expect((await movimentoDoMes(A, 2026, 4)).saiuCents).toBe(120000);
});

test("transferência não entra na conta das metas", async () => {
  await createTransaction(A, {
    type: "transfer",
    amountCents: 500000,
    occurredAt: new Date("2026-04-11T15:00:00.000Z"),
  });
  const m = await movimentoDoMes(A, 2026, 4);
  expect(m.entrouCents).toBe(300000);
  expect(m.saiuCents).toBe(120000);
});

test("janelaDoMes: mês corrente usa o dia de hoje; mês passado conta como fechado", () => {
  const hoje = { ano: 2026, mes: 8, dia: 12 };
  expect(janelaDoMes(2026, 8, hoje)).toEqual({ diaDoMes: 12, diasNoMes: 31 });
  // abril tem 30 dias e já passou: fechado
  expect(janelaDoMes(2026, 4, hoje)).toEqual({ diaDoMes: 30, diasNoMes: 30 });
  // fevereiro de 2026 tem 28
  expect(janelaDoMes(2026, 2, hoje)).toEqual({ diaDoMes: 28, diasNoMes: 28 });
  // ano bissexto
  expect(janelaDoMes(2028, 2, hoje).diasNoMes).toBe(29);
});
