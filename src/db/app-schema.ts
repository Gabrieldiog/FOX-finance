import { pgTable, text, timestamp, bigint, uuid, index, check, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { user } from "./auth-schema";

// Categorias. user_id nulo = categoria global (seed); preenchido = categoria do próprio usuário.
export const category = pgTable(
  "category",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull(), // "expense" | "income"
    icon: text("icon").notNull(),
    color: text("color").notNull(),
  },
  (t) => [
    index("category_user_idx").on(t.userId),
    check("category_type_valido", sql`${t.type} in ('expense','income')`),
  ],
);

// Lançamentos. Imutável no espírito: editar/excluir vira soft-delete (deleted_at).
// O saldo é sempre derivado por agregação, nunca um campo guardado aqui.
export const transaction = pgTable(
  "transaction",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "expense" | "income" | "transfer"
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    categoryId: uuid("category_id").references(() => category.id, { onDelete: "set null" }),
    description: text("description"),
    paymentMethod: text("payment_method"),
    // Reservado pra compartilhamento futuro (fase 2); sem uso no MVP.
    householdId: uuid("household_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // user_id primeiro no índice: toda consulta começa filtrando pelo dono.
    index("transaction_user_idx").on(t.userId, t.occurredAt),
    // Valor sempre positivo (o sinal fica por conta do type) e type válido.
    check("transaction_valor_positivo", sql`${t.amountCents} > 0`),
    check("transaction_type_valido", sql`${t.type} in ('expense','income','transfer')`),
  ],
);

// Metas: um limite mensal de gasto por categoria (recorrente, não preso a um mês).
// O progresso é sempre derivado somando os lançamentos do mês; aqui só mora o teto.
export const budget = pgTable(
  "budget",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => category.id, { onDelete: "cascade" }),
    limitCents: bigint("limit_cents", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("budget_user_idx").on(t.userId),
    // Uma meta por (dono, categoria): definir de novo é atualizar, não duplicar.
    unique("budget_user_category").on(t.userId, t.categoryId),
    check("budget_limit_positivo", sql`${t.limitCents} > 0`),
  ],
);
