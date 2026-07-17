import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ExcluirConta } from "./excluir-conta";

export default async function Conta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 pt-safe pb-[calc(2rem+env(safe-area-inset-bottom))] [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between text-sm font-semibold text-nevoa-fraca">
        <Link href="/" className="transition hover:text-nevoa">
          ← Voltar
        </Link>
        <h1 className="font-display text-lg font-bold text-nevoa">Conta</h1>
        <span className="w-12" />
      </header>

      <div className="rounded-2xl border border-linha bg-carvao p-5 shadow-[var(--sombra-card)]">
        <p className="font-display text-lg font-bold">{session.user.name}</p>
        <p className="text-sm text-nevoa-fraca">{session.user.email}</p>
      </div>

      <a
        href="/api/export"
        className="flex h-13 items-center justify-center rounded-lg border border-linha bg-carvao font-semibold text-verde-texto transition hover:border-verde/50 active:scale-[.98]"
      >
        Exportar meus dados
      </a>

      <ExcluirConta />

      <p className="mt-auto text-center text-xs text-nevoa-fraca">
        <Link href="/privacidade" className="underline">
          Política de privacidade
        </Link>
      </p>
    </main>
  );
}
