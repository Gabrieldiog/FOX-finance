import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resumoDoPeriodo, type Periodo } from "@/lib/data/summary";
import { listRecentTransactions } from "@/lib/data/transactions";
import { formatBRL, agruparPorDia } from "@/lib/format";
import { SairBotao } from "@/components/sair-botao";
import { FoxGlyph } from "@/components/marca";
import { NumeroDinheiro } from "@/components/numero-dinheiro";
import { IconeCategoria } from "@/components/icone-categoria";
import { ItemLancamento } from "@/components/item-lancamento";
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

  const sp = await searchParams;
  const periodo: Periodo = sp.periodo === "semana" ? "semana" : "mes";
  const r = await resumoDoPeriodo(session.user.id, periodo);
  const ultimos = await listRecentTransactions(session.user.id, 15);
  const sobrou = r.saldo >= 0;
  const maior = Math.max(1, ...r.categorias.map((c) => c.total));
  const vazio = r.entrou === 0 && r.saiu === 0 && ultimos.length === 0;
  const quando = periodo === "semana" ? "esta semana" : "este mês";

  const grupos = agruparPorDia(ultimos);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(6rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <span className="flex items-center gap-2">
          <FoxGlyph className="h-7 w-7" />
          <span className="font-serif text-xl font-semibold tracking-tight">
            Fox <span className="italic text-brilho">Finance</span>
          </span>
        </span>
        <div className="flex items-center gap-4 font-mono text-xs uppercase tracking-[0.14em] text-sage">
          <Link href="/estatisticas" className="transition hover:text-creme">
            Análise
          </Link>
          <Link href="/conta" className="transition hover:text-creme">
            Conta
          </Link>
          <SairBotao />
        </div>
      </header>

      <div className="flex rounded-full border border-pauta bg-feltro-alto p-1 font-mono text-xs uppercase tracking-[0.12em]">
        <Link
          href="/?periodo=semana"
          className={`flex-1 rounded-full py-2 text-center transition ${periodo === "semana" ? "bg-brilho text-feltro" : "text-sage"}`}
        >
          Semana
        </Link>
        <Link
          href="/?periodo=mes"
          className={`flex-1 rounded-full py-2 text-center transition ${periodo === "mes" ? "bg-brilho text-feltro" : "text-sage"}`}
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
            className={`mt-2 block font-serif text-[2.75rem] font-semibold leading-none tnum ${sobrou ? "text-brilho" : "text-alerta"}`}
          />
          <p className="mt-3 text-sm text-sage">
            {sobrou ? "No verde — fechou no azul." : "No vermelho neste período."}
          </p>
        </section>
      </Aterrissar>

      {/* Entrou / Saiu / Saldo, divididos por pauta fina. */}
      <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-pauta bg-feltro-alto">
        <div className="border-r border-pauta p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Entrou</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-brilho">{formatBRL(r.entrou)}</p>
        </div>
        <div className="border-r border-pauta p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saiu</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-alerta">{formatBRL(r.saiu)}</p>
        </div>
        <div className="p-4">
          <p className="font-mono text-[0.62rem] uppercase tracking-[0.12em] text-sage">Saldo</p>
          <p className="mt-1 font-serif text-[0.82rem] leading-tight tnum text-creme">{formatBRL(r.saldo)}</p>
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
        <section className="flex flex-col gap-4">
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
            Para onde foi · {quando}
          </p>
          {r.categorias.map((c) => (
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
          ))}
        </section>
      )}

      {grupos.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
              Últimos lançamentos
            </p>
            <Link
              href="/lancamentos"
              className="font-mono text-[0.65rem] uppercase tracking-[0.14em] text-brilho transition hover:opacity-80"
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
