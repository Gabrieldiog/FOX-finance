"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { FoxMascote, type Emocao } from "@/components/fox-mascote";
import { Marca } from "@/components/marca";

type Modo = "entrar" | "criar";

const FRASE: Record<Modo, string> = {
  entrar: "Que bom te ver de novo. Sua grana te esperando, organizadinha.",
  criar: "Bora começar? Em um minuto o Fox já está cuidando do seu dinheiro.",
};

export function FormaAuth({ modo }: { modo: Modo }) {
  const router = useRouter();
  const criar = modo === "criar";

  const [foco, setFoco] = useState<"nome" | "email" | "senha" | null>(null);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  let emocao: Emocao = "neutro";
  if (erro) emocao = "erro";
  else if (sucesso) emocao = "feliz";
  else if (foco === "senha") emocao = mostrarSenha ? "espiando" : "tapado";
  else if (foco === "email" || foco === "nome") emocao = "atento";

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    const form = new FormData(e.currentTarget);
    if (String(form.get("site") ?? "") !== "") {
      setCarregando(false);
      setErro("Não foi possível concluir.");
      return;
    }

    const email = String(form.get("email"));
    const senhaValor = String(form.get("senha"));
    const { error } = criar
      ? await authClient.signUp.email({ name: String(form.get("nome")), email, password: senhaValor })
      : await authClient.signIn.email({ email, password: senhaValor });

    if (error) {
      setCarregando(false);
      if (criar && error.code === "USER_ALREADY_EXISTS") setErro("Esse e-mail já tem conta — é só entrar.");
      else if (error.status === 429) setErro(error.message ?? "Muitas tentativas. Espere um pouco.");
      else if (criar && error.status === 400 && error.message) setErro(error.message);
      else setErro(criar ? "Não foi possível criar a conta." : "E-mail ou senha inválidos.");
      // a carinha triste dura um instante e volta ao normal
      setTimeout(() => setErro(null), 2600);
      return;
    }

    setSucesso(true);
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 650);
  }

  const forca = criar ? Math.min(senha.length, 12) / 12 : 0;

  return (
    <main className="flex min-h-svh flex-col md:flex-row">
      {/* Painel da raposa (cenário verde) */}
      <section className="relative flex shrink-0 flex-col items-center justify-center gap-5 overflow-hidden bg-gradient-to-br from-verde to-verde-vivo px-6 pt-safe md:w-[45%] md:min-h-svh">
        <div className="pointer-events-none absolute -left-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-10 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-col items-center gap-4 py-8 text-center md:py-0">
          <FoxMascote
            size={168}
            emocao={emocao}
            seguirMouse={emocao === "neutro" || emocao === "atento"}
            className="drop-shadow-[0_12px_24px_rgba(5,46,22,0.25)]"
          />
          <p className="max-w-xs font-display text-lg font-semibold text-menta-tinta md:text-xl">
            {FRASE[modo]}
          </p>
        </div>
      </section>

      {/* Painel do formulário */}
      <section className="flex flex-1 flex-col justify-center px-6 py-10 pb-safe">
        <div className="mx-auto flex w-full max-w-sm flex-col gap-7">
          <Link href="/" className="mx-auto">
            <Marca />
          </Link>

          {/* Divisão clara entre os dois modos */}
          <div className="flex rounded-full border border-linha bg-carvao p-1 text-sm font-semibold shadow-[var(--sombra-card)]">
            <Link
              href="/entrar"
              className={`flex-1 rounded-full py-2.5 text-center transition ${!criar ? "bg-verde text-tinta" : "text-nevoa-fraca"}`}
            >
              Entrar
            </Link>
            <Link
              href="/criar-conta"
              className={`flex-1 rounded-full py-2.5 text-center transition ${criar ? "bg-verde text-tinta" : "text-nevoa-fraca"}`}
            >
              Criar conta
            </Link>
          </div>

          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
              <label>
                Site (não preencha)
                <input name="site" type="text" tabIndex={-1} autoComplete="off" />
              </label>
            </div>

            {criar && (
              <Campo
                nome="nome"
                rotulo="Seu nome"
                type="text"
                autoComplete="name"
                onFoco={() => setFoco("nome")}
                onBorrar={() => setFoco(null)}
              />
            )}
            <Campo
              nome="email"
              rotulo="E-mail"
              type="email"
              autoComplete="email"
              onFoco={() => setFoco("email")}
              onBorrar={() => setFoco(null)}
            />
            <div className="flex flex-col gap-1.5">
              <div className="relative">
                <Campo
                  nome="senha"
                  rotulo="Senha"
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete={criar ? "new-password" : "current-password"}
                  minLength={criar ? 8 : undefined}
                  value={senha}
                  onChangeValor={setSenha}
                  onFoco={() => setFoco("senha")}
                  onBorrar={() => setFoco(null)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg px-2 py-1 text-sm font-semibold text-verde-texto"
                  tabIndex={-1}
                >
                  {mostrarSenha ? "ocultar" : "mostrar"}
                </button>
              </div>
              {criar && (
                <div className="h-1.5 overflow-hidden rounded-full bg-linha">
                  <div
                    className="h-full rounded-full bg-verde transition-all duration-300"
                    style={{ width: `${forca * 100}%` }}
                  />
                </div>
              )}
            </div>

            {erro && <p className="text-sm font-semibold text-saiu">{erro}</p>}

            <button
              disabled={carregando || sucesso}
              className="mt-1 h-13 rounded-lg bg-verde py-3.5 font-display text-base font-bold text-tinta shadow-[0_8px_22px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98] disabled:opacity-60"
            >
              {sucesso ? "Prontinho!" : carregando ? "Só um instante…" : criar ? "Criar minha conta" : "Entrar"}
            </button>
          </form>

          {criar && (
            <p className="text-center text-xs text-nevoa-fraca">
              Ao criar conta, você concorda com a{" "}
              <Link href="/privacidade" className="underline">
                política de privacidade
              </Link>
              .
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

// Campo com rótulo flutuante (sobe quando tem foco ou conteúdo).
function Campo({
  nome,
  rotulo,
  type,
  autoComplete,
  minLength,
  value,
  onChangeValor,
  onFoco,
  onBorrar,
}: {
  nome: string;
  rotulo: string;
  type: string;
  autoComplete: string;
  minLength?: number;
  value?: string;
  onChangeValor?: (v: string) => void;
  onFoco: () => void;
  onBorrar: () => void;
}) {
  return (
    <label className="relative block">
      <input
        name={nome}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        placeholder=" "
        value={value}
        onChange={onChangeValor ? (e) => onChangeValor(e.target.value) : undefined}
        onFocus={onFoco}
        onBlur={onBorrar}
        className="peer h-13 w-full rounded-lg border border-linha bg-carvao px-4 pt-4 text-nevoa outline-none transition focus:border-verde focus:ring-4 focus:ring-verde/20"
      />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nevoa-fraca transition-all peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-verde-texto peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold">
        {rotulo}
      </span>
    </label>
  );
}
