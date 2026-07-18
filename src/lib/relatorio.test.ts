import { expect, test } from "vitest";
import { montarRelatorioTxt } from "./relatorio";

// O Intl pt-BR separa "R$" do número com espaço não-quebrável (U+00A0);
// normalizamos pra espaço comum antes de comparar.
function normalizar(s: string) {
  return s.replace(/ /g, " ");
}

test("montarRelatorioTxt monta resumo, categorias e lançamentos", () => {
  const txt = normalizar(
    montarRelatorioTxt({
      ano: 2026,
      mes: 5,
      geradoEm: "18/07/2026",
      entrou: 420000,
      saiu: 168903,
      saldo: 251097,
      gastos: [{ name: "Mercado", total: 64210 }],
      ganhos: [{ name: "Salário", total: 400000 }],
      lancamentos: [
        {
          id: "1",
          type: "income",
          amountCents: 400000,
          occurredAt: new Date("2026-05-05T15:00:00.000Z"),
          paymentMethod: "pix",
          description: "Salário",
          categoryName: "Salário",
          categoryIcon: "salary",
          categoryColor: "#22c55e",
        },
        {
          id: "2",
          type: "expense",
          amountCents: 1490,
          occurredAt: new Date("2026-05-18T15:00:00.000Z"),
          paymentMethod: "pix",
          description: "Cafeteria",
          categoryName: null,
          categoryIcon: null,
          categoryColor: null,
        },
      ],
    }),
  );

  expect(txt).toContain("Relatório de maio de 2026");
  expect(txt).toContain("Gerado em 18/07/2026");
  expect(txt).toContain("RESUMO");
  expect(txt).toContain("R$ 2.510,97"); // saldo
  expect(txt).toContain("ONDE MAIS GASTOU");
  expect(txt).toContain("Mercado");
  expect(txt).toContain("LANÇAMENTOS");
  expect(txt).toContain("+ R$ 4.000,00");
  expect(txt).toContain("- R$ 14,90");
  expect(txt).toContain("Cafeteria");
  expect(txt).toContain("(Pix)");
});

test("montarRelatorioTxt avisa quando não há lançamentos", () => {
  const txt = montarRelatorioTxt({
    ano: 2026,
    mes: 1,
    geradoEm: "01/02/2026",
    entrou: 0,
    saiu: 0,
    saldo: 0,
    gastos: [],
    ganhos: [],
    lancamentos: [],
  });
  expect(txt).toContain("nenhum lançamento neste mês");
});
