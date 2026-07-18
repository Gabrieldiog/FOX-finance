import { afterAll, beforeAll, expect, test } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { category, user } from "@/db/schema";
import {
  createTransaction,
  getTransaction,
  listTransactions,
  softDeleteTransaction,
  updateTransaction,
} from "./transactions";

const A = "xtenant-user-a";
const B = "xtenant-user-b";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xtenant-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xtenant-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("um usuário não enxerga (nem apaga) a transação do outro", async () => {
  const bTx = await createTransaction(B, {
    type: "expense",
    amountCents: 4590,
    occurredAt: new Date(),
  });

  expect(await getTransaction(A, bTx.id)).toBeNull();

  const listaA = await listTransactions(A);
  expect(listaA.some((t) => t.id === bTx.id)).toBe(false);

  expect(await softDeleteTransaction(A, bTx.id)).toBeNull();

  // A não consegue editar a transação de B
  expect(
    await updateTransaction(A, bTx.id, {
      type: "expense",
      amountCents: 1,
      categoryId: null,
      description: null,
      occurredAt: new Date(),
      paymentMethod: null,
    }),
  ).toBeNull();

  // B continua enxergando a própria
  expect(await getTransaction(B, bTx.id)).not.toBeNull();
});

test("A não consegue anexar a categoria privada de B, mas a global é aceita", async () => {
  const [catB] = await db
    .insert(category)
    .values({ userId: B, name: "Privada de B", type: "expense", icon: "x", color: "#000000" })
    .returning();
  const [catGlobal] = await db
    .insert(category)
    .values({ userId: null, name: "Global", type: "expense", icon: "g", color: "#111111" })
    .returning();

  await expect(
    createTransaction(A, {
      type: "expense",
      amountCents: 100,
      occurredAt: new Date(),
      categoryId: catB.id,
    }),
  ).rejects.toThrow();

  const ok = await createTransaction(A, {
    type: "expense",
    amountCents: 100,
    occurredAt: new Date(),
    categoryId: catGlobal.id,
  });
  expect(ok.categoryId).toBe(catGlobal.id);

  // limpa a categoria global (a de B some junto com B no afterAll)
  await db.delete(category).where(eq(category.id, catGlobal.id));
});

test("createTransaction guarda occurredAt e paymentMethod; update troca os dois", async () => {
  const quando = new Date("2026-05-10T15:00:00.000Z");
  const tx = await createTransaction(A, {
    type: "expense",
    amountCents: 1234,
    occurredAt: quando,
    paymentMethod: "pix",
  });
  expect(tx.paymentMethod).toBe("pix");
  expect(tx.occurredAt.getTime()).toBe(quando.getTime());

  const depois = new Date("2026-05-11T15:00:00.000Z");
  const atual = await updateTransaction(A, tx.id, {
    type: "expense",
    amountCents: 1234,
    categoryId: null,
    description: null,
    occurredAt: depois,
    paymentMethod: "dinheiro",
  });
  expect(atual?.paymentMethod).toBe("dinheiro");
  expect(atual?.occurredAt.getTime()).toBe(depois.getTime());
});

test("mass assignment: campos extras do input são ignorados", async () => {
  const malicioso = {
    type: "expense",
    amountCents: 100,
    occurredAt: new Date(),
    id: "hackeado",
    userId: B,
    deletedAt: new Date(),
    householdId: "plantado",
  } as unknown as Parameters<typeof createTransaction>[1];

  const tx = await createTransaction(A, malicioso);
  expect(tx.userId).toBe(A); // não sobrescrito pelo userId:B do input
  expect(tx.id).not.toBe("hackeado");
  expect(tx.deletedAt).toBeNull(); // não nasce pré-apagado
  expect(tx.householdId).toBeNull();
});
