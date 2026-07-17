import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resumoDoPeriodo, type Periodo } from "@/lib/data/summary";
import { listRecentTransactions } from "@/lib/data/transactions";
import { formatBRL } from "@/lib/format";
import { SairBotao } from "@/components/sair-botao";
import { Marca, FoxGlyph } from "@/components/marca";
import { NumeroDinheiro } from "@/components/numero-dinheiro";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-center gap-10 px-6 py-16">
        <div className="flex flex-col items-center gap-5 text-center">
          <FoxGlyph className="h-20 w-20" />
          <div>
            <h1 className="font-display text-4xl font-semibold tracking-tight">Fox</h1>
            <p className="mt-2 text-nevoa-fraca">
              Anote no susto, entenda com calma. Sua grana, do seu jeito.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/entrar"
            className="flex h-12 items-center justify-center rounded-full bg-ambar px-5 font-medium text-tinta transition active:scale-[.98]"
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className="flex h-12 items-center justify-center rounded-full border border-linha px-5 font-medium transition active:scale-[.98]"
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

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pb-28 pt-8">
      <header className="flex items-center justify-between">
        <Marca />
        <div className="flex items-center gap-4 text-sm text-nevoa-fraca">
          <Link href="/conta" className="transition hover:text-nevoa">
            Conta
          </Link>
          <SairBotao />
        </div>
      </header>

      <div className="flex rounded-full border border-linha p-1 text-sm">
        <Link
          href="/?periodo=semana"
          className={`flex-1 rounded-full py-1.5 text-center transition ${periodo === "semana" ? "bg-nevoa text-breu" : "text-nevoa-fraca"}`}
        >
          Semana
        </Link>
        <Link
          href="/?periodo=mes"
          className={`flex-1 rounded-full py-1.5 text-center transition ${periodo === "mes" ? "bg-nevoa text-breu" : "text-nevoa-fraca"}`}
        >
          Mês
        </Link>
      </div>

      <section className="rounded-3xl border border-linha bg-carvao p-7">
        <p className="text-xs font-medium uppercase tracking-wider text-nevoa-fraca">
          {sobrou ? "Sobrou" : "Faltou"}
        </p>
        <NumeroDinheiro
          cents={Math.abs(r.saldo)}
          className={`mt-1 block font-display text-5xl font-semibold ${sobrou ? "text-entrou" : "text-saiu"}`}
        />
        <div className="mt-6 grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-nevoa-fraca">Entrou</p>
            <p className="tnum mt-0.5 font-medium text-entrou">{formatBRL(r.entrou)}</p>
          </div>
          <div>
            <p className="text-nevoa-fraca">Saiu</p>
            <p className="tnum mt-0.5 font-medium text-saiu">{formatBRL(r.saiu)}</p>
          </div>
          <div>
            <p className="text-nevoa-fraca">Saldo</p>
            <p className="tnum mt-0.5 font-medium">{formatBRL(r.saldo)}</p>
          </div>
        </div>
      </section>

      {r.categorias.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-xs font-medium uppercase tracking-wider text-nevoa-fraca">Para onde foi</p>
          {r.categorias.map((c) => (
            <div key={c.name} className="flex flex-col gap-1.5">
              <div className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="tnum text-nevoa-fraca">{formatBRL(c.total)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-linha">
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
          <p className="text-xs font-medium uppercase tracking-wider text-nevoa-fraca">
            Últimos lançamentos
          </p>
          {ultimos.map((t) => (
            <Link
              key={t.id}
              href={`/editar/${t.id}`}
              className="flex items-center justify-between rounded-2xl border border-linha bg-carvao px-4 py-3 transition active:scale-[.99]"
            >
              <span className="flex items-center gap-2.5 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.categoryColor ?? "var(--nevoa-fraca)" }}
                />
                {t.description || t.categoryName || "Sem categoria"}
              </span>
              <span
                className={`tnum text-sm font-medium ${t.type === "income" ? "text-entrou" : "text-saiu"}`}
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
        className="fixed inset-x-0 bottom-6 mx-auto flex h-14 w-[calc(100%-3rem)] max-w-[26rem] items-center justify-center gap-2 rounded-full bg-ambar font-medium text-tinta shadow-lg shadow-black/20 transition active:scale-[.98]"
      >
        <span className="text-lg leading-none">+</span> Novo lançamento
      </Link>
    </main>
  );
}
