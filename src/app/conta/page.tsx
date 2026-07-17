import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ExcluirConta } from "./excluir-conta";

export default async function Conta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-8">
      <header className="flex items-center justify-between text-sm text-nevoa-fraca">
        <Link href="/" className="transition hover:text-nevoa">
          Voltar
        </Link>
        <h1 className="font-display text-lg font-semibold text-nevoa">Conta</h1>
        <span className="w-12" />
      </header>

      <div className="rounded-2xl border border-linha bg-carvao p-5">
        <p>{session.user.name}</p>
        <p className="text-sm text-nevoa-fraca">{session.user.email}</p>
      </div>

      <a
        href="/api/export"
        className="flex h-12 items-center justify-center rounded-full border border-linha font-medium transition active:scale-[.98]"
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
