import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resumoDoPeriodo, type Periodo } from "@/lib/data/summary";
import { listRecentTransactions } from "@/lib/data/transactions";
import { materializarRecorrencias } from "@/lib/data/recorrencias";
import { getMetas, janelaDoMes, movimentoDoMes } from "@/lib/data/metas-mes";
import { hojeSP } from "@/lib/data/summary";
import { avaliarMetas } from "@/lib/metas-do-mes";
import { formatBRL, agruparPorDia } from "@/lib/format";
import { SairBotao } from "@/components/sair-botao";
import { FoxGlyph } from "@/components/marca";
import { NumeroDinheiro } from "@/components/numero-dinheiro";
import { IconeCategoria } from "@/components/icone-categoria";
import { ItemLancamento } from "@/components/item-lancamento";
import { ListaCategorias } from "@/components/lista-categorias";
import { Aterrissar } from "@/components/aterrissar";
import { LandingV2 } from "@/components/landing-v2";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return <LandingV2 />;
  }

  // Ao abrir o app, cria os lançamentos recorrentes que já venceram (idempotente).
  await materializarRecorrencias(session.user.id);

  const sp = await searchParams;
  const periodo: Periodo = sp.periodo === "semana" ? "semana" : "mes";
  // Em paralelo: são leituras independentes, e com o pipelining ligado (ver o
  // comentário do prepare em src/db/index.ts) as duas viajam numa ida só.
  // materializarRecorrencias fica FORA do Promise.all de propósito — ele
  // escreve, e o que ele grava precisa aparecer nestas duas leituras.
  const hoje = hojeSP();
  const [r, ultimos, metas, mov] = await Promise.all([
    resumoDoPeriodo(session.user.id, periodo),
    listRecentTransactions(session.user.id, 15),
    getMetas(session.user.id),
    movimentoDoMes(session.user.id, hoje.ano, hoje.mes),
  ]);

  // avaliarMetas devolve UMA frase só — duas viram ruído e ninguém lê nenhuma.
  const av = avaliarMetas(metas, { ...mov, ...janelaDoMes(hoje.ano, hoje.mes, hoje) });
  const sobrou = r.saldo >= 0;
  const vazio = r.entrou === 0 && r.saiu === 0 && ultimos.length === 0;
  const quando = periodo === "semana" ? "esta semana" : "este mês";

  const grupos = agruparPorDia(ultimos);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between gap-3 border-b border-pauta pb-4">
        <span className="flex min-w-0 items-center gap-2">
          <FoxGlyph className="h-7 w-7 shrink-0" />
          <span className="font-serif text-xl font-semibold tracking-tight">
            Fox <span className="italic text-brilho">Finance</span>
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-3 font-mono text-xs uppercase tracking-[0.14em] text-sage">
          <Link href="/estatisticas" className="-m-2 inline-flex min-h-11 items-center p-2 transition hover:text-creme">
            Análise
          </Link>
          <Link href="/conta" className="-m-2 inline-flex min-h-11 items-center p-2 transition hover:text-creme">
            Conta
          </Link>
          <SairBotao />
        </div>
      </header>

      <div className="flex rounded-full border border-pauta bg-feltro-alto p-1 font-mono text-xs uppercase tracking-[0.12em]">
        <Link
          href="/?periodo=semana"
          className={`flex min-h-11 flex-1 items-center justify-center rounded-full text-center transition ${periodo === "semana" ? "bg-brilho text-feltro" : "text-sage"}`}
        >
          Semana
        </Link>
        <Link
          href="/?periodo=mes"
          className={`flex min-h-11 flex-1 items-center justify-center rounded-full text-center transition ${periodo === "mes" ? "bg-brilho text-feltro" : "text-sage"}`}
        >
          Mês
        </Link>
      </div>

      {/* Saldo do período — o número-herói, sem gradiente (isso é cara de template). */}
      <Aterrissar>
        <section className="rounded-2xl border border-pauta bg-feltro-alto p-6">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
            {sobrou ? "Sobrou" : "Faltou"} · {quando}
          </p>
          <NumeroDinheiro
            cents={Math.abs(r.saldo)}
            className={`mt-2 block font-serif text-[clamp(1.75rem,9vw,2.75rem)] font-semibold leading-none tnum ${sobrou ? "text-brilho" : "text-alerta"}`}
          />
          <p className="mt-3 text-sm text-sage">
            {sobrou
              ? periodo === "semana"
                ? "Isso é o que sobrou pra você nesta semana."
                : "Isso é o que sobrou pra você neste mês."
              : periodo === "semana"
                ? "Você gastou mais do que entrou nesta semana."
                : "Você gastou mais do que entrou neste mês."}
          </p>

          {/* A frase da meta mora AQUI, colada no número que a pessoa veio ver.
              Dentro de /metas ela só seria lida por quem já foi procurar — e aí
              já não muda decisão nenhuma. */}
          {av.destaque && (
            <div className="mt-4 flex items-start gap-2.5 border-t border-pauta pt-4">
              <span
                aria-hidden
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                  av.gasto?.estado === "estourou" || av.economia?.estado === "negativo"
                    ? "bg-alerta"
                    : av.gasto?.estado === "perto"
                      ? "bg-brasa"
                      : "bg-brilho"
                }`}
              />
              <p className="text-sm leading-relaxed text-sage">{av.destaque}</p>
            </div>
          )}
        </section>
      </Aterrissar>

      {/* Metas mora AQUI agora, e não escondida dentro de Análise: é a tela que
          se abre toda hora, e a meta só serve se for lembrada antes de gastar. */}
      <Link
        href="/metas"
        className="flex min-h-13 items-center justify-between rounded-2xl border border-pauta bg-feltro-alto px-5 py-3.5 transition hover:border-brilho/50 active:scale-[.99]"
      >
        <span className="flex flex-col">
          <span className="text-sm font-medium text-creme">Minhas metas</span>
          <span className="text-xs text-sage">
            {metas.spendLimitCents === 0 && metas.saveTargetCents === 0
              ? "Defina quanto quer gastar e guardar"
              : "Quanto gastar e quanto guardar no mês"}
          </span>
        </span>
        <span className="font-serif text-brilho">→</span>
      </Link>

      {/* Entrou / Saiu / Saldo, divididos por pauta fina. */}
      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-pauta bg-feltro-alto">
        <div className="min-w-0 border-r border-pauta p-2.5 min-[360px]:p-3.5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Entrou</p>
          <p className="mt-1 font-serif text-[clamp(0.58rem,2.7vw,0.82rem)] leading-tight tnum text-brilho">
            {formatBRL(r.entrou)}
          </p>
        </div>
        <div className="min-w-0 border-r border-pauta p-2.5 min-[360px]:p-3.5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saiu</p>
          <p className="mt-1 font-serif text-[clamp(0.58rem,2.7vw,0.82rem)] leading-tight tnum text-alerta">
            {formatBRL(r.saiu)}
          </p>
        </div>
        <div className="min-w-0 p-2.5 min-[360px]:p-3.5">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saldo</p>
          <p className="mt-1 font-serif text-[clamp(0.58rem,2.7vw,0.82rem)] leading-tight tnum text-creme">
            {formatBRL(r.saldo)}
          </p>
        </div>
      </div>

      {vazio && (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-pauta bg-feltro-topo px-6 py-10 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-feltro text-brilho">
            <IconeCategoria nome="receipt" className="h-8 w-8" />
          </span>
          <div>
            <p className="font-serif text-lg font-semibold">Sua caderneta está limpa</p>
            <p className="mt-1 text-sm text-sage">
              Registre o primeiro gasto ou ganho e o Fox começa a somar.
            </p>
          </div>
        </section>
      )}

      {r.categorias.length > 0 && (
        <ListaCategorias titulo={`Para onde foi · ${quando}`} itens={r.categorias} />
      )}

      {grupos.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
              Últimos lançamentos
            </p>
            <Link
              href="/lancamentos"
              className="-m-2 inline-flex min-h-11 items-center p-2 font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brilho transition hover:opacity-80"
            >
              Ver tudo →
            </Link>
          </div>
          {grupos.map((grupo) => (
            <div key={grupo.dia} className="flex flex-col">
              <p className="mb-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-sage/80">
                {grupo.dia}
              </p>
              {grupo.itens.map((t) => (
                <ItemLancamento key={t.id} t={t} />
              ))}
            </div>
          ))}
        </section>
      )}

      <Link
        href="/novo"
        className="fixed inset-x-0 z-40 mx-auto flex h-14 w-[calc(100%-2.5rem)] max-w-[26rem] items-center justify-center gap-2 rounded-full bg-brilho font-serif text-lg font-semibold text-feltro shadow-[0_12px_30px_-8px_rgba(56,208,125,0.5)] transition active:scale-[.98] bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <IconeCategoria nome="plus" className="h-5 w-5" /> Novo lançamento
      </Link>
    </main>
  );
}
