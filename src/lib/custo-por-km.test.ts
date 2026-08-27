import { describe, expect, test } from "vitest";
import { avaliarRota, custoFixoPorDia, custoVariavelPorKm, type Custos } from "./custo-por-km";

// Padrão do brief: R$ 6,00/l, 30 km/l, 15 centavos/km de manutenção, moto sem
// depreciação declarada, meta de R$ 25,00 por hora.
const PADRAO: Custos = {
  fuelPriceCents: 600,
  kmPerLiterCenti: 3000,
  maintenanceCentsPerKm: 15,
  vehicleValueCents: 0,
  vehicleLifetimeKm: 100000,
  depreciationFactorCenti: 60,
  fixedCostCentsPerMonth: 0,
  workedDaysPerMonth: 22,
  targetCentsPerHour: 2500,
  includeReturnTrip: true,
};

describe("custoVariavelPorKm", () => {
  test("soma combustível, manutenção e depreciação", () => {
    // 600 / 30 = 20 de combustível + 15 de manutenção + 0 de depreciação
    expect(custoVariavelPorKm(PADRAO)).toBeCloseTo(35, 6);
  });

  test("inclui a depreciação quando a moto tem valor", () => {
    // (1_000_000 centavos x 0,60) / 100_000 km = 6 centavos por km
    const c = { ...PADRAO, vehicleValueCents: 1_000_000 };
    expect(custoVariavelPorKm(c)).toBeCloseTo(41, 6);
  });

  test("kmPerLiter zero não vira Infinity nem NaN", () => {
    const c = { ...PADRAO, kmPerLiterCenti: 0 };
    const r = custoVariavelPorKm(c);
    expect(Number.isFinite(r)).toBe(true);
    expect(r).toBe(15); // só a manutenção; o combustível é ignorado, não explode
  });

  test("vehicleLifetimeKm zero não vira Infinity", () => {
    const c = { ...PADRAO, vehicleValueCents: 1_000_000, vehicleLifetimeKm: 0 };
    expect(Number.isFinite(custoVariavelPorKm(c))).toBe(true);
  });
});

describe("custoFixoPorDia", () => {
  test("divide o custo fixo do mês pelos dias trabalhados", () => {
    const c = { ...PADRAO, fixedCostCentsPerMonth: 22000, workedDaysPerMonth: 22 };
    expect(custoFixoPorDia(c)).toBeCloseTo(1000, 6);
  });

  test("workedDaysPerMonth zero devolve zero, não Infinity", () => {
    const c = { ...PADRAO, fixedCostCentsPerMonth: 22000, workedDaysPerMonth: 0 };
    expect(custoFixoPorDia(c)).toBe(0);
  });
});

describe("avaliarRota", () => {
  test("conta o km de volta quando includeReturnTrip", () => {
    // 2 km até o cliente + 10 da rota + 10 de volta = 22 km x 35 = 770 centavos
    const v = avaliarRota(PADRAO, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.kmTotal).toBe(22);
    expect(v.custoCents).toBe(770);
    expect(v.sobraCents).toBe(1230);
  });

  test("sem o km de volta o custo cai", () => {
    const c = { ...PADRAO, includeReturnTrip: false };
    // 2 + 10 = 12 km x 35 = 420
    const v = avaliarRota(c, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.custoCents).toBe(420);
  });

  test("calcula o por-hora e a razão contra a meta", () => {
    // sobra 1230 em 30 min = 2460/h; meta 2500 -> 98,4%
    const v = avaliarRota(PADRAO, { kmAtePartida: 2, kmDaRota: 10, minutos: 30, ofertaCents: 2000 });
    expect(v.porHoraCents).toBe(2460);
    expect(v.razao).toBeCloseTo(0.984, 3);
    expect(v.veredito).toBe("LIMITE");
  });

  test("as três faixas do veredito", () => {
    const base = { kmAtePartida: 0, kmDaRota: 10, minutos: 60 };
    // 20 km x 35 = 700 de custo, em 1 hora
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 1000 }).veredito).toBe("RECUSA"); // 300/h = 12%
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 2700 }).veredito).toBe("LIMITE"); // 2000/h = 80%
    expect(avaliarRota(PADRAO, { ...base, ofertaCents: 3200 }).veredito).toBe("ACEITA"); // 2500/h = 100%
  });

  test("a fronteira de 70% cai em LIMITE, não em RECUSA", () => {
    // custo 700 em 1h; para razão exata de 0,70 a sobra precisa ser 1750
    const v = avaliarRota(PADRAO, {
      kmAtePartida: 0,
      kmDaRota: 10,
      minutos: 60,
      ofertaCents: 2450,
    });
    expect(v.razao).toBeCloseTo(0.7, 6);
    expect(v.veredito).toBe("LIMITE");
  });

  test("oferta menor que o custo dá sobra negativa e RECUSA", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 10, minutos: 30, ofertaCents: 100 });
    expect(v.sobraCents).toBeLessThan(0);
    expect(v.veredito).toBe("RECUSA");
  });

  test("minutos zero não vira Infinity", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 10, minutos: 0, ofertaCents: 5000 });
    expect(Number.isFinite(v.porHoraCents)).toBe(true);
    expect(Number.isFinite(v.razao)).toBe(true);
  });

  test("km total zero: custo zero, sem divisão por zero", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 0, minutos: 30, ofertaCents: 1000 });
    expect(v.custoCents).toBe(0);
    expect(v.sobraCents).toBe(1000);
  });

  test("meta zerada não quebra a razão", () => {
    const c = { ...PADRAO, targetCentsPerHour: 0 };
    const v = avaliarRota(c, { kmAtePartida: 0, kmDaRota: 5, minutos: 30, ofertaCents: 3000 });
    expect(Number.isFinite(v.razao)).toBe(true);
  });

  test("a razão trava em 2 para o indicador, mas o valor exato continua disponível", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 1, minutos: 10, ofertaCents: 10000 });
    expect(v.razao).toBeGreaterThan(2);
    expect(v.razaoNoIndicador).toBe(2);
  });

  test("sobra negativa não empurra o indicador para baixo de zero", () => {
    const v = avaliarRota(PADRAO, { kmAtePartida: 0, kmDaRota: 50, minutos: 30, ofertaCents: 100 });
    expect(v.razao).toBeLessThan(0);
    expect(v.razaoNoIndicador).toBe(0);
  });
});
