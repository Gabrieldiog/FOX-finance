import { describe, expect, test } from "vitest";
import { avaliarMetas, type Metas, type MovimentoDoMes } from "./metas-do-mes";

// formatBRL usa o espaço do pt-BR entre "R$" e o número, que NÃO é o espaço
// comum (é U+00A0, e em algumas versões do ICU U+202F). Comparar com espaço
// normal falha sem que haja nada de errado com o texto.
const norm = (s: string) => s.replace(/[\u00a0\u202f]/g, " ");

const METAS: Metas = { spendLimitCents: 200000, saveTargetCents: 100000 }; // gastar até 2000, guardar 1000
const MEIO: MovimentoDoMes = { entrouCents: 0, saiuCents: 0, diaDoMes: 15, diasNoMes: 30 };

describe("meta de gasto", () => {
  test("sem meta definida, não inventa mensagem", () => {
    const r = avaliarMetas({ spendLimitCents: 0, saveTargetCents: 0 }, MEIO);
    expect(r.gasto).toBeNull();
    expect(r.economia).toBeNull();
    expect(r.destaque).toBeNull();
  });

  test("longe do limite: tom tranquilo, com o quanto ainda cabe", () => {
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 50000 }); // 500 de 2000 = 25%
    expect(r.gasto!.estado).toBe("tranquilo");
    expect(r.gasto!.restanteCents).toBe(150000);
    expect(r.gasto!.usadoPct).toBe(25);
  });

  test("chegando perto, avisa quanto falta para estourar", () => {
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 191000 }); // faltam 90
    expect(r.gasto!.estado).toBe("perto");
    expect(r.gasto!.restanteCents).toBe(9000);
    expect(norm(r.gasto!.texto)).toContain("R$ 90,00");
  });

  test("estourou: diz quanto passou, sem rodeio", () => {
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 250000 });
    expect(r.gasto!.estado).toBe("estourou");
    expect(r.gasto!.restanteCents).toBe(-50000);
    expect(norm(r.gasto!.texto)).toContain("R$ 500,00");
  });

  test("exatamente no limite ainda não é estouro", () => {
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 200000 });
    expect(r.gasto!.restanteCents).toBe(0);
    expect(r.gasto!.estado).toBe("perto");
  });

  test("gastando rápido demais para o dia do mês, avisa do ritmo", () => {
    // dia 10 de 30, já gastou 50% do limite: no ritmo, estoura
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 100000, diaDoMes: 10, diasNoMes: 30 });
    expect(r.gasto!.ritmoEstoura).toBe(true);
  });

  test("gastando devagar, não alarma", () => {
    const r = avaliarMetas(METAS, { ...MEIO, saiuCents: 40000, diaDoMes: 10, diasNoMes: 30 });
    expect(r.gasto!.ritmoEstoura).toBe(false);
  });
});

describe("meta de economia", () => {
  test("sobrando acima da meta: batida", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 300000, saiuCents: 150000 }); // sobrou 1500
    expect(r.economia!.estado).toBe("batida");
    expect(r.economia!.sobraCents).toBe(150000);
  });

  test("no caminho: mostra o quanto falta", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 200000, saiuCents: 140000 }); // sobrou 600
    expect(r.economia!.estado).toBe("caminho");
    expect(r.economia!.faltaCents).toBe(40000);
    expect(norm(r.economia!.texto)).toContain("R$ 400,00");
  });

  test("no vermelho: gastou mais do que entrou", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 100000, saiuCents: 150000 });
    expect(r.economia!.estado).toBe("negativo");
    expect(r.economia!.sobraCents).toBe(-50000);
  });

  test("mês fechado com a meta batida: celebra", () => {
    const r = avaliarMetas(METAS, {
      entrouCents: 300000,
      saiuCents: 150000,
      diaDoMes: 30,
      diasNoMes: 30,
    });
    expect(r.economia!.estado).toBe("batida");
    expect(r.economia!.mesAcabou).toBe(true);
    expect(r.economia!.texto).toMatch(/parab|conseguiu|fechou/i);
  });
});

describe("destaque — a única frase que aparece no início", () => {
  test("estourar o gasto ganha da economia", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 500000, saiuCents: 250000 });
    // economia batida E gasto estourado: o problema fala mais alto
    expect(r.economia!.estado).toBe("batida");
    expect(r.destaque).toBe(r.gasto!.texto);
  });

  test("com tudo bem, o destaque é o progresso da economia", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 200000, saiuCents: 140000 });
    expect(r.destaque).toBe(r.economia!.texto);
  });

  test("só meta de gasto definida: o destaque é ela", () => {
    const r = avaliarMetas({ spendLimitCents: 200000, saveTargetCents: 0 }, { ...MEIO, saiuCents: 50000 });
    expect(r.economia).toBeNull();
    expect(r.destaque).toBe(r.gasto!.texto);
  });
});

describe("casos de borda", () => {
  test("dia zero ou mês de zero dias não quebra o ritmo", () => {
    const r = avaliarMetas(METAS, { entrouCents: 0, saiuCents: 1000, diaDoMes: 0, diasNoMes: 0 });
    expect(Number.isFinite(r.gasto!.usadoPct)).toBe(true);
    expect(r.gasto!.ritmoEstoura).toBe(false);
  });

  test("nenhum valor formatado sai com ponto decimal", () => {
    const r = avaliarMetas(METAS, { ...MEIO, entrouCents: 123456, saiuCents: 199999 });
    for (const t of [r.gasto!.texto, r.economia!.texto, r.destaque!]) {
      expect(t).not.toMatch(/\d\.\d{1,2}(?!\d)/);
    }
  });
});
