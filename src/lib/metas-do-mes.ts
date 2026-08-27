import { formatBRL } from "./format";

// As duas metas do mês, e as frases que elas produzem.
//
// São só duas de propósito: quanto você quer GASTAR e quanto quer que SOBRE.
// A versão anterior era um teto por categoria — mais preciso no papel, e quase
// impossível de manter no dia a dia. Duas perguntas cabem na cabeça.
//
// Puro: não toca banco nem lê relógio. Tudo entra por parâmetro.

export type Metas = {
  /** Teto de gasto do mês. Zero = sem meta. */
  spendLimitCents: number;
  /** Quanto a pessoa quer que sobre no fim do mês. Zero = sem meta. */
  saveTargetCents: number;
};

export type MovimentoDoMes = {
  entrouCents: number;
  saiuCents: number;
  diaDoMes: number;
  diasNoMes: number;
};

export type EstadoGasto = "tranquilo" | "perto" | "estourou";
export type EstadoEconomia = "negativo" | "caminho" | "batida";

export type ProgressoGasto = {
  estado: EstadoGasto;
  gastoCents: number;
  limiteCents: number;
  /** Positivo = ainda cabe; negativo = passou. */
  restanteCents: number;
  usadoPct: number;
  /** No ritmo atual, o mês fecha acima do limite. */
  ritmoEstoura: boolean;
  texto: string;
};

export type ProgressoEconomia = {
  estado: EstadoEconomia;
  sobraCents: number;
  metaCents: number;
  faltaCents: number;
  progressoPct: number;
  mesAcabou: boolean;
  texto: string;
};

export type AvaliacaoDeMetas = {
  gasto: ProgressoGasto | null;
  economia: ProgressoEconomia | null;
  /** A única frase que vai para o início. Null quando não há meta nenhuma. */
  destaque: string | null;
};

const div = (a: number, b: number) => (b === 0 ? 0 : a / b);

// Abaixo disso o gasto está confortável; daí pra cima já vale avisar.
const LIMIAR_ATENCAO = 0.8;

function avaliarGasto(limiteCents: number, m: MovimentoDoMes): ProgressoGasto | null {
  if (limiteCents <= 0) return null;

  const restanteCents = limiteCents - m.saiuCents;
  const usadoPct = Math.round(div(m.saiuCents, limiteCents) * 100);

  // Ritmo: se manter a média diária até o fim do mês, passa do limite?
  // Só vale a partir do terceiro dia — antes disso um único gasto grande
  // projetaria um mês catastrófico e o aviso seria só barulho.
  const projetado = m.diaDoMes >= 3 ? div(m.saiuCents, m.diaDoMes) * m.diasNoMes : 0;
  const ritmoEstoura = projetado > limiteCents && restanteCents > 0;

  const estado: EstadoGasto =
    restanteCents < 0 ? "estourou" : usadoPct >= LIMIAR_ATENCAO * 100 ? "perto" : "tranquilo";

  let texto: string;
  if (estado === "estourou") {
    texto = `Você passou ${formatBRL(-restanteCents)} da sua meta de gastos.`;
  } else if (estado === "perto") {
    texto = `Falta ${formatBRL(restanteCents)} para você estourar a meta de gastos.`;
  } else if (ritmoEstoura) {
    texto = `Ainda cabe ${formatBRL(restanteCents)} — mas nesse ritmo o mês fecha acima da meta.`;
  } else {
    texto = `Você ainda pode gastar ${formatBRL(restanteCents)} este mês.`;
  }

  return { estado, gastoCents: m.saiuCents, limiteCents, restanteCents, usadoPct, ritmoEstoura, texto };
}

function avaliarEconomia(metaCents: number, m: MovimentoDoMes): ProgressoEconomia | null {
  if (metaCents <= 0) return null;

  const sobraCents = m.entrouCents - m.saiuCents;
  const faltaCents = Math.max(0, metaCents - sobraCents);
  const progressoPct = Math.max(0, Math.round(div(sobraCents, metaCents) * 100));
  const mesAcabou = m.diasNoMes > 0 && m.diaDoMes >= m.diasNoMes;

  const estado: EstadoEconomia =
    sobraCents >= metaCents ? "batida" : sobraCents < 0 ? "negativo" : "caminho";

  let texto: string;
  if (estado === "batida") {
    texto = mesAcabou
      ? `Mês fechado com ${formatBRL(sobraCents)} guardados. Parabéns — a meta era ${formatBRL(metaCents)}.`
      : `Meta de ${formatBRL(metaCents)} já batida, e o mês nem acabou.`;
  } else if (estado === "negativo") {
    texto = `Você gastou ${formatBRL(-sobraCents)} a mais do que entrou este mês.`;
  } else {
    texto = mesAcabou
      ? `O mês fechou com ${formatBRL(sobraCents)} guardados, ${formatBRL(faltaCents)} abaixo da meta.`
      : `Faltam ${formatBRL(faltaCents)} para bater sua meta de guardar ${formatBRL(metaCents)}.`;
  }

  return { estado, sobraCents, metaCents, faltaCents, progressoPct, mesAcabou, texto };
}

export function avaliarMetas(metas: Metas, m: MovimentoDoMes): AvaliacaoDeMetas {
  const gasto = avaliarGasto(metas.spendLimitCents, m);
  const economia = avaliarEconomia(metas.saveTargetCents, m);

  // Só UMA frase vai para o início — duas viram ruído e ninguém lê nenhuma.
  // Problema ganha de progresso: estar estourando o gasto importa mais do que
  // ter batido a economia, mesmo quando as duas coisas são verdade ao mesmo tempo.
  let destaque: string | null = null;
  if (gasto && (gasto.estado === "estourou" || gasto.estado === "perto")) destaque = gasto.texto;
  else if (economia && economia.estado === "negativo") destaque = economia.texto;
  else if (economia) destaque = economia.texto;
  else if (gasto) destaque = gasto.texto;

  return { gasto, economia, destaque };
}
