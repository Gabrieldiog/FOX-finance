import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getMetas, janelaDoMes, movimentoDoMes } from "@/lib/data/metas-mes";
import { hojeSP } from "@/lib/data/summary";
import { FormaMetas } from "./forma-metas";

export default async function Metas() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");
  const uid = session.user.id;

  const hoje = hojeSP();
  const [metas, mov] = await Promise.all([
    getMetas(uid),
    movimentoDoMes(uid, hoje.ano, hoje.mes),
  ]);
  const janela = janelaDoMes(hoje.ano, hoje.mes, hoje);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="-m-2 inline-flex min-h-11 items-center p-2 font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Minhas metas</h1>
        <span className="w-12" />
      </header>

      <p className="text-sm leading-relaxed text-sage">
        Duas perguntas, e só. Quanto você quer gastar no mês, e quanto quer que sobre no fim
        dele.
      </p>

      <FormaMetas inicial={metas} movimento={{ ...mov, ...janela }} />
    </main>
  );
}
