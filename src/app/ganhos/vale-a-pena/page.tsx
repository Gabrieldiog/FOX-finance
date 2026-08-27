import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getCustos } from "@/lib/data/custos";
import { Calculadora } from "./calculadora";

export default async function ValeAPena() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  // Busca uma vez no servidor. Daqui em diante a calculadora é 100% local:
  // avaliarRota é função pura, então ela responde a cada tecla sem ida ao
  // servidor nenhuma.
  const custos = await getCustos(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="-m-2 inline-flex min-h-11 items-center p-2 font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Vale a pena?</h1>
        <span className="w-12" />
      </header>

      <Calculadora custos={custos} />
    </main>
  );
}
