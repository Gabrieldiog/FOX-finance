import { agruparPorDia, formatBRL } from "@/lib/format";
import { labelFormaPagamento } from "@/lib/categorias";
import type { LancamentoLista } from "@/lib/data/transactions";

const MESES = [
  "janeiro",
  "fevereiro",
  "março",
  "abril",
  "maio",
  "junho",
  "julho",
  "agosto",
  "setembro",
  "outubro",
  "novembro",
  "dezembro",
];

export type LinhaCategoria = { name: string; total: number };

export type DadosRelatorio = {
  ano: number;
  mes: number;
  geradoEm: string; // já formatado (dd/mm/aaaa) — mantém o formatador puro/testável
  entrou: number;
  saiu: number;
  saldo: number;
  gastos: LinhaCategoria[];
  ganhos: LinhaCategoria[];
  lancamentos: LancamentoLista[];
};

function linhaTotal(rotulo: string, valor: number) {
  return `  ${rotulo.padEnd(8)}${formatBRL(valor).padStart(14)}`;
}

function linhaCategoria(c: LinhaCategoria) {
  return `  ${c.name.slice(0, 22).padEnd(22)}${formatBRL(c.total).padStart(14)}`;
}

// Monta o relatório do mês em texto puro, alinhado (bom em fonte monoespaçada).
// Função pura: recebe os dados já buscados e a data já formatada.
export function montarRelatorioTxt(d: DadosRelatorio): string {
  const linhas: string[] = [];
  linhas.push(`Fox Finance — Relatório de ${MESES[d.mes - 1]} de ${d.ano}`);
  linhas.push(`Gerado em ${d.geradoEm}`);
  linhas.push("");

  linhas.push("RESUMO");
  linhas.push(linhaTotal("Entrou", d.entrou));
  linhas.push(linhaTotal("Saiu", d.saiu));
  linhas.push(linhaTotal("Saldo", d.saldo));
  linhas.push("");

  if (d.gastos.length > 0) {
    linhas.push("ONDE MAIS GASTOU");
    for (const c of d.gastos) linhas.push(linhaCategoria(c));
    linhas.push("");
  }
  if (d.ganhos.length > 0) {
    linhas.push("ONDE MAIS GANHOU");
    for (const c of d.ganhos) linhas.push(linhaCategoria(c));
    linhas.push("");
  }

  linhas.push("LANÇAMENTOS");
  if (d.lancamentos.length === 0) {
    linhas.push("  (nenhum lançamento neste mês)");
  } else {
    for (const grupo of agruparPorDia(d.lancamentos)) {
      linhas.push(`  ${grupo.dia}`);
      for (const t of grupo.itens) {
        const sinal = t.type === "income" ? "+" : "-";
        const valor = `${sinal} ${formatBRL(t.amountCents)}`.padEnd(16);
        const desc = t.description || t.categoryName || "Sem categoria";
        const pm = t.paymentMethod ? labelFormaPagamento(t.paymentMethod) : null;
        linhas.push(`    ${valor}${desc}${pm ? `  (${pm})` : ""}`);
      }
    }
  }
  linhas.push("");
  linhas.push("— gerado pelo Fox Finance");
  return linhas.join("\n");
}
