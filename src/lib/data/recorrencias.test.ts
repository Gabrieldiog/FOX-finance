import { afterAll, beforeAll, expect, test } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { recurring, transaction, user } from "@/db/schema";
import { softDeleteTransaction } from "./transactions";
import {
  createRecurring,
  deleteRecurring,
  materializarRecorrencias,
  setRecurringActive,
} from "./recorrencias";

const A = "xrec-user-a";
const B = "xrec-user-b";

const partes = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Sao_Paulo",
  year: "numeric",
  month: "2-digit",
}).formatToParts(new Date());
const curAno = Number(partes.find((p) => p.type === "year")!.value);
const curMes = Number(partes.find((p) => p.type === "month")!.value);

const pad = (n: number) => String(n).padStart(2, "0");
function ymMenos(n: number) {
  const d = new Date(Date.UTC(curAno, curMes - 1 - n, 1));
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
}
const ymStr = (y: number, m: number) => `${y}-${pad(m)}`;
const ultimoDia = (ano: number, mes: number) => new Date(Date.UTC(ano, mes, 0)).getUTCDate();
const diaSP = (dt: Date) =>
  Number(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", day: "2-digit" }).format(dt));

async function txsDaRegra(userId: string, ruleId: string) {
  return db
    .select()
    .from(transaction)
    .where(and(eq(transaction.userId, userId), eq(transaction.recurringId, ruleId)));
}

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xrec-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xrec-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("materializar faz backfill desde start_ym e é idempotente", async () => {
  const s = ymMenos(2);
  const regra = await createRecurring(A, {
    type: "income",
    amountCents: 100000,
    dayOfMonth: 1, // dia 1 sempre já passou
    startYm: ymStr(s.ano, s.mes),
  });

  expect(await materializarRecorrencias(A)).toBe(3); // -2, -1, mês atual
  expect(await txsDaRegra(A, regra.id)).toHaveLength(3);

  // Rodar de novo não duplica.
  expect(await materializarRecorrencias(A)).toBe(0);
  expect(await txsDaRegra(A, regra.id)).toHaveLength(3);

  await deleteRecurring(A, regra.id);
});

test("ocorrência apagada não volta na próxima materialização", async () => {
  const s = ymMenos(1);
  const regra = await createRecurring(A, {
    type: "expense",
    amountCents: 4990,
    dayOfMonth: 1,
    startYm: ymStr(s.ano, s.mes),
  });
  await materializarRecorrencias(A);
  const geradas = await txsDaRegra(A, regra.id);
  expect(geradas.length).toBeGreaterThanOrEqual(1);

  // Ela apaga a ocorrência de um mês (soft delete).
  await softDeleteTransaction(A, geradas[0].id);
  // Materializar de novo NÃO recria aquela (o existeOcorrencia conta soft-deleted).
  expect(await materializarRecorrencias(A)).toBe(0);

  await deleteRecurring(A, regra.id);
});

test("dia 31 é limitado ao último dia do mês (fev não vira 31)", async () => {
  const s = ymMenos(2);
  const regra = await createRecurring(A, {
    type: "expense",
    amountCents: 5000,
    dayOfMonth: 31,
    startYm: ymStr(s.ano, s.mes),
  });
  await materializarRecorrencias(A);

  const geradas = (await txsDaRegra(A, regra.id)).sort(
    (a, b) => a.occurredAt.getTime() - b.occurredAt.getTime(),
  );
  const primeira = geradas[0]; // ocorrência do mês -2 (já fechado)
  expect(diaSP(primeira.occurredAt)).toBe(Math.min(31, ultimoDia(s.ano, s.mes)));

  await deleteRecurring(A, regra.id);
});

test("o banco barra ocorrência duplicada do mesmo molde/mês (UNIQUE)", async () => {
  const s = ymMenos(0);
  const regra = await createRecurring(A, {
    type: "income",
    amountCents: 100,
    dayOfMonth: 1,
    startYm: ymStr(s.ano, s.mes),
  });
  const ym = ymStr(curAno, curMes);
  const linha = {
    userId: A,
    type: "income",
    amountCents: 100,
    occurredAt: new Date(),
    recurringId: regra.id,
    occurrenceYm: ym,
  };
  await db.insert(transaction).values(linha);
  // Segunda inserção idêntica (simula corrida): o UNIQUE do banco rejeita.
  await expect(db.insert(transaction).values(linha)).rejects.toThrow();

  await deleteRecurring(A, regra.id);
});

test("recorrência antiga (start > 3 anos) ainda gera o mês atual", async () => {
  const antiga = ymMenos(40); // 40 meses atrás
  const regra = await createRecurring(A, {
    type: "expense",
    amountCents: 1000,
    dayOfMonth: 1,
    startYm: ymStr(antiga.ano, antiga.mes),
  });
  // Varre só a janela de 12 meses — e o mês atual entra (bug antigo: parava aos 36).
  expect(await materializarRecorrencias(A)).toBe(12);
  expect(await txsDaRegra(A, regra.id)).toHaveLength(12);

  await deleteRecurring(A, regra.id);
});

test("um usuário não pausa nem apaga a recorrência do outro", async () => {
  const s = ymMenos(0);
  const regra = await createRecurring(A, {
    type: "income",
    amountCents: 100,
    dayOfMonth: 15,
    startYm: ymStr(s.ano, s.mes),
  });

  expect(await setRecurringActive(B, regra.id, false)).toBeNull();
  expect(await deleteRecurring(B, regra.id)).toBeNull();
  expect(await db.select().from(recurring).where(eq(recurring.id, regra.id))).toHaveLength(1);
  expect(await deleteRecurring(A, regra.id)).not.toBeNull();
});
