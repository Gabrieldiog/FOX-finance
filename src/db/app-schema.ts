import {
  pgTable,
  text,
  timestamp,
  bigint,
  integer,
  boolean,
  uuid,
  index,
  check,
  unique,
} from "drizzle-orm/pg-core";
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

// Recorrências: o "molde" de um lançamento que se repete todo mês num certo dia.
// Não guarda saldo nem gera nada sozinho no banco; quem materializa os
// lançamentos (idempotente) é o app quando o usuário abre. start_ym marca a
// partir de que mês vale ("YYYY-MM"); day_of_month é o dia (1–31, com clamp em
// mês curto na hora de gerar).
export const recurring = pgTable(
  "recurring",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // "expense" | "income"
    amountCents: bigint("amount_cents", { mode: "number" }).notNull(),
    categoryId: uuid("category_id").references(() => category.id, { onDelete: "set null" }),
    description: text("description"),
    paymentMethod: text("payment_method"),
    dayOfMonth: integer("day_of_month").notNull(),
    active: boolean("active").notNull().default(true),
    startYm: text("start_ym").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("recurring_user_idx").on(t.userId),
    check("recurring_type_valido", sql`${t.type} in ('expense','income')`),
    check("recurring_dia_valido", sql`${t.dayOfMonth} between 1 and 31`),
    check("recurring_valor_positivo", sql`${t.amountCents} > 0`),
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
    // Preenchido quando o lançamento nasceu de uma recorrência (rastro + dedupe).
    recurringId: uuid("recurring_id").references(() => recurring.id, { onDelete: "set null" }),
    // Mês da ocorrência ("YYYY-MM"): junto do recurring_id dá o UNIQUE que impede
    // duplicar a mesma ocorrência (inclusive sob concorrência). Nulo no lançamento manual.
    occurrenceYm: text("occurrence_ym"),
    // Reservado pra compartilhamento futuro (fase 2); sem uso no MVP.
    householdId: uuid("household_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [
    // user_id primeiro no índice: toda consulta começa filtrando pelo dono.
    index("transaction_user_idx").on(t.userId, t.occurredAt),
    // No máximo UMA ocorrência por molde por mês — a garantia de "nunca duplicar"
    // mora no banco, então nem duas cargas concorrentes conseguem furar. Os
    // lançamentos manuais têm (recurring_id, occurrence_ym) = (null, null); nulos
    // não colidem entre si, então não atrapalham.
    unique("transaction_recorrencia_unica").on(t.recurringId, t.occurrenceYm),
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

// Configuração de custo de quem roda de aplicativo. Uma linha por usuário — o
// user_id é a própria chave primária, então duplicata é impossível por
// construção, sem precisar de constraint extra.
//
// Nada aqui é obrigatório no primeiro acesso: quem nunca abriu os ajustes não
// tem linha nenhuma, e a camada de dados devolve os mesmos defaults declarados
// abaixo. Sem isso, a calculadora exigiria um cadastro antes de responder
// qualquer coisa.
export const costSetting = pgTable(
  "cost_setting",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    fuelPriceCents: integer("fuel_price_cents").notNull().default(600),
    // Centésimos de km/l: 30 km/l vira 3000. Inteiro escalado em vez de decimal,
    // pela mesma razão que o dinheiro é centavo inteiro (ver DECISOES.md).
    kmPerLiterCenti: integer("km_per_liter_centi").notNull().default(3000),
    maintenanceCentsPerKm: integer("maintenance_cents_per_km").notNull().default(15),
    vehicleValueCents: bigint("vehicle_value_cents", { mode: "number" }).notNull().default(0),
    vehicleLifetimeKm: integer("vehicle_lifetime_km").notNull().default(100000),
    // Centésimos: 0,60 vira 60.
    depreciationFactorCenti: integer("depreciation_factor_centi").notNull().default(60),
    fixedCostCentsPerMonth: bigint("fixed_cost_cents_per_month", { mode: "number" })
      .notNull()
      .default(0),
    workedDaysPerMonth: integer("worked_days_per_month").notNull().default(22),
    targetCentsPerHour: integer("target_cents_per_hour").notNull().default(2500),
    includeReturnTrip: boolean("include_return_trip").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    check("cost_preco_nao_negativo", sql`${t.fuelPriceCents} >= 0`),
    check("cost_consumo_nao_negativo", sql`${t.kmPerLiterCenti} >= 0`),
    check("cost_manutencao_nao_negativa", sql`${t.maintenanceCentsPerKm} >= 0`),
    check("cost_dias_validos", sql`${t.workedDaysPerMonth} between 0 and 31`),
    check("cost_fator_valido", sql`${t.depreciationFactorCenti} between 0 and 100`),
    check("cost_vida_util_nao_negativa", sql`${t.vehicleLifetimeKm} >= 0`),
  ],
);
