import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { SairBotao } from "@/components/sair-botao";

export default async function Home() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col justify-center gap-8 px-6 py-16">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Fox</h1>
        <p className="mt-1 text-zinc-500">Gestão financeira pessoal.</p>
      </div>

      {session ? (
        <div className="flex flex-col items-start gap-4 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
          <div>
            <p className="text-lg">
              Olá, <span className="font-medium">{session.user.name}</span>.
            </p>
            <p className="text-sm text-zinc-500">{session.user.email}</p>
          </div>
          <SairBotao />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <Link
            href="/entrar"
            className="flex h-12 items-center justify-center rounded-full bg-zinc-900 px-5 font-medium text-white dark:bg-white dark:text-zinc-900"
          >
            Entrar
          </Link>
          <Link
            href="/criar-conta"
            className="flex h-12 items-center justify-center rounded-full border border-zinc-300 px-5 font-medium dark:border-zinc-700"
          >
            Criar conta
          </Link>
        </div>
      )}
    </main>
  );
}
