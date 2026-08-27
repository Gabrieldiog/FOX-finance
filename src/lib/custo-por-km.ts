// Matemática do módulo de ganhos de app. Puro: não importa banco, não lê relógio,
// não tem estado. Testável sem infraestrutura nenhuma, igual a src/lib/relatorio.ts.
//
// Sobre unidades: dinheiro é centavo inteiro, como no resto do Fox. Mas custo POR
// KM é uma taxa, não um valor — ela vive em ponto flutuante aqui dentro e só vira
// centavo inteiro (com Math.round) quando o resultado é dinheiro de verdade.
// Arredondar a taxa antes acumularia erro a cada quilômetro rodado.

export type Custos = {
  fuelPriceCents: number;
  /** Centésimos de km/l: 30 km/l é 3000. Ver DECISOES.md. */
  kmPerLiterCenti: number;
  maintenanceCentsPerKm: number;
  vehicleValueCents: number;
  vehicleLifetimeKm: number;
  /** Centésimos: 0,60 é 60. */
  depreciationFactorCenti: number;
  fixedCostCentsPerMonth: number;
  workedDaysPerMonth: number;
  targetCentsPerHour: number;
  includeReturnTrip: boolean;
};

export type Rota = {
  kmAtePartida: number;
  kmDaRota: number;
  minutos: number;
  ofertaCents: number;
};

export type NomeVeredito = "RECUSA" | "LIMITE" | "ACEITA";

export type Veredito = {
  kmTotal: number;
  custoCents: number;
  sobraCents: number;
  porHoraCents: number;
  /** Razão exata contra a meta. Pode passar de 1 e pode ser negativa. */
  razao: number;
  /** A mesma razão, presa entre 0 e 2, para o indicador não sair da escala. */
  razaoNoIndicador: number;
  veredito: NomeVeredito;
};

// Divisão que nunca devolve Infinity nem NaN. Denominador zerado aqui significa
// "esse dado não foi preenchido", e dado que falta vale zero — nunca infinito,
// que contaminaria a conta inteira e chegaria na tela como "R$ NaN".
function dividir(a: number, b: number): number {
  return b === 0 ? 0 : a / b;
}

export function custoVariavelPorKm(c: Custos): number {
  const kmPorLitro = c.kmPerLiterCenti / 100;
  const combustivel = dividir(c.fuelPriceCents, kmPorLitro);
  const depreciacao = dividir(
    (c.vehicleValueCents * c.depreciationFactorCenti) / 100,
    c.vehicleLifetimeKm,
  );
  return combustivel + c.maintenanceCentsPerKm + depreciacao;
}

export function custoFixoPorDia(c: Custos): number {
  return dividir(c.fixedCostCentsPerMonth, c.workedDaysPerMonth);
}

// Teto do indicador: acima disso a agulha satura e a tela mostra "200%+". O valor
// exato continua em `razao`, para a linha de resumo.
const TETO_DO_INDICADOR = 2;

// Fronteiras dos vereditos, em fração da meta por hora.
const PISO_ACEITA = 1;
const PISO_LIMITE = 0.7;

export function avaliarRota(c: Custos, r: Rota): Veredito {
  // Esquecer o km de volta é o erro que faz a conta mentir: uma rota que termina
  // longe custa o dobro do que parece na tela do aplicativo.
  const kmTotal = r.kmAtePartida + r.kmDaRota + (c.includeReturnTrip ? r.kmDaRota : 0);
  const custoCents = Math.round(kmTotal * custoVariavelPorKm(c));
  const sobraCents = r.ofertaCents - custoCents;
  const porHoraCents = Math.round(dividir(sobraCents, r.minutos / 60));
  const razao = dividir(porHoraCents, c.targetCentsPerHour);

  const veredito: NomeVeredito =
    razao >= PISO_ACEITA ? "ACEITA" : razao >= PISO_LIMITE ? "LIMITE" : "RECUSA";

  return {
    kmTotal,
    custoCents,
    sobraCents,
    porHoraCents,
    razao,
    razaoNoIndicador: Math.min(Math.max(razao, 0), TETO_DO_INDICADOR),
    veredito,
  };
}
