import "server-only";
import { and, count, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db";
import { category } from "@/db/schema";

// Categorias que o usuário pode usar: as globais (user_id nulo) + as próprias.
// Nunca as de outro dono.
export async function listCategories(sessionUserId: string) {
  return db
    .select()
    .from(category)
    .where(or(isNull(category.userId), eq(category.userId, sessionUserId)));
}

// true se a categoria é global ou pertence ao usuário — usado pra impedir que um
// lançamento referencie a categoria privada de outra pessoa (IDOR).
export async function categoryIsUsable(sessionUserId: string, categoryId: string) {
  const [row] = await db
    .select({ id: category.id })
    .from(category)
    .where(
      and(
        eq(category.id, categoryId),
        or(isNull(category.userId), eq(category.userId, sessionUserId)),
      ),
    )
    .limit(1);
  return row != null;
}

// Só as categorias próprias do usuário (sem as globais) — pra tela de gerir.
export async function listUserCategories(sessionUserId: string) {
  return db
    .select()
    .from(category)
    .where(eq(category.userId, sessionUserId))
    .orderBy(category.name);
}

// Quantas categorias próprias o usuário tem (as globais não contam pro teto).
export async function countUserCategories(sessionUserId: string) {
  const [row] = await db
    .select({ n: count() })
    .from(category)
    .where(eq(category.userId, sessionUserId));
  return row?.n ?? 0;
}

export type NovaCategoria = {
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
};

// Cria uma categoria SEMPRE com o dono da sessão. O ícone e a cor já vêm
// validados contra o catálogo fechado pela action que chama esta função.
export async function createCategory(sessionUserId: string, input: NovaCategoria) {
  const [row] = await db
    .insert(category)
    .values({
      userId: sessionUserId,
      name: input.name,
      type: input.type,
      icon: input.icon,
      color: input.color,
    })
    .returning();
  return row;
}

// Apaga só se for do próprio usuário: nunca uma categoria global (user_id nulo)
// nem de outro dono. Os lançamentos que a usavam ficam sem categoria
// (transaction.category_id tem onDelete: "set null"), não somem.
export async function deleteCategory(sessionUserId: string, id: string) {
  const [row] = await db
    .delete(category)
    .where(and(eq(category.id, id), eq(category.userId, sessionUserId)))
    .returning({ id: category.id });
  return row ?? null;
}
