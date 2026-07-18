import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listUserCategories } from "@/lib/data/categories";
import { ExcluirConta } from "./excluir-conta";
import { GerirCategorias } from "./gerir-categorias";

export default async function Conta() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/entrar");

  const minhasCategorias = await listUserCategories(session.user.id);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 bg-feltro px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] font-grotesk text-creme [padding-top:calc(env(safe-area-inset-top)+1.5rem)]">
      <header className="flex items-center justify-between border-b border-pauta pb-4">
        <Link
          href="/"
          className="font-mono text-xs uppercase tracking-[0.14em] text-sage transition hover:text-creme"
        >
          ← Voltar
        </Link>
        <h1 className="font-serif text-lg font-semibold">Conta</h1>
        <span className="w-12" />
      </header>

      <div className="rounded-2xl border border-pauta bg-feltro-alto p-5">
        <p className="font-serif text-lg font-semibold">{session.user.name}</p>
        <p className="text-sm text-sage">{session.user.email}</p>
      </div>

      <GerirCategorias
        categorias={minhasCategorias.map((c) => ({
          id: c.id,
          name: c.name,
          type: c.type,
          icon: c.icon,
          color: c.color,
        }))}
      />

      <a
        href="/api/export"
        className="flex h-13 items-center justify-center rounded-xl border border-pauta bg-feltro-alto font-medium text-brilho transition hover:border-brilho/50 active:scale-[.98]"
      >
        Exportar meus dados
      </a>

      <ExcluirConta />

      <p className="mt-auto text-center font-mono text-[0.7rem] uppercase tracking-[0.12em] text-sage">
        <Link href="/privacidade" className="underline transition hover:text-creme">
          Política de privacidade
        </Link>
      </p>
    </main>
  );
}
