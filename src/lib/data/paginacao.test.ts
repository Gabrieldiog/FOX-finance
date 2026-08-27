import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction, searchTransactions } from "./transactions";

// O histórico precisa ter fim alcançável. Antes, a paginação era por LIMIT
// crescente grampeado em 300: ao chegar lá, o "Ver mais" continuava aparecendo
// e apontava para o mesmo lugar — o passado além de 300 lançamentos ficava
// inacessível pela tela.

const U = "xpag-user";
const TOTAL = 70; // suficiente para várias páginas de 30

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await db.insert(user).values({ id: U, name: "P", email: "xpag@fox.test", emailVerified: true });

  // Metade com o MESMO instante, de propósito: é assim que
  // materializarRecorrencias grava (sempre 15:00Z), e é o caso que quebra
  // paginação sem desempate.
  const mesmoInstante = new Date("2026-03-10T15:00:00.000Z");
  for (let i = 0; i < TOTAL; i++) {
    await createTransaction(U, {
      type: "expense",
      amountCents: 100 + i,
      occurredAt: i % 2 === 0 ? mesmoInstante : new Date(2026, 0, 1 + i, 12),
      description: `lancamento ${String(i).padStart(3, "0")}`,
    });
  }
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await client.end();
});

test("paginar do começo ao fim alcança TODOS os lançamentos, sem repetir nenhum", async () => {
  const vistos = new Set<string>();
  let cursor: { occurredAt: Date; id: string } | undefined;
  let paginas = 0;

  while (paginas < 20) {
    const linhas = await searchTransactions(U, { limit: 30, antes: cursor });
    if (linhas.length === 0) break;
    paginas++;
    for (const l of linhas.slice(0, 30)) {
      // repetir uma linha entre páginas é o defeito clássico de paginação sem
      // desempate; aqui isso falha o teste
      expect(vistos.has(l.id)).toBe(false);
      vistos.add(l.id);
    }
    if (linhas.length <= 30) break;
    const ultimo = linhas[29];
    cursor = { occurredAt: ultimo.occurredAt, id: ultimo.id };
  }

  expect(vistos.size).toBe(TOTAL);
  expect(paginas).toBeGreaterThan(1); // realmente paginou
});

test("a ordem é decrescente e estável mesmo com datas idênticas", async () => {
  const p1 = await searchTransactions(U, { limit: 30 });
  const chaves = p1.slice(0, 30).map((l) => `${l.occurredAt.getTime()}|${l.id}`);
  const ordenado = [...chaves].sort().reverse();
  expect(chaves).toEqual(ordenado);
});

test("o cursor não vaza dados de outro usuário", async () => {
  const O = "xpag-outro";
  await db.delete(user).where(inArray(user.id, [O]));
  await db.insert(user).values({ id: O, name: "O", email: "xpag-o@fox.test", emailVerified: true });
  await createTransaction(O, {
    type: "income",
    amountCents: 9999,
    occurredAt: new Date("2026-03-10T15:00:00.000Z"),
    description: "dinheiro do outro",
  });

  const todas = await searchTransactions(U, { limit: 300 });
  expect(todas.some((l) => l.description === "dinheiro do outro")).toBe(false);

  await db.delete(user).where(inArray(user.id, [O]));
});

test("a busca por texto continua funcionando junto com o cursor", async () => {
  const achadas = await searchTransactions(U, { q: "lancamento 00", limit: 30 });
  expect(achadas.length).toBeGreaterThan(0);
  expect(achadas.every((l) => l.description?.includes("lancamento 00"))).toBe(true);
});
