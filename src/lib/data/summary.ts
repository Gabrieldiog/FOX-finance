import "server-only";
import { and, desc, eq, gte, isNull, lt, ne, sql } from "drizzle-orm";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";

export type Periodo = "semana" | "mes";

export type Resumo = {
  entrou: number;
  saiu: number;
  saldo: number;
  categorias: { name: string; icon: string; color: string; total: number }[];
};

export async function resumoDoPeriodo(sessionUserId: string, periodo: Periodo): Promise<Resumo> {
  const unit = periodo === "semana" ? "week" : "month";
  // Início do período no fuso de São Paulo (não do calendário UTC).
  const inicio = sql`date_trunc(${unit}, now() at time zone 'America/Sao_Paulo') at time zone 'America/Sao_Paulo'`;

  // Transferência fica fora do "entrou/saiu": é dinheiro andando entre contas próprias.
  const [totais] = await db
    .select({
      entrou: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'income'), 0)`,
      saiu: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'expense'), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicio),
      ),
    );

  const cats = await db
    .select({
      name: category.name,
      icon: category.icon,
      color: category.color,
      total: sql<string>`coalesce(sum(${transaction.amountCents}), 0)`,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        eq(transaction.type, "expense"),
        gte(transaction.occurredAt, inicio),
      ),
    )
    .groupBy(category.id, category.name, category.icon, category.color)
    .orderBy(desc(sql`coalesce(sum(${transaction.amountCents}), 0)`))
    .limit(5);

  const entrou = Number(totais?.entrou ?? 0);
  const saiu = Number(totais?.saiu ?? 0);
  return {
    entrou,
    saiu,
    saldo: entrou - saiu,
    categorias: cats.map((c) => ({
      name: c.name ?? "Sem categoria",
      icon: c.icon ?? "dots",
      color: c.color ?? "#64748b",
      total: Number(c.total),
    })),
  };
}

// ── Estatísticas: séries no tempo + detalhe de um mês ──────────────────────

export type SerieItem = {
  key: string; // "2026-05" (mês) ou "2026" (ano)
  ano: number;
  mes: number | null; // null na granularidade anual
  label: string; // "mai", "2026"
  entrou: number;
  saiu: number;
  saldo: number;
};

export type CategoriaTotal = { name: string; icon: string; color: string; total: number };

export type DetalheMes = {
  ano: number;
  mes: number;
  entrou: number;
  saiu: number;
  saldo: number;
  gastos: CategoriaTotal[]; // onde mais gastou
  ganhos: CategoriaTotal[]; // onde mais ganhou
};

// Ano/mês do "agora" no fuso de São Paulo (não do UTC do servidor).
function anoMesSP(d: Date): { ano: number; mes: number } {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(d);
  const ano = Number(partes.find((p) => p.type === "year")!.value);
  const mes = Number(partes.find((p) => p.type === "month")!.value);
  return { ano, mes };
}

function rotuloMes(ano: number, mes: number): string {
  return new Date(Date.UTC(ano, mes - 1, 1))
    .toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })
    .replace(".", "");
}

// Timestamptz do primeiro instante de um mês (em SP): usado como limite de query.
function inicioMes(ano: number, mes: number) {
  return sql`(make_timestamp(${ano}, ${mes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;
}

// Últimos N meses (mais antigo → atual), com zero-fill: mês sem lançamento vem zerado.
export async function serieMensal(sessionUserId: string, n = 6): Promise<SerieItem[]> {
  const { ano, mes } = anoMesSP(new Date());
  const baldes = Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(ano, mes - 1 - (n - 1 - i), 1));
    return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
  });
  const chave = sql<string>`to_char(${transaction.occurredAt} at time zone 'America/Sao_Paulo', 'YYYY-MM')`;

  const linhas = await db
    .select({
      key: chave,
      entrou: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'income'), 0)`,
      saiu: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'expense'), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicioMes(baldes[0].ano, baldes[0].mes)),
      ),
    )
    .groupBy(chave);

  const porChave = new Map(linhas.map((l) => [l.key, l]));
  return baldes.map((b) => {
    const key = `${b.ano}-${String(b.mes).padStart(2, "0")}`;
    const l = porChave.get(key);
    const entrou = Number(l?.entrou ?? 0);
    const saiu = Number(l?.saiu ?? 0);
    return { key, ano: b.ano, mes: b.mes, label: rotuloMes(b.ano, b.mes), entrou, saiu, saldo: entrou - saiu };
  });
}

// Últimos N anos, com zero-fill.
export async function serieAnual(sessionUserId: string, n = 4): Promise<SerieItem[]> {
  const { ano } = anoMesSP(new Date());
  const baldes = Array.from({ length: n }, (_, i) => ano - (n - 1 - i));
  const chave = sql<string>`to_char(${transaction.occurredAt} at time zone 'America/Sao_Paulo', 'YYYY')`;

  const linhas = await db
    .select({
      key: chave,
      entrou: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'income'), 0)`,
      saiu: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'expense'), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicioMes(baldes[0], 1)),
      ),
    )
    .groupBy(chave);

  const porChave = new Map(linhas.map((l) => [l.key, l]));
  return baldes.map((a) => {
    const l = porChave.get(String(a));
    const entrou = Number(l?.entrou ?? 0);
    const saiu = Number(l?.saiu ?? 0);
    return { key: String(a), ano: a, mes: null, label: String(a), entrou, saiu, saldo: entrou - saiu };
  });
}

async function categoriasDoMes(
  sessionUserId: string,
  ano: number,
  mes: number,
  tipo: "expense" | "income",
): Promise<CategoriaTotal[]> {
  const rows = await db
    .select({
      name: category.name,
      icon: category.icon,
      color: category.color,
      total: sql<string>`coalesce(sum(${transaction.amountCents}), 0)`,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        eq(transaction.type, tipo),
        gte(transaction.occurredAt, inicioMes(ano, mes)),
        lt(transaction.occurredAt, inicioMes(mes === 12 ? ano + 1 : ano, mes === 12 ? 1 : mes + 1)),
      ),
    )
    .groupBy(category.id, category.name, category.icon, category.color)
    .orderBy(desc(sql`coalesce(sum(${transaction.amountCents}), 0)`))
    .limit(6);

  return rows.map((c) => ({
    name: c.name ?? "Sem categoria",
    icon: c.icon ?? "dots",
    color: c.color ?? "#64748b",
    total: Number(c.total),
  }));
}

// Detalhe de um mês específico: totais + onde mais gastou e onde mais ganhou.
export async function detalheMes(
  sessionUserId: string,
  ano: number,
  mes: number,
): Promise<DetalheMes> {
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = mes === 12 ? 1 : mes + 1;

  const [totais] = await db
    .select({
      entrou: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'income'), 0)`,
      saiu: sql<string>`coalesce(sum(${transaction.amountCents}) filter (where ${transaction.type} = 'expense'), 0)`,
    })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicioMes(ano, mes)),
        lt(transaction.occurredAt, inicioMes(proxAno, proxMes)),
      ),
    );

  const [gastos, ganhos] = await Promise.all([
    categoriasDoMes(sessionUserId, ano, mes, "expense"),
    categoriasDoMes(sessionUserId, ano, mes, "income"),
  ]);

  const entrou = Number(totais?.entrou ?? 0);
  const saiu = Number(totais?.saiu ?? 0);
  return { ano, mes, entrou, saiu, saldo: entrou - saiu, gastos, ganhos };
}

// Ano/mês corrente em SP — pra a página escolher o mês padrão.
export function mesCorrenteSP(): { ano: number; mes: number } {
  return anoMesSP(new Date());
}
