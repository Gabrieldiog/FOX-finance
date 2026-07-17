import "server-only";
import { and, eq, isNull, or } from "drizzle-orm";
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
