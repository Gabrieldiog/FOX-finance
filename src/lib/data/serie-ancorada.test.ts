import { afterAll, beforeAll, expect, test } from "vitest";
import { inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { user } from "@/db/schema";
import { createTransaction } from "./transactions";
import { serieMensal } from "./summary";

// O gráfico de /estatisticas mostrava SEMPRE os últimos 6 meses a partir de
// hoje, ignorando o mês que a pessoa navegou. Dava para ir até fevereiro e o
// gráfico continuar em mar–ago, sem se mexer.

const U = "xserie-user";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await db.insert(user).values({ id: U, name: "S", email: "xserie@fox.test", emailVerified: true });
  // um lançamento em janeiro de 2026, longe do mês corrente
  await createTransaction(U, {
    type: "income",
    amountCents: 12345,
    occurredAt: new Date("2026-01-15T15:00:00.000Z"),
    description: "janeiro",
  });
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [U]));
  await client.end();
});

test("sem âncora, a série termina no mês corrente (comportamento de sempre)", async () => {
  const s = await serieMensal(U, 6);
  const hoje = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  const [ano, mes] = hoje.split("-");
  expect(s[s.length - 1].key).toBe(`${ano}-${mes}`);
  expect(s).toHaveLength(6);
});

test("com âncora, a série termina NO MÊS ANCORADO", async () => {
  const s = await serieMensal(U, 6, { ano: 2026, mes: 2 });
  expect(s[s.length - 1].key).toBe("2026-02");
  expect(s[0].key).toBe("2025-09"); // 6 meses terminando em fev/2026
  expect(s).toHaveLength(6);
});

test("a âncora traz os dados reais daquele período, não zeros", async () => {
  const s = await serieMensal(U, 6, { ano: 2026, mes: 2 });
  const janeiro = s.find((x) => x.key === "2026-01");
  expect(janeiro).toBeDefined();
  expect(janeiro!.entrou).toBe(12345); // o lançamento de janeiro aparece
});

test("navegar para um mês antigo muda a janela inteira", async () => {
  const fev = await serieMensal(U, 6, { ano: 2026, mes: 2 });
  const ago = await serieMensal(U, 6, { ano: 2026, mes: 8 });
  expect(fev[fev.length - 1].key).not.toBe(ago[ago.length - 1].key);
  expect(fev[0].key).not.toBe(ago[0].key);
});
