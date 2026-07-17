"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function CriarConta() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signUp.email({
      name: String(form.get("nome")),
      email: String(form.get("email")),
      password: String(form.get("senha")),
    });
    setCarregando(false);
    if (error) {
      setErro(error.status === 403 ? "Cadastro é só por convite." : "Não foi possível criar a conta.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Nome
          <input
            name="nome"
            required
            autoComplete="name"
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-transparent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Senha
          <input
            name="senha"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-transparent"
          />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          disabled={carregando}
          className="h-12 rounded-full bg-zinc-900 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {carregando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link href="/entrar" className="underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
