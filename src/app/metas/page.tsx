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
  // Média dos 3 meses já fechados (exclui o corrente, que ainda está rolando).
  const completos = serie.slice(0, 3);
  const media = completos.length
    ? Math.round(completos.reduce((s, m) => s + m.saiu, 0) / completos.length)
    : 0;
  const difMedia = planejado - media;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Metas</h1>
        <span className="w-12" />
      </header>

      <section className="rounded-2xl border border-pauta bg-feltro-alto p-6">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
          Planejado pro mês que vem
        </p>
        <p className="mt-2 font-serif text-[2.25rem] font-semibold leading-none tnum text-brilho">
          {formatBRL(planejado)}
        </p>
        <p className="mt-3 text-sm text-sage">
          {planejado === 0 ? (
            "Defina metas abaixo pra montar seu plano de gastos do mês."
          ) : media > 0 ? (
            <>
              Nos últimos 3 meses você gastou{" "}
              <span className="text-creme">{formatBRL(media)}</span> por mês, em média —{" "}
              {difMedia === 0 ? (
                "seu plano bate com a média."
              ) : difMedia < 0 ? (
                <span className="text-brilho">
                  {formatBRL(Math.abs(difMedia))} a menos no plano.
                </span>
              ) : (
                <span className="text-brasa">{formatBRL(difMedia)} a mais no plano.</span>
              )}
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
