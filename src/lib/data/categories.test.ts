import { afterAll, beforeAll, expect, test } from "vitest";
import { eq, inArray } from "drizzle-orm";
import { client, db } from "@/db";
import { category, user } from "@/db/schema";
import {
  countUserCategories,
  createCategory,
  deleteCategory,
} from "./categories";
import { corValida, formaPagamentoValida, iconeValido } from "@/lib/categorias";

const A = "xcat-user-a";
const B = "xcat-user-b";

beforeAll(async () => {
  await db.delete(user).where(inArray(user.id, [A, B]));
  await db.insert(user).values([
    { id: A, name: "A", email: "xcat-a@fox.test", emailVerified: true },
    { id: B, name: "B", email: "xcat-b@fox.test", emailVerified: true },
  ]);
});

afterAll(async () => {
  // As categorias de A e B somem por cascata; limpa uma global de teste à parte.
  await db.delete(user).where(inArray(user.id, [A, B]));
  await client.end();
});

test("createCategory grava sempre com o dono da sessão", async () => {
  const cat = await createCategory(A, {
    name: "Assinaturas",
    type: "expense",
    icon: "bill",
    color: "#14b8a6",
  });
  expect(cat.userId).toBe(A);
  expect(cat.name).toBe("Assinaturas");
});

test("deleteCategory não apaga a de outro dono nem a global; apaga a própria", async () => {
  const catB = await createCategory(B, {
    name: "Privada de B",
    type: "expense",
    icon: "cart",
    color: "#ef4444",
  });
  const [global] = await db
    .insert(category)
    .values({ userId: null, name: "Global teste", type: "expense", icon: "dots", color: "#64748b" })
    .returning();

  // A não apaga a de B
  expect(await deleteCategory(A, catB.id)).toBeNull();
  // Ninguém apaga a global por este caminho (só apaga a própria do usuário)
  expect(await deleteCategory(A, global.id)).toBeNull();
  expect(await deleteCategory(B, global.id)).toBeNull();
  // B continua com a dele
  expect(await db.select().from(category).where(eq(category.id, catB.id))).toHaveLength(1);
  // B apaga a própria
  expect(await deleteCategory(B, catB.id)).not.toBeNull();
  expect(await db.select().from(category).where(eq(category.id, catB.id))).toHaveLength(0);

  await db.delete(category).where(eq(category.id, global.id));
});

test("countUserCategories conta só as próprias, não as globais", async () => {
  const antes = await countUserCategories(A);
  const [global] = await db
    .insert(category)
    .values({ userId: null, name: "Global 2", type: "income", icon: "salary", color: "#22c55e" })
    .returning();
  await createCategory(A, { name: "Extra A", type: "income", icon: "plus", color: "#10b981" });

  expect(await countUserCategories(A)).toBe(antes + 1); // a global não entrou na conta

  await db.delete(category).where(eq(category.id, global.id));
  await db.delete(category).where(eq(category.userId, A)); // limpa as próprias de A deste teste
});

test("validadores recusam ícone, cor e forma de pagamento fora do catálogo", () => {
  expect(iconeValido("cart")).toBe(true);
  expect(iconeValido("dragao")).toBe(false);
  expect(corValida("#22c55e")).toBe(true);
  expect(corValida("#000000")).toBe(false);
  expect(formaPagamentoValida("pix")).toBe(true);
  expect(formaPagamentoValida("boleto")).toBe(false);
});
