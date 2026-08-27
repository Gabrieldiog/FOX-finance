import "server-only";
import { and, desc, eq, gte, ilike, isNull, lt, ne, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { category, transaction } from "@/db/schema";
import { categoryIsUsable } from "./categories";

// Uma linha da lista de lançamentos (com a categoria já resolvida). Compartilhada
// entre o dashboard, o histórico e o <ItemLancamento>.
export type LancamentoLista = {
  id: string;
  type: string;
  amountCents: number;
  occurredAt: Date;
  paymentMethod: string | null;
  description: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

export type NovaTransacao = {
  type: "expense" | "income" | "transfer";
  amountCents: number;
  occurredAt: Date;
  categoryId?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
};

// REGRA DE OURO: sessionUserId vem SEMPRE da sessão no servidor, nunca de
// req/body/param. Toda leitura e escrita é escopada por ele; dado de outro
// usuário responde null/vazio (que vira 404 na rota).

export async function listTransactions(sessionUserId: string) {
  return db
    .select()
    .from(transaction)
    .where(and(eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)))
    .orderBy(desc(transaction.occurredAt));
}

export async function listRecentTransactions(sessionUserId: string, limit = 20) {
  return db
    .select({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredAt: transaction.occurredAt,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(and(eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)))
    .orderBy(desc(transaction.occurredAt))
    .limit(limit);
}

// Busca no histórico: filtra por texto (descrição ou nome da categoria) e por
// tipo, sempre escopado ao dono. Traz limit+1 linhas pra a página saber se há
// mais a mostrar.
//
// A paginação é por CURSOR, não por limite crescente. O jeito antigo pedia
// "me dê os primeiros N" com N subindo a cada clique, e N era grampeado em
// 300: ao chegar lá, o botão continuava aparecendo e devolvia sempre a mesma
// página — todo lançamento além do 300º ficava inalcançável pela tela.
//
// O cursor é (occurredAt, id), NÃO só a data. materializarRecorrencias grava
// toda ocorrência às 15:00Z em ponto, então datas repetidas são comuns aqui —
// e um cursor só de data ou pularia linhas ou as repetiria para sempre.
export async function searchTransactions(
  sessionUserId: string,
  opts: {
    q?: string;
    tipo?: "expense" | "income";
    limit?: number;
    antes?: { occurredAt: Date; id: string };
  },
): Promise<LancamentoLista[]> {
  const limite = Math.min(Math.max(opts.limit ?? 30, 1), 300);
  const conds: SQL[] = [eq(transaction.userId, sessionUserId), isNull(transaction.deletedAt)];
  if (opts.tipo) conds.push(eq(transaction.type, opts.tipo));
  if (opts.antes) {
    // Comparação de tupla do Postgres: pega tudo estritamente "abaixo" do
    // último item já mostrado, na mesma ordem em que a lista é exibida.
    conds.push(
      sql`(${transaction.occurredAt}, ${transaction.id}) < (${opts.antes.occurredAt.toISOString()}::timestamptz, ${opts.antes.id}::uuid)`,
    );
  }
  const termo = opts.q?.trim();
  if (termo) {
    const like = `%${termo}%`;
    conds.push(or(ilike(transaction.description, like), ilike(category.name, like))!);
  }
  return db
    .select({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredAt: transaction.occurredAt,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(and(...conds))
    // O id entra no ORDER BY junto com a data: sem ele, duas linhas do mesmo
    // instante saem em ordem arbitrária e a paginação passa a pular ou repetir.
    .orderBy(desc(transaction.occurredAt), desc(transaction.id))
    .limit(limite + 1);
}

// Todos os lançamentos de um mês (fuso de São Paulo), pro relatório em .txt.
export async function listTransactionsDoMes(
  sessionUserId: string,
  ano: number,
  mes: number,
): Promise<LancamentoLista[]> {
  const proxAno = mes === 12 ? ano + 1 : ano;
  const proxMes = mes === 12 ? 1 : mes + 1;
  const inicio = sql`(make_timestamp(${ano}, ${mes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;
  const fim = sql`(make_timestamp(${proxAno}, ${proxMes}, 1, 0, 0, 0) at time zone 'America/Sao_Paulo')`;
  return db
    .select({
      id: transaction.id,
      type: transaction.type,
      amountCents: transaction.amountCents,
      occurredAt: transaction.occurredAt,
      paymentMethod: transaction.paymentMethod,
      description: transaction.description,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(transaction)
    .leftJoin(category, eq(category.id, transaction.categoryId))
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
        // Fora transferências (dinheiro entre contas próprias) — igual às
        // agregações do resumo, pra as duas metades do .txt reconciliarem.
        ne(transaction.type, "transfer"),
        gte(transaction.occurredAt, inicio),
        lt(transaction.occurredAt, fim),
      ),
    )
    .orderBy(desc(transaction.occurredAt));
}

export async function getTransaction(sessionUserId: string, id: string) {
  const [row] = await db
    .select()
    .from(transaction)
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .limit(1);
  return row ?? null;
}

export async function createTransaction(sessionUserId: string, input: NovaTransacao) {
  if (input.categoryId && !(await categoryIsUsable(sessionUserId, input.categoryId))) {
    throw new Error("categoria inválida");
  }
  const [row] = await db
    .insert(transaction)
    .values({
      userId: sessionUserId,
      type: input.type,
      amountCents: input.amountCents,
      occurredAt: input.occurredAt,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      paymentMethod: input.paymentMethod ?? null,
    })
    .returning();
  return row;
}

export async function updateTransaction(
  sessionUserId: string,
  id: string,
  input: Pick<
    NovaTransacao,
    "type" | "amountCents" | "categoryId" | "description" | "occurredAt" | "paymentMethod"
  >,
) {
  if (input.categoryId && !(await categoryIsUsable(sessionUserId, input.categoryId))) {
    throw new Error("categoria inválida");
  }
  const [row] = await db
    .update(transaction)
    .set({
      type: input.type,
      amountCents: input.amountCents,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      occurredAt: input.occurredAt,
      paymentMethod: input.paymentMethod ?? null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}

export async function softDeleteTransaction(sessionUserId: string, id: string) {
  const [row] = await db
    .update(transaction)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(transaction.id, id),
        eq(transaction.userId, sessionUserId),
        isNull(transaction.deletedAt),
      ),
    )
    .returning();
  return row ?? null;
}
