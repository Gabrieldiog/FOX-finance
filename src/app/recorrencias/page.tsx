import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listRecurringView } from "@/lib/data/recorrencias";
import { GerirRecorrencias } from "./gerir-recorrencias";

export default async function Recorrencias() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const recorrencias = await listRecurringView(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/conta"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Recorrentes</h1>
        <span className="w-12" />
      </header>

      <p className="text-sm text-sage">
        Lançamentos que se repetem todo mês. No dia marcado, entram sozinhos quando você abre o
        app — você não precisa registrar de novo.
      </p>

      <GerirRecorrencias recorrencias={recorrencias} />
    </main>
  );
}
