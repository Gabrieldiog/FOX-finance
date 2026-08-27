import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listCategories } from "@/lib/data/categories";
import { metasComProgresso } from "@/lib/data/budgets";
import { mesCorrenteSP, serieMensal } from "@/lib/data/summary";
import { formatBRL } from "@/lib/format";
import { GerirMetas } from "./gerir-metas";

export default async function Metas() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const uid = session.user.id;
  const { ano, mes } = mesCorrenteSP();

  const [todasCategorias, metas, serie] = await Promise.all([
    listCategories(uid),
    metasComProgresso(uid, ano, mes),
    serieMensal(uid, 4),
  ]);
  const categorias = todasCategorias
    .filter((c) => c.type === "expense")
    .map((c) => ({ id: c.id, name: c.name, icon: c.icon, color: c.color }));

  const planejado = metas.reduce((s, m) => s + m.limitCents, 0);

  // Média dos meses já fechados (o corrente ainda está rolando, então sai).
  // O filtro é o conserto: serieMensal faz zero-fill, e sem ele a divisão era
  // sempre por 3 — inclusive contando meses em que a conta nem existia, o que
  // dividia o gasto real por até três.
  const completos = serie.slice(0, 3).filter((m) => m.entrou > 0 || m.saiu > 0);
  const media = completos.length
    ? Math.round(completos.reduce((s, m) => s + m.saiu, 0) / completos.length)
    : 0;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="-m-2 inline-flex min-h-11 items-center p-2 font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Metas</h1>
        <span className="w-12" />
      </header>

      <section className="rounded-2xl border border-pauta bg-feltro-alto p-6">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          Planejado pro mês
        </p>
        <p className="mt-2 font-serif text-[2.25rem] font-semibold leading-none tnum text-brilho">
          {formatBRL(planejado)}
        </p>
        <p className="mt-3 text-sm text-sage">
          {/* A frase antiga SUBTRAÍA grandezas diferentes: o planejado só cobre
              as categorias com meta, e a média é o gasto de TODAS. A diferença
              entre as duas não significa nada — e aparecia em verde, dizendo
              "a menos no plano", para quem estava estourando. Agora as duas são
              mostradas lado a lado, sem inventar uma conta entre elas. */}
          {planejado === 0 ? (
            "Defina metas abaixo pra montar seu plano de gastos do mês."
          ) : media > 0 ? (
            <>
              Suas metas cobrem <span className="text-creme">{formatBRL(planejado)}</span> dos{" "}
              <span className="text-creme">{formatBRL(media)}</span> que você gasta por mês, em
              média {completos.length === 1 ? "no último mês" : `nos últimos ${completos.length} meses`}.
            </>
          ) : (
            "Soma das suas metas."
          )}
        </p>
      </section>

      <GerirMetas categorias={categorias} metas={metas} />
    </main>
  );
}
