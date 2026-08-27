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
  searchParams: Promise<{ q?: string; tipo?: string; antes?: string; antesId?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const sp = await searchParams;
  const q = sp.q ?? "";
  const tipo = sp.tipo === "expense" || sp.tipo === "income" ? sp.tipo : undefined;

  // Cursor: a data e o id do último lançamento da página anterior. Ambos
  // precisam ser válidos, senão a página começa do início — link estragado
  // não pode virar erro na cara de quem clicou.
  const dataAntes = sp.antes ? new Date(sp.antes) : null;
  const antes =
    dataAntes && !Number.isNaN(dataAntes.getTime()) && sp.antesId
      ? { occurredAt: dataAntes, id: sp.antesId }
      : undefined;

  // Traz PASSO+1 pra saber se ainda há mais além do que exibimos.
  const linhas = await searchTransactions(session.user.id, { q, tipo, limit: PASSO, antes });
  const temMais = linhas.length > PASSO;
  const itens = temMais ? linhas.slice(0, PASSO) : linhas;
  const grupos = agruparPorDia(itens);
  const buscando = q.trim() !== "" || tipo != null;
  const paginado = antes != null;

  // Link da próxima página: ancorado no ÚLTIMO item desta.
  const paramsMais = new URLSearchParams();
  if (q.trim()) paramsMais.set("q", q.trim());
  if (tipo) paramsMais.set("tipo", tipo);
  const ultimo = itens[itens.length - 1];
  if (ultimo) {
    paramsMais.set("antes", ultimo.occurredAt.toISOString());
    paramsMais.set("antesId", ultimo.id);
  }

  // Link de volta ao começo, preservando busca e filtro.
  const paramsInicio = new URLSearchParams();
  if (q.trim()) paramsInicio.set("q", q.trim());
  if (tipo) paramsInicio.set("tipo", tipo);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="-m-2 inline-flex min-h-11 items-center p-2 font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
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
            {paginado
              ? "Chegou ao fim do seu histórico."
              : buscando
                ? "Nada encontrado com esses filtros."
                : "Você ainda não registrou nenhum lançamento."}
          </p>
          {/* Sem esta saída, uma última página vazia deixaria a pessoa presa. */}
          {paginado && (
            <Link
              href={`/lancamentos${paramsInicio.toString() ? `?${paramsInicio}` : ""}`}
              className="flex h-12 items-center justify-center rounded-xl border border-pauta px-5 font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:border-brilho hover:text-brilho"
            >
              ← Voltar ao mais recente
            </Link>
          )}
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

          <div className="mt-1 flex flex-col gap-2">
            {temMais && (
              <Link
                href={`/lancamentos?${paramsMais.toString()}`}
                className="flex h-12 items-center justify-center rounded-xl border border-pauta font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:border-brilho hover:text-brilho"
              >
                Mais antigos →
              </Link>
            )}
            {paginado && (
              <Link
                href={`/lancamentos${paramsInicio.toString() ? `?${paramsInicio}` : ""}`}
                className="flex h-12 items-center justify-center rounded-xl font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
              >
                ← Voltar ao mais recente
              </Link>
            )}
          </div>
        </section>
      )}
    </main>
  );
}
