import "server-only";
import { and, asc, desc, eq, sql } from "drizzle-orm";
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

// Insere a ocorrência do mês. O ON CONFLICT DO NOTHING (na UNIQUE
// recurring_id + occurrence_ym) faz o dedupe no BANCO: nem duas cargas
// concorrentes duplicam, e uma ocorrência apagada (soft-delete mantém o
// occurrence_ym) segue barrada — não volta. Retorna se de fato criou.
async function inserirOcorrencia(
  sessionUserId: string,
  regra: typeof recurring.$inferSelect,
  ano: number,
  mes: number,
  dia: number,
): Promise<boolean> {
  const linhas = await db
    .insert(transaction)
    .values({
      userId: sessionUserId,
      type: regra.type,
      amountCents: regra.amountCents,
      occurredAt: sql`(make_timestamp(${ano}, ${mes}, ${dia}, 12, 0, 0) at time zone 'America/Sao_Paulo')`,
      categoryId: regra.categoryId ?? null,
      description: regra.description ?? null,
      paymentMethod: regra.paymentMethod ?? null,
      recurringId: regra.id,
      occurrenceYm: `${ano}-${String(mes).padStart(2, "0")}`,
    })
    .onConflictDoNothing({ target: [transaction.recurringId, transaction.occurrenceYm] })
    .returning({ id: transaction.id });
  return linhas.length > 0;
}

// Cria os lançamentos que já venceram e ainda não existem, de cada molde ativo.
// Idempotente (dedupe no banco). Chamado quando o usuário abre o app.
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
  let criados = 0;

  for (const regra of regras) {
    const [sy, sm] = regra.startYm.split("-").map(Number);
    if (!sy || !sm) continue;

    // Começa do mais recente entre start_ym e o piso da janela.
    let ano: number;
    let mes: number;
    if (ordinal(sy, sm) >= ordinal(janela.ano, janela.mes)) {
      ano = sy;
      mes = sm;
    } else {
      ano = janela.ano;
      mes = janela.mes;
    }

    while (ordinal(ano, mes) <= ordinal(hoje.ano, hoje.mes)) {
      // Último dia do mês (clamp: dia 31 em fevereiro cai em 28/29).
      const ultimoDia = new Date(Date.UTC(ano, mes, 0)).getUTCDate();
      const dia = Math.min(regra.dayOfMonth, ultimoDia);
      const jaChegou =
        ano < hoje.ano ||
        (ano === hoje.ano && (mes < hoje.mes || (mes === hoje.mes && dia <= hoje.dia)));

      if (jaChegou && (await inserirOcorrencia(sessionUserId, regra, ano, mes, dia))) {
        criados++;
      }

      mes++;
      if (mes > 12) {
        mes = 1;
        ano++;
      }
    }
  }

  return criados;
}
