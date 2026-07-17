"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FoxGlyph } from "@/components/marca";

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
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col justify-center gap-7 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <FoxGlyph className="h-14 w-14" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Entrar</h1>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm text-nevoa-fraca">
          E-mail
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-12 rounded-xl border border-linha bg-carvao px-4 text-base text-nevoa outline-none"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm text-nevoa-fraca">
          Senha
          <input
            name="senha"
            type="password"
            required
            autoComplete="current-password"
            className="h-12 rounded-xl border border-linha bg-carvao px-4 text-base text-nevoa outline-none"
          />
        </label>
        {erro && <p className="text-sm text-saiu">{erro}</p>}
        <button
          disabled={carregando}
          className="mt-1 h-12 rounded-full bg-ambar font-medium text-tinta transition active:scale-[.98] disabled:opacity-60"
        >
          {carregando ? "Entrando…" : "Entrar"}
        </button>
      </form>
      <p className="text-center text-sm text-nevoa-fraca">
        Não tem conta?{" "}
        <Link href="/criar-conta" className="text-nevoa underline">
          Criar conta
        </Link>
      </p>
    </main>
  );
}
