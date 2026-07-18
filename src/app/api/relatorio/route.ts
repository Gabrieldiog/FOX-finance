import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { detalheMes, mesCorrenteSP } from "@/lib/data/summary";
import { listTransactionsDoMes } from "@/lib/data/transactions";
import { montarRelatorioTxt } from "@/lib/relatorio";

// Relatório legível de um mês, em .txt. Sempre escopado à sessão.
export async function GET(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }
  const uid = session.user.id;

  const corrente = mesCorrenteSP();
  let ano = corrente.ano;
  let mes = corrente.mes;
  const m = /^(\d{4})-(\d{2})$/.exec(new URL(request.url).searchParams.get("mes") ?? "");
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (mo >= 1 && mo <= 12 && y >= 2000 && y <= corrente.ano + 1) {
      ano = y;
      mes = mo;
    }
  }

  const [detalhe, lancamentos] = await Promise.all([
    detalheMes(uid, ano, mes),
    listTransactionsDoMes(uid, ano, mes),
  ]);

  const geradoEm = new Date().toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const txt = montarRelatorioTxt({
    ano,
    mes,
    geradoEm,
    entrou: detalhe.entrou,
    saiu: detalhe.saiu,
    saldo: detalhe.saldo,
    gastos: detalhe.gastos.map((g) => ({ name: g.name, total: g.total })),
    ganhos: detalhe.ganhos.map((g) => ({ name: g.name, total: g.total })),
    lancamentos,
  });

  return new NextResponse(txt, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "content-disposition": `attachment; filename="fox-relatorio-${ano}-${String(mes).padStart(2, "0")}.txt"`,
    },
  });
}
