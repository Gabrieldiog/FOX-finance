"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function Entrar() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email")),
      password: String(form.get("senha")),
    });
    setCarregando(false);
    if (error) {
      setErro("E-mail ou senha inválidos.");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <h1 className="text-2xl font-semibold tracking-tight">Entrar</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
            autoComplete="current-password"
            className="h-12 rounded-lg border border-zinc-300 px-3 dark:border-zinc-700 dark:bg-transparent"
          />
        </label>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <button
          disabled={carregando}
          className="h-12 rounded-full bg-zinc-900 font-medium text-white disabled:opacity-60 dark:bg-white dark:text-zinc-900"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="text-sm text-zinc-500">
        Não tem conta?{" "}
        <Link href="/criar-conta" className="underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
