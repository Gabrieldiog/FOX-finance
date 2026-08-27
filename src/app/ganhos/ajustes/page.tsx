import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustos } from "@/lib/data/custos";
import { FormaCustos } from "./forma-custos";

export default async function AjustesDeCusto() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const custos = await getCustos(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/ganhos/vale-a-pena"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Meus custos</h1>
        <span className="w-12" />
      </header>

      <p className="text-sm text-sage">
        Estes números são só seus e não mexem no seu saldo. Eles servem para responder se uma
        corrida compensa — o abastecimento continua saindo do saldo no dia em que você paga.
      </p>

      <FormaCustos inicial={custos} />
    </main>
  );
}
