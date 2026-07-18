import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { searchTransactions } from "@/lib/data/transactions";
import { agruparPorDia } from "@/lib/format";
import { IconeCategoria } from "@/components/icone-categoria";
import { ItemLancamento } from "@/components/item-lancamento";
import { BuscaLancamentos } from "./busca";

const PASSO = 30;

export default async function Lancamentos({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tipo?: string; mostrar?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const sp = await searchParams;
  const q = sp.q ?? "";
  const tipo = sp.tipo === "expense" || sp.tipo === "income" ? sp.tipo : undefined;
  const mostrar = Math.min(Math.max(Number(sp.mostrar) || PASSO, PASSO), 300);

  // Traz mostrar+1 pra saber se ainda há mais além do que exibimos.
  const linhas = await searchTransactions(session.user.id, { q, tipo, limit: mostrar });
  const temMais = linhas.length > mostrar;
  const itens = temMais ? linhas.slice(0, mostrar) : linhas;
  const grupos = agruparPorDia(itens);
  const buscando = q.trim() !== "" || tipo != null;

  const paramsMais = new URLSearchParams();
  if (q.trim()) paramsMais.set("q", q.trim());
  if (tipo) paramsMais.set("tipo", tipo);
  paramsMais.set("mostrar", String(mostrar + PASSO));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Histórico</h1>
        <span className="w-12" />
      </header>

      <BuscaLancamentos qInicial={q} tipoInicial={tipo ?? ""} />

      {itens.length === 0 ? (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-pauta bg-feltro-topo px-6 py-12 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-feltro text-sage">
            <IconeCategoria nome={buscando ? "dots" : "receipt"} className="h-7 w-7" />
          </span>
          <p className="text-sm text-sage">
            {buscando
              ? "Nada encontrado com esses filtros."
              : "Você ainda não registrou nenhum lançamento."}
          </p>
        </section>
      ) : (
        <section className="flex flex-col gap-4">
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

          {temMais && (
            <Link
              href={`/lancamentos?${paramsMais.toString()}`}
              scroll={false}
              className="mt-1 flex h-12 items-center justify-center rounded-xl border border-pauta font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:border-brilho hover:text-brilho"
            >
              Ver mais
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
