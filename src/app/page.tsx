import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resumoDoPeriodo, type Periodo } from "@/lib/data/summary";
import { listRecentTransactions } from "@/lib/data/transactions";
import { formatBRL } from "@/lib/format";
import { SairBotao } from "@/components/sair-botao";
import { Marca } from "@/components/marca";
import { NumeroDinheiro } from "@/components/numero-dinheiro";
import { FoxMascote } from "@/components/fox-mascote";
import { Aterrissar } from "@/components/aterrissar";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="mx-auto flex min-h-svh w-full max-w-md flex-1 flex-col justify-center gap-10 px-6 py-16 pt-safe pb-safe">
        <div className="flex flex-col items-center gap-5 text-center">
          <FoxMascote size={128} seguirMouse />
          <div>
            <h1 className="font-display text-4xl font-extrabold tracking-tight">
              Fox <span className="text-verde-texto">Finance</span>
            </h1>
            <p className="mt-2 text-nevoa-fraca">
              Anote no susto, entenda com calma. Sua grana, do seu jeito.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/entrar"
            className="flex h-13 items-center justify-center rounded-lg bg-verde px-5 font-display font-bold text-tinta shadow-[0_8px_22px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98]"
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className="flex h-13 items-center justify-center rounded-lg border border-linha bg-carvao px-5 font-semibold text-verde-texto transition hover:border-verde/50 active:scale-[.98]"
          >
            Criar conta
          </Link>
        </div>
      </main>
    );
  }

  const sp = await searchParams;
  const periodo: Periodo = sp.periodo === "semana" ? "semana" : "mes";
  const r = await resumoDoPeriodo(session.user.id, periodo);
  const ultimos = await listRecentTransactions(session.user.id, 15);
  const sobrou = r.saldo >= 0;
  const maior = Math.max(1, ...r.categorias.map((c) => c.total));
  const vazio = r.entrou === 0 && r.saiu === 0 && ultimos.length === 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-5 pt-safe pb-[calc(6rem+env(safe-area-inset-bottom))] [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between">
        <Marca />
        <div className="flex items-center gap-4 text-sm font-semibold text-nevoa-fraca">
          <Link href="/conta" className="transition hover:text-nevoa">
            Conta
          </Link>
          <SairBotao />
        </div>
      </header>

      <div className="flex rounded-full border border-linha bg-carvao p-1 text-sm font-semibold shadow-[var(--sombra-card)]">
        <Link
          href="/?periodo=semana"
          className={`flex-1 rounded-full py-2 text-center transition ${periodo === "semana" ? "bg-verde text-tinta" : "text-nevoa-fraca"}`}
        >
          Semana
        </Link>
        <Link
          href="/?periodo=mes"
          className={`flex-1 rounded-full py-2 text-center transition ${periodo === "mes" ? "bg-verde text-tinta" : "text-nevoa-fraca"}`}
        >
          Mês
        </Link>
      </div>

      {/* Card-herói (o único com gradiente) */}
      <Aterrissar>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-verde to-verde-vivo p-7 text-menta-tinta shadow-[0_20px_50px_-20px_var(--verde)]">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
          <p className="font-display text-sm font-bold uppercase tracking-wider opacity-80">
            {sobrou ? "Sobrou" : "Faltou"}
          </p>
          <NumeroDinheiro
            cents={Math.abs(r.saldo)}
            className="mt-1 block font-display text-5xl font-extrabold"
          />
          <p className="mt-2 text-sm font-semibold opacity-80">
            {sobrou ? "No verde — mandou bem." : "No vermelho neste período."} · {periodo === "semana" ? "esta semana" : "este mês"}
          </p>
        </section>
      </Aterrissar>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-linha bg-carvao p-4 shadow-[var(--sombra-card)]">
          <p className="text-xs font-semibold text-nevoa-fraca">Entrou</p>
          <p className="dinheiro mt-1 font-bold text-entrou">{formatBRL(r.entrou)}</p>
        </div>
        <div className="rounded-2xl border border-linha bg-carvao p-4 shadow-[var(--sombra-card)]">
          <p className="text-xs font-semibold text-nevoa-fraca">Saiu</p>
          <p className="dinheiro mt-1 font-bold text-saiu">{formatBRL(r.saiu)}</p>
        </div>
        <div className="rounded-2xl border border-linha bg-carvao p-4 shadow-[var(--sombra-card)]">
          <p className="text-xs font-semibold text-nevoa-fraca">Saldo</p>
          <p className="dinheiro mt-1 font-bold">{formatBRL(r.saldo)}</p>
        </div>
      </div>

      {vazio && (
        <section className="flex flex-col items-center gap-4 rounded-3xl border border-linha bg-carvao px-6 py-10 text-center shadow-[var(--sombra-card)]">
          <FoxMascote size={120} />
          <div>
            <p className="font-display text-lg font-bold">Nada por aqui ainda</p>
            <p className="mt-1 text-sm text-nevoa-fraca">
              Registre seu primeiro gasto ou ganho e o Fox cuida do resto.
            </p>
          </div>
        </section>
      )}

      {r.categorias.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-nevoa-fraca">
            Para onde foi
          </p>
          {r.categorias.map((c) => (
            <div key={c.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span className="font-semibold">{c.name}</span>
                <span className="dinheiro text-nevoa-fraca">{formatBRL(c.total)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-menta">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${(c.total / maior) * 100}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {ultimos.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="font-display text-sm font-bold uppercase tracking-wider text-nevoa-fraca">
            Últimos lançamentos
          </p>
          {ultimos.map((t) => (
            <Link
              key={t.id}
              href={`/editar/${t.id}`}
              className="flex items-center justify-between rounded-2xl border border-linha bg-carvao px-4 py-3.5 shadow-[var(--sombra-card)] transition hover:-translate-y-0.5 active:scale-[.99]"
            >
              <span className="flex items-center gap-3 text-sm font-semibold">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ backgroundColor: t.categoryColor ?? "var(--nevoa-fraca)" }}
                />
                {t.description || t.categoryName || "Sem categoria"}
              </span>
              <span
                className={`dinheiro text-sm font-bold ${t.type === "income" ? "text-entrou" : "text-saiu"}`}
              >
                {t.type === "income" ? "+" : "−"}
                {formatBRL(t.amountCents)}
              </span>
            </Link>
          ))}
        </section>
      )}

      <Link
        href="/novo"
        className="fixed inset-x-0 z-40 mx-auto flex h-14 w-[calc(100%-2.5rem)] max-w-[26rem] items-center justify-center gap-2 rounded-full bg-verde font-display font-bold text-tinta shadow-[0_12px_30px_-8px_var(--verde)] transition active:scale-[.98] bottom-[calc(1.5rem+env(safe-area-inset-bottom))]"
      >
        <span className="text-xl leading-none">+</span> Novo lançamento
      </Link>
    </main>
  );
}
