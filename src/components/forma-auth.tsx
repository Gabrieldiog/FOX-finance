"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LazyMotion,
  domMax,
  m,
  AnimatePresence,
} from "motion/react";
import { authClient } from "@/lib/auth-client";
import { FoxMascote, type Emocao } from "@/components/fox-mascote";
import { Marca } from "@/components/marca";
import { FundoVivo } from "@/components/fundo-vivo";

type Modo = "entrar" | "criar";

const FRASE: Record<Modo, string> = {
  entrar: "Que bom te ver de novo. Sua grana te esperando, organizadinha.",
  criar: "Bora começar? Em um minuto o Fox já está cuidando do seu dinheiro.",
};

// Halo por trás da raposa, muda de cor conforme a emoção.
const HALO: Record<Emocao, string> = {
  neutro: "rgba(255,255,255,0.22)",
  atento: "rgba(255,255,255,0.4)",
  tapado: "rgba(255,255,255,0.28)",
  espiando: "rgba(255,255,255,0.32)",
  feliz: "rgba(134,239,172,0.55)",
  erro: "rgba(251,191,36,0.45)",
};

const SPRING = { type: "spring" as const, stiffness: 260, damping: 20 };

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
    // troca a URL sem navegar (mantém o componente montado e a raposa viva)
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
      <main className="flex min-h-svh flex-col md:flex-row">
        {/* Painel da raposa (cenário verde vivo) */}
        <section className="relative flex shrink-0 items-center justify-center overflow-hidden px-6 pt-safe md:w-[45%] md:min-h-svh">
          <FundoVivo variante="verde" />
          <div className="flex flex-col items-center gap-5 py-10 text-center md:py-0">
            <div className="relative flex items-center justify-center">
              <m.div
                aria-hidden
                className="absolute h-56 w-56 rounded-full blur-2xl"
                animate={{ backgroundColor: HALO[emocao], scale: emocao === "feliz" ? 1.1 : 1 }}
                transition={{ duration: 0.4 }}
              />
              <m.div
                animate={{ scale: emocao === "feliz" ? [1, 1.06, 1] : 1 }}
                transition={{ duration: 0.45 }}
              >
                <FoxMascote size={190} emocao={emocao} seguirMouse={emocao === "neutro" || emocao === "atento"} />
              </m.div>
            </div>
            <AnimatePresence mode="wait">
              <m.p
                key={modo}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.26, ease: "easeOut" }}
                className="max-w-xs font-display text-lg font-semibold text-menta-tinta md:text-xl"
              >
                {FRASE[modo]}
              </m.p>
            </AnimatePresence>
          </div>
        </section>

        {/* Painel do formulário */}
        <section className="flex flex-1 flex-col justify-center px-6 py-10 pb-safe">
          <div className="mx-auto flex w-full max-w-sm flex-col gap-7">
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}>
              <Link href="/" className="mx-auto flex w-fit">
                <Marca />
              </Link>
            </m.div>

            {/* Toggle client-side com pílula que desliza */}
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.07, ease: [0.22, 1, 0.36, 1] }}
              className="flex rounded-full border border-linha bg-carvao p-1 text-sm font-semibold shadow-[var(--sombra-card)]"
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
              transition={{ duration: 0.4, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
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
                    initial={{ opacity: 0, x: 0 }}
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
        className="peer h-13 w-full rounded-lg border border-linha bg-carvao px-4 pt-4 text-nevoa outline-none transition-[border-color,box-shadow,transform] duration-200 focus:scale-[1.01] focus:border-verde focus:ring-4 focus:ring-verde/20"
      />
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-nevoa-fraca transition-all duration-200 [transition-timing-function:cubic-bezier(.34,1.56,.64,1)] peer-focus:top-2.5 peer-focus:translate-y-0 peer-focus:text-xs peer-focus:font-semibold peer-focus:text-verde-texto peer-[:not(:placeholder-shown)]:top-2.5 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:font-semibold">
        {rotulo}
      </span>
    </label>
  );
}
