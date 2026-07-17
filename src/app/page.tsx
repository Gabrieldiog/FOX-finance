import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { resumoDoPeriodo, type Periodo } from "@/lib/data/summary";
import { listRecentTransactions } from "@/lib/data/transactions";
import { formatBRL } from "@/lib/format";
import { SairBotao } from "@/components/sair-botao";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ periodo?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Fox</h1>
          <p className="mt-1 text-zinc-500">Gestão financeira pessoal.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/entrar" className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-5 font-medium text-white dark:bg-white dark:text-zinc-900">
            Entrar
          </Link>
          <Link href="/criar-conta" className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5 font-medium dark:border-zinc-700">
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
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold tracking-tight">Fox</h1>
        <div className="flex items-center gap-3">
          <Link href="/conta" className="text-sm text-zinc-500">
            Conta
          </Link>
          <SairBotao />
        </div>
      </header>

      <div className="flex rounded-full border border-zinc-200 p-0.5 text-sm dark:border-zinc-800">
        <Link
          href="/?periodo=semana"
          className={`flex-1 rounded-full py-1.5 text-center ${periodo === "semana" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Semana
        </Link>
        <Link
          href="/?periodo=mes"
          className={`flex-1 rounded-full py-1.5 text-center ${periodo === "mes" ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-500"}`}
        >
          Mês
        </Link>
      </div>

      <section className="rounded-2xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="text-sm text-zinc-500">{sobrou ? "Sobrou" : "Faltou"}</p>
        <p className={`text-4xl font-semibold tabular-nums ${sobrou ? "text-emerald-600" : "text-red-600"}`}>
          {formatBRL(Math.abs(r.saldo))}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div>
            <p className="text-zinc-500">Entrou</p>
            <p className="tabular-nums text-emerald-600">{formatBRL(r.entrou)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Saiu</p>
            <p className="tabular-nums text-red-600">{formatBRL(r.saiu)}</p>
          </div>
          <div>
            <p className="text-zinc-500">Saldo</p>
            <p className="tabular-nums">{formatBRL(r.saldo)}</p>
          </div>
        </div>
      </section>

      {r.categorias.length > 0 && (
        <section className="flex flex-col gap-3">
          <p className="text-sm text-zinc-500">Para onde foi</p>
          {r.categorias.map((c) => (
            <div key={c.name} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{c.name}</span>
                <span className="tabular-nums text-zinc-500">{formatBRL(c.total)}</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-2 rounded-full"
                  style={{ width: `${(c.total / maior) * 100}%`, backgroundColor: c.color }}
                />
              </div>
            </div>
          ))}
        </section>
      )}

      {ultimos.length > 0 && (
        <section className="flex flex-col gap-2">
          <p className="text-sm text-zinc-500">Últimos lançamentos</p>
          {ultimos.map((t) => (
            <Link
              key={t.id}
              href={`/editar/${t.id}`}
              className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
            >
              <span className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: t.categoryColor ?? "#64748b" }}
                />
                {t.description || t.categoryName || "Sem categoria"}
              </span>
              <span className={`tabular-nums text-sm ${t.type === "income" ? "text-emerald-600" : "text-red-600"}`}>
                {t.type === "income" ? "+" : "−"}
                {formatBRL(t.amountCents)}
              </span>
            </Link>
          ))}
        </section>
      )}

      <Link
        href="/novo"
        className="sticky bottom-4 mt-auto flex h-12 items-center justify-center rounded-full bg-zinc-900 font-medium text-white shadow-lg dark:bg-white dark:text-zinc-900"
      >
        Novo lançamento
      </Link>
    </main>
  );
}
