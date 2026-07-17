"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LazyMotion, domMax, m, AnimatePresence } from "motion/react";
import { authClient } from "@/lib/auth-client";
import { type Emocao } from "@/components/fox-mascote";
import { RaposaCanvas } from "@/components/raposa-3d/raposa-canvas";
import { Marca } from "@/components/marca";
import { FundoVivo } from "@/components/fundo-vivo";

type Modo = "entrar" | "criar";

const FRASE: Record<Modo, string> = {
  entrar: "Que bom te ver de novo. Sua grana te esperando, organizadinha.",
  criar: "Bora começar? Em um minuto o Fox já está cuidando do seu dinheiro.",
};

const HALO: Record<Emocao, string> = {
  neutro: "rgba(255,255,255,0.24)",
  atento: "rgba(255,255,255,0.42)",
  tapado: "rgba(255,255,255,0.3)",
  espiando: "rgba(255,255,255,0.34)",
  feliz: "rgba(190,242,210,0.6)",
  erro: "rgba(251,191,36,0.5)",
};

export function FormaAuth({ modo: inicial }: { modo: Modo }) {
  const router = useRouter();
  const [modo, setModo] = useState<Modo>(inicial);
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

  function trocar(novo: Modo) {
    if (novo === modo) return;
    setModo(novo);
    setErro(null);
    window.history.replaceState(null, "", novo === "entrar" ? "/entrar" : "/criar-conta");
  }

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
  const corForca = forca < 0.34 ? "#f59e0b" : forca < 0.67 ? "#22c55e" : "#15803d";

  return (
    <LazyMotion features={domMax}>
      <FundoVivo variante="claro" moedas />
      <main className="relative flex min-h-svh items-center justify-center px-4 py-8 pt-safe pb-safe">
        <m.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="grid w-full max-w-4xl overflow-hidden rounded-[2rem] border border-linha bg-carvao shadow-[0_40px_100px_-40px_rgba(6,78,59,0.45)] md:grid-cols-2"
        >
          {/* Painel da raposa */}
          <section className="relative flex min-h-[240px] flex-col items-center justify-center gap-5 overflow-hidden px-6 py-10 text-center">
            <FundoVivo variante="verde" fixo={false} moedas />
            <div className="relative flex items-center justify-center">
              <m.div
                aria-hidden
                className="absolute h-52 w-52 rounded-full blur-2xl"
                animate={{ backgroundColor: HALO[emocao], scale: emocao === "feliz" ? 1.12 : [1, 1.06, 1] }}
                transition={emocao === "feliz" ? { duration: 0.4 } : { duration: 6, repeat: Infinity, ease: "easeInOut" }}
              />
              <m.div animate={{ scale: emocao === "feliz" ? [1, 1.06, 1] : 1 }} transition={{ duration: 0.45 }}>
                <RaposaCanvas size={210} emocao={emocao} seguirMouse={emocao === "neutro" || emocao === "atento"} />
              </m.div>
            </div>
            <AnimatePresence mode="wait">
              <m.p
                key={modo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className="relative max-w-[15rem] font-display text-xl font-extrabold leading-snug tracking-tight text-menta-tinta md:text-2xl"
              >
                {FRASE[modo]}
              </m.p>
            </AnimatePresence>
          </section>

          {/* Painel do formulário */}
          <section className="flex flex-col justify-center px-7 py-10">
            <div className="mx-auto flex w-full max-w-sm flex-col gap-6">
              <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}>
                <Link href="/" className="mx-auto flex w-fit">
                  <Marca />
                </Link>
              </m.div>

              <m.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.17, ease: [0.22, 1, 0.36, 1] }}
                className="flex rounded-full border border-linha bg-breu p-1 text-sm font-semibold"
              >
                {(["entrar", "criar"] as const).map((m2) => {
                  const ativo = modo === m2;
                  return (
                    <button
                      key={m2}
                      type="button"
                      onClick={() => trocar(m2)}
                      className={`relative flex-1 rounded-full py-2.5 text-center transition ${ativo ? "text-tinta" : "text-nevoa-fraca"}`}
                    >
                      {ativo && (
                        <m.span
                          layoutId="pilula-auth"
                          className="absolute inset-0 rounded-full bg-verde"
                          transition={{ type: "spring", stiffness: 400, damping: 32 }}
                        />
                      )}
                      <span className="relative z-10">{m2 === "entrar" ? "Entrar" : "Criar conta"}</span>
                    </button>
                  );
                })}
              </m.div>

              <m.form
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
                onSubmit={onSubmit}
                className="flex flex-col gap-4"
              >
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Site (não preencha)
                    <input name="site" type="text" tabIndex={-1} autoComplete="off" />
                  </label>
                </div>

                <AnimatePresence initial={false}>
                  {criar && (
                    <m.div
                      key="nome"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <Campo nome="nome" rotulo="Seu nome" type="text" autoComplete="name" onFoco={() => setFoco("nome")} onBorrar={() => setFoco(null)} />
                    </m.div>
                  )}
                </AnimatePresence>

                <Campo nome="email" rotulo="E-mail" type="email" autoComplete="email" onFoco={() => setFoco("email")} onBorrar={() => setFoco(null)} />

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
                      <m.div
                        className="h-full rounded-full"
                        animate={{ width: `${forca * 100}%`, backgroundColor: corForca }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {erro && (
                    <m.p
                      key="erro"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1, x: [0, -6, 6, -4, 4, 0] }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="text-sm font-semibold text-saiu"
                    >
                      {erro}
                    </m.p>
                  )}
                </AnimatePresence>

                <button
                  disabled={carregando || sucesso}
                  className="mt-1 h-13 rounded-lg bg-verde py-3.5 font-display text-base font-bold text-tinta shadow-[0_8px_22px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98] disabled:opacity-60"
                >
                  {sucesso ? "Prontinho!" : carregando ? "Só um instante…" : criar ? "Criar minha conta" : "Entrar"}
                </button>
              </m.form>

              {criar && (
                <p className="text-center text-xs text-nevoa-fraca">
                  Ao criar conta, você concorda com a{" "}
                  <Link href="/privacidade" className="underline">política de privacidade</Link>.
                </p>
              )}
            </div>
          </section>
        </m.div>
      </main>
    </LazyMotion>
  );
}

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
        className="peer h-13 w-full rounded-lg border border-linha bg-breu px-4 pt-4 text-nevoa outline-none transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.01] focus:border-verde focus:bg-carvao focus:ring-4 focus:ring-verde/20"
      />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nevoa-fraca transition-all duration-200 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-verde-texto peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold">
        {rotulo}
      </span>
    </label>
  );
}
