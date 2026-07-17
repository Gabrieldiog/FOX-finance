"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FoxGlyph } from "@/components/marca";

export default function CriarConta() {
  const router = useRouter();
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    // Honeypot: gente de verdade nunca vê esse campo; se veio preenchido, é robô.
    if (String(form.get("site") ?? "") !== "") {
      setCarregando(false);
      setErro("Não foi possível concluir.");
      return;
    }
    const { error } = await authClient.signUp.email({
      name: String(form.get("nome")),
      email: String(form.get("email")),
      password: String(form.get("senha")),
    });
    setCarregando(false);
    if (error) {
      if (error.code === "USER_ALREADY_EXISTS") {
        setErro("Esse e-mail já tem conta — é só entrar.");
      } else if (error.status === 400 && error.message) {
        // Mensagens do servidor em pt-BR (ex.: aviso de senha fácil).
        setErro(error.message);
      } else {
        setErro("Não foi possível criar a conta.");
      }
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-1 flex-col justify-center gap-6 px-6 py-16">
      <div className="flex flex-col items-center gap-3 text-center">
        <FoxGlyph className="h-14 w-14" />
        <h1 className="font-display text-2xl font-semibold tracking-tight">Criar conta</h1>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Site (não preencha)
            <input name="site" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm text-nevoa-fraca">
          Nome
          <input
            name="nome"
            required
            autoComplete="name"
            className="h-12 rounded-xl border border-linha bg-carvao px-4 text-base text-nevoa outline-none"
          />
        </label>
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
            minLength={8}
            autoComplete="new-password"
            className="h-12 rounded-xl border border-linha bg-carvao px-4 text-base text-nevoa outline-none"
          />
        </label>
        {erro && <p className="text-sm text-saiu">{erro}</p>}
        <button
          disabled={carregando}
          className="mt-1 h-12 rounded-full bg-ambar font-medium text-tinta transition active:scale-[.98] disabled:opacity-60"
        >
          {carregando ? "Criando…" : "Criar conta"}
        </button>
      </form>
      <p className="text-center text-xs text-nevoa-fraca">
        Ao criar conta, você concorda com a{" "}
        <Link href="/privacidade" className="underline">
          política de privacidade
        </Link>
        .
      </p>
      <p className="text-center text-sm text-nevoa-fraca">
        Já tem conta?{" "}
        <Link href="/entrar" className="text-nevoa underline">
          Entrar
        </Link>
      </p>
    </main>
  );
}
