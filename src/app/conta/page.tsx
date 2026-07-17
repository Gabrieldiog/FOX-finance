import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ExcluirConta } from "./excluir-conta";

export default async function Conta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-6 py-10">
      <header className="flex items-center justify-between">
        <Link href="/" className="text-sm text-zinc-500">
          Voltar
        </Link>
        <h1 className="text-lg font-semibold">Conta</h1>
        <span className="w-12" />
      </header>

      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm">{session.user.name}</p>
        <p className="text-sm text-zinc-500">{session.user.email}</p>
      </div>

      <a
        href="/api/export"
        className="flex h-12 items-center justify-center rounded-full border border-zinc-300 font-medium dark:border-zinc-700"
      >
        Exportar meus dados
      </a>

      <ExcluirConta />

      <p className="mt-auto text-center text-xs text-zinc-500">
        <Link href="/privacidade" className="underline">
          Política de privacidade
        </Link>
      </p>
    </main>
  );
}
