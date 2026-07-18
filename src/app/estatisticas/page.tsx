import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import {
  detalheMes,
  mesCorrenteSP,
  serieAnual,
  serieMensal,
  type CategoriaTotal,
  type SerieItem,
} from "@/lib/data/summary";
import { formatBRL } from "@/lib/format";
import { IconeCategoria } from "@/components/icone-categoria";

function rotuloMesLongo(ano: number, mes: number) {
  const s = new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function rotuloMesCurto(ano: number, mes: number) {
  return new Date(Date.UTC(ano, mes - 1, 1))
    .toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" })
    .replace(".", "");
}

// Gráfico de barras agrupadas (entrou/saiu por período). CSS puro, sem lib.
function Grafico({ serie, selecionado }: { serie: SerieItem[]; selecionado: string }) {
  const max = Math.max(1, ...serie.flatMap((s) => [s.entrou, s.saiu]));
  const ALTURA = 112; // px da área das barras
  return (
    <div className="rounded-2xl border border-pauta bg-feltro-alto p-4">
      <div className="flex items-end justify-between gap-1.5">
        {serie.map((s) => {
          const ativo = s.key === selecionado;
          const barras = (
            <div className="flex w-full flex-col items-center gap-2">
              <div className="flex items-end gap-1" style={{ height: ALTURA }}>
                <div
                  className="w-2.5 rounded-t bg-brilho"
                  style={{ height: s.entrou > 0 ? Math.max(4, (s.entrou / max) * ALTURA) : 0 }}
                />
                <div
                  className="w-2.5 rounded-t bg-alerta"
                  style={{ height: s.saiu > 0 ? Math.max(4, (s.saiu / max) * ALTURA) : 0 }}
                />
              </div>
              <span
                className={`font-mono text-[0.6rem] uppercase tracking-[0.08em] ${ativo ? "text-creme" : "text-sage"}`}
              >
                {s.label}
              </span>
            </div>
          );
          const classe = `flex flex-1 justify-center rounded-lg py-1 ${ativo ? "bg-brilho/10" : ""}`;
          return s.mes ? (
            <Link key={s.key} href={`/estatisticas?mes=${s.key}`} scroll={false} className={classe}>
              {barras}
            </Link>
          ) : (
            <div key={s.key} className={classe}>
              {barras}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-center gap-4 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-brilho" /> entrou
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-alerta" /> saiu
        </span>
      </div>
    </div>
  );
}

function Delta({ atual, anterior, maiorEhBom }: { atual: number; anterior: number; maiorEhBom: boolean }) {
  const dif = atual - anterior;
  if (dif === 0) return <span className="font-mono text-[0.62rem] text-sage">→ igual</span>;
  const bom = dif > 0 === maiorEhBom;
  // Sem "R$" (o contexto já é dinheiro) pra caber na coluna estreita.
  const valor = formatBRL(Math.abs(dif)).replace("R$", "").trim();
  return (
    <span className={`font-mono text-[0.62rem] ${bom ? "text-brilho" : "text-alerta"}`}>
      {dif > 0 ? "↑" : "↓"} {valor}
    </span>
  );
}

function ListaCategorias({ titulo, itens }: { titulo: string; itens: CategoriaTotal[] }) {
  const maior = Math.max(1, ...itens.map((c) => c.total));
  return (
    <section className="flex flex-col gap-3">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">{titulo}</p>
      {itens.length === 0 ? (
        <p className="text-sm text-sage">Nada neste mês.</p>
      ) : (
        itens.map((c) => (
          <div key={c.name} className="flex items-center gap-3">
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${c.color}1f`, color: c.color }}
            >
              <IconeCategoria nome={c.icon} className="h-[18px] w-[18px]" />
            </span>
            <div className="flex flex-1 flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-creme">{c.name}</span>
                <span className="font-serif tnum text-sage">{formatBRL(c.total)}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-pauta">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(c.total / maior) * 100}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export default async function Estatisticas({
  searchParams,
}: {
  searchParams: Promise<{ g?: string; mes?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const uid = session.user.id;

  const sp = await searchParams;
  const granularidade = sp.g === "ano" ? "ano" : "mes";

  // Mês selecionado pro detalhe (default = mês corrente).
  const corrente = mesCorrenteSP();
  let ano = corrente.ano;
  let mes = corrente.mes;
  const m = /^(\d{4})-(\d{2})$/.exec(sp.mes ?? "");
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (mo >= 1 && mo <= 12 && y >= 2000 && y <= corrente.ano + 1) {
      ano = y;
      mes = mo;
    }
  }

  const anterior = new Date(Date.UTC(ano, mes - 2, 1));
  const antAno = anterior.getUTCFullYear();
  const antMes = anterior.getUTCMonth() + 1;
  const proximo = new Date(Date.UTC(ano, mes, 1));
  const proxAno = proximo.getUTCFullYear();
  const proxMes = proximo.getUTCMonth() + 1;
  const noFuturo = proxAno > corrente.ano || (proxAno === corrente.ano && proxMes > corrente.mes);

  const [serie, atual, ant] = await Promise.all([
    granularidade === "ano" ? serieAnual(uid, 5) : serieMensal(uid, 6),
    detalheMes(uid, ano, mes),
    detalheMes(uid, antAno, antMes),
  ]);
  const chaveMes = `${ano}-${String(mes).padStart(2, "0")}`;

  const abaClasse = (ativa: boolean) =>
    `flex-1 rounded-full py-2 text-center transition ${ativa ? "bg-brilho text-feltro" : "text-sage"}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Estatísticas</h1>
        <span className="w-12" />
      </header>

      <div className="flex rounded-full border border-pauta bg-feltro-alto p-1 font-mono text-xs uppercase tracking-[0.12em]">
        <Link href="/estatisticas?g=mes" scroll={false} className={abaClasse(granularidade === "mes")}>
          Por mês
        </Link>
        <Link href="/estatisticas?g=ano" scroll={false} className={abaClasse(granularidade === "ano")}>
          Por ano
        </Link>
      </div>

      <Grafico serie={serie} selecionado={granularidade === "ano" ? String(ano) : chaveMes} />

      {/* Detalhe do mês selecionado */}
      <div className="flex items-center justify-between">
        <Link
          href={`/estatisticas?mes=${antAno}-${String(antMes).padStart(2, "0")}`}
          scroll={false}
          aria-label="Mês anterior"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-pauta text-sage transition hover:text-creme"
        >
          ‹
        </Link>
        <p className="font-serif text-lg font-semibold">{rotuloMesLongo(ano, mes)}</p>
        {noFuturo ? (
          <span className="h-9 w-9" />
        ) : (
          <Link
            href={`/estatisticas?mes=${proxAno}-${String(proxMes).padStart(2, "0")}`}
            scroll={false}
            aria-label="Próximo mês"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-pauta text-sage transition hover:text-creme"
          >
            ›
          </Link>
        )}
      </div>

      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-pauta bg-feltro-alto">
        <div className="border-r border-pauta p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Entrou</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-brilho">{formatBRL(atual.entrou)}</p>
          <div className="mt-1">
            <Delta atual={atual.entrou} anterior={ant.entrou} maiorEhBom />
          </div>
        </div>
        <div className="border-r border-pauta p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saiu</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-alerta">{formatBRL(atual.saiu)}</p>
          <div className="mt-1">
            <Delta atual={atual.saiu} anterior={ant.saiu} maiorEhBom={false} />
          </div>
        </div>
        <div className="p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saldo</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-creme">{formatBRL(atual.saldo)}</p>
          <div className="mt-1">
            <Delta atual={atual.saldo} anterior={ant.saldo} maiorEhBom />
          </div>
        </div>
      </div>
      <p className="-mt-3 font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage">
        setas comparam com {rotuloMesCurto(antAno, antMes)}
      </p>

      <ListaCategorias titulo="Onde mais gastou" itens={atual.gastos} />
      <ListaCategorias titulo="Onde mais ganhou" itens={atual.ganhos} />
    </main>
  );
}
