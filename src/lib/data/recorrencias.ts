import "server-only";
import { and, asc, desc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { category, recurring, transaction } from "@/db/schema";

export type RecorrenciaView = {
  id: string;
  type: string;
  amountCents: number;
  dayOfMonth: number;
  active: boolean;
  description: string | null;
  paymentMethod: string | null;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
};

export type NovaRecorrencia = {
  type: "expense" | "income";
  amountCents: number;
  categoryId?: string | null;
  description?: string | null;
  paymentMethod?: string | null;
  dayOfMonth: number;
  startYm: string; // "YYYY-MM"
};

// Ano/mês/dia do "agora" no fuso de São Paulo.
function hojeSP(): { ano: number; mes: number; dia: number } {
  const p = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const num = (t: string) => Number(p.find((x) => x.type === t)!.value);
  return { ano: num("year"), mes: num("month"), dia: num("day") };
}

// N meses antes de um (ano, mes).
function mesesAtras(ano: number, mes: number, n: number): { ano: number; mes: number } {
  const d = new Date(Date.UTC(ano, mes - 1 - n, 1));
  return { ano: d.getUTCFullYear(), mes: d.getUTCMonth() + 1 };
}
const ordinal = (ano: number, mes: number) => ano * 12 + mes;

export async function listRecurring(sessionUserId: string) {
  return db
    .select()
    .from(recurring)
    .where(eq(recurring.userId, sessionUserId))
    .orderBy(desc(recurring.active), asc(recurring.dayOfMonth));
}

// Recorrências com a categoria já resolvida, pra tela de gerir.
export async function listRecurringView(sessionUserId: string): Promise<RecorrenciaView[]> {
  return db
    .select({
      id: recurring.id,
      type: recurring.type,
      amountCents: recurring.amountCents,
      dayOfMonth: recurring.dayOfMonth,
      active: recurring.active,
      description: recurring.description,
      paymentMethod: recurring.paymentMethod,
      categoryName: category.name,
      categoryIcon: category.icon,
      categoryColor: category.color,
    })
    .from(recurring)
    .leftJoin(category, eq(category.id, recurring.categoryId))
    .where(eq(recurring.userId, sessionUserId))
    .orderBy(desc(recurring.active), asc(recurring.dayOfMonth));
}

export async function createRecurring(sessionUserId: string, input: NovaRecorrencia) {
  const [row] = await db
    .insert(recurring)
    .values({
      userId: sessionUserId,
      type: input.type,
      amountCents: input.amountCents,
      categoryId: input.categoryId ?? null,
      description: input.description ?? null,
      paymentMethod: input.paymentMethod ?? null,
      dayOfMonth: input.dayOfMonth,
      startYm: input.startYm,
    })
    .returning();
  return row;
}

export async function setRecurringActive(sessionUserId: string, id: string, active: boolean) {
  const [row] = await db
    .update(recurring)
    .set({ active, updatedAt: new Date() })
    .where(and(eq(recurring.id, id), eq(recurring.userId, sessionUserId)))
    .returning({ id: recurring.id });
  return row ?? null;
}

// Remove o molde — os lançamentos já gerados ficam (recurring_id vira null).
export async function deleteRecurring(sessionUserId: string, id: string) {
  const [row] = await db
    .delete(recurring)
    .where(and(eq(recurring.id, id), eq(recurring.userId, sessionUserId)))
    .returning({ id: recurring.id });
  return row ?? null;
}

// Meia-noite? Não: meio-dia em São Paulo, pra o dia no fuso nunca virar por
// causa de borda. SP é UTC-3 fixo (o Brasil não tem horário de verão desde
// 2019), então meio-dia SP = 15:00 UTC. O buffer de 12h ainda protege a data
// mesmo que o offset fosse -02.
function meioDiaSP(ano: number, mes: number, dia: number): Date {
  return new Date(Date.UTC(ano, mes - 1, dia, 15, 0, 0));
}

// Cria os lançamentos que já venceram e ainda não existem, de cada molde ativo.
// Idempotente e barato: uma query lista o que já existe na janela, o que falta
// vira um único INSERT em lote. No caso comum (tudo já materializado) são só 2
// SELECTs e nenhum INSERT — nada de dezenas de idas ao banco por load.
//
// Varre no máximo os últimos 12 meses (janela = do mais recente entre start_ym e
// "hoje − 11 meses" até hoje). Isso garante o mês corrente pra sempre — sem o
// bug de uma regra antiga "morrer" por contagem de iterações — e limita o
// backfill: quem some por meses vê os últimos 12 preenchidos, não anos.
export async function materializarRecorrencias(sessionUserId: string): Promise<number> {
  const regras = await db
    .select()
    .from(recurring)
    .where(and(eq(recurring.userId, sessionUserId), eq(recurring.active, true)));
  if (regras.length === 0) return 0;

  const hoje = hojeSP();
  const janela = mesesAtras(hoje.ano, hoje.mes, 11); // piso da varredura
  const janelaYm = `${janela.ano}-${String(janela.mes).padStart(2, "0")}`;

  // O que já existe na janela, numa query só. Inclui soft-deleted de propósito:
  // uma ocorrência apagada mantém o occurrence_ym e NÃO deve voltar.
  const existentes = await db
    .select({ recurringId: transaction.recurringId, ym: transaction.occurrenceYm })
    .from(transaction)
    .where(
      and(
        eq(transaction.userId, sessionUserId),
        inArray(
          transaction.recurringId,
          regras.map((r) => r.id),
        ),
        gte(transaction.occurrenceYm, janelaYm),
      ),
    );
  const jaTem = new Set(existentes.map((e) => `${e.recurringId}|${e.ym}`));

  // Monta só as ocorrências que faltam (nada de INSERT cego mês a mês).
  const novas: (typeof transaction.$inferInsert)[] = [];
  for (const regra of regras) {
    const [sy, sm] = regra.startYm.split("-").map(Number);
    if (!sy || !sm) continue;

    // Começa do mais recente entre start_ym e o piso da janela.
    const comecaNoStart = ordinal(sy, sm) >= ordinal(janela.ano, janela.mes);
    let ano = comecaNoStart ? sy : janela.ano;
    let mes = comecaNoStart ? sm : janela.mes;

    while (ordinal(ano, mes) <= ordinal(hoje.ano, hoje.mes)) {
      // Último dia do mês (clamp: dia 31 em fevereiro cai em 28/29).
      const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      const dia = Math.min(regra.dayOfMonth, ultimoDia);
      const jaChegou =
        ano < hoje.ano ||
        (ano === hoje.ano && (mes < hoje.mes || (mes === hoje.mes && dia <= hoje.dia)));
      const ym = `${ano}-${String(mes).padStart(2, "0")}`;

      if (jaChegou && !jaTem.has(`${regra.id}|${ym}`)) {
        novas.push({
          userId: sessionUserId,
          type: regra.type,
          amountCents: regra.amountCents,
          occurredAt: meioDiaSP(ano, mes, dia),
          categoryId: regra.categoryId ?? null,
          description: regra.description ?? null,
          paymentMethod: regra.paymentMethod ?? null,
          recurringId: regra.id,
          occurrenceYm: ym,
        });
      }

      mes++;
      if (mes > 12) {
        mes = 1;
        ano++;
      }
    }
  }

  if (novas.length === 0) return 0;

  // Um INSERT em lote. O ON CONFLICT DO NOTHING (na UNIQUE recurring_id +
  // occurrence_ym) segura qualquer corrida entre duas cargas concorrentes.
  const inseridas = await db
    .insert(transaction)
    .values(novas)
    .onConflictDoNothing({ target: [transaction.recurringId, transaction.occurrenceYm] })
    .returning({ id: transaction.id });
  return inseridas.length;
}
