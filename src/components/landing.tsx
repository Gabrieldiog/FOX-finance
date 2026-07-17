"use client";

import Link from "next/link";
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useSpring,
} from "motion/react";
import { FoxMascote } from "@/components/fox-mascote";
import { FoxGlyph } from "@/components/marca";
import { FundoVivo } from "@/components/fundo-vivo";
import { CardTilt, ContadorInView, BarraInView, Magnetico } from "@/components/efeitos";

const SUAVE = [0.22, 1, 0.36, 1] as const;

function Revela({
  children,
  atraso = 0,
  className,
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
}) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay: atraso, ease: SUAVE }}
    >
      {children}
    </m.div>
  );
}

const AJUDA = [
  ["Vê tudo num lugar", "Gastos e ganhos juntos, com o resumo da semana e do mês numa tela só."],
  ["Sabe pra onde foi", "Cada real numa categoria, com a barra de quanto pesou no seu mês."],
  ["Rápido de anotar", "Lançar leva 10 segundos: digita o valor, toca na categoria, salvou."],
];

const PORQUE = ["Esperta com pouco", "Te mostra na hora", "Fica do seu lado"];

const PASSOS = [
  ["Crie sua conta", "Em um minuto, de graça e sem cartão."],
  ["Anote no susto", "Cada gasto e ganho num toque, na hora que acontece."],
  ["Entenda com calma", "O resumo te diz, num número, se sobrou ou faltou."],
];

const SEGURANCA = [
  ["Cada conta no seu canto", "Ninguém vê o dinheiro de ninguém. Seus dados são lidos só pela sua sessão — nunca por um id de fora."],
  ["Senha protegida de verdade", "Guardada com Argon2id, o padrão de hoje. Nem a gente vê sua senha."],
  ["Robô e força bruta não passam", "Trava depois de 5 erros, honeypot no cadastro e limite de tentativas por IP."],
];

export function Landing() {
  const { scrollYProgress } = useScroll();
  const barra = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  async function comemorar(e: React.MouseEvent) {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) return;
    e.preventDefault();
    const alvo = (e.currentTarget as HTMLAnchorElement).href;
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 80,
      spread: 65,
      origin: { y: 0.7 },
      colors: ["#16a34a", "#4ade80", "#ffffff", "#fb923c"],
      disableForReducedMotion: true,
    });
    setTimeout(() => (window.location.href = alvo), 550);
  }

  return (
    <LazyMotion features={domAnimation}>
      <FundoVivo variante="claro" />
      <m.div className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-verde" style={{ scaleX: barra }} />

      <div className="flex flex-col overflow-x-clip">
        {/* Cabeçalho */}
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 pt-safe">
          <span className="flex items-center gap-2">
            <FoxGlyph className="h-8 w-8" />
            <span className="font-display text-xl font-extrabold tracking-tight">
              Fox <span className="text-verde-texto">Finance</span>
            </span>
          </span>
          <Link
            href="/entrar"
            className="rounded-full border border-linha bg-carvao/80 px-5 py-2 text-sm font-bold text-verde-texto backdrop-blur transition hover:border-verde/50"
          >
            Entrar
          </Link>
        </header>

        {/* 1. HERO */}
        <section className="mx-auto grid w-full max-w-6xl items-center gap-8 px-5 pb-20 pt-8 md:grid-cols-[1.05fr_0.95fr] md:pb-28 md:pt-16">
          <div className="flex flex-col items-start gap-6">
            <m.h1
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.8, ease: SUAVE }}
              className="font-display text-[2.75rem] font-extrabold leading-[1.03] tracking-tight text-fluida-2xl"
            >
              Ruim com dinheiro?{" "}
              <span className="bg-gradient-to-r from-verde to-verde-vivo bg-clip-text text-transparent">
                A raposa cuida.
              </span>
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: SUAVE }}
              className="max-w-md text-lg text-nevoa-fraca"
            >
              O Fox organiza seus gastos, mostra pra onde seu dinheiro foi e te dá o resumo da
              semana e do mês — sem planilha, sem sermão.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.25, ease: SUAVE }}
              className="flex flex-col items-start gap-3"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Magnetico>
                  <Link
                    href="/criar-conta"
                    className="flex h-13 items-center justify-center rounded-lg bg-verde px-7 font-display text-base font-bold text-tinta shadow-[0_10px_28px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98]"
                  >
                    Criar conta grátis
                  </Link>
                </Magnetico>
                <a
                  href="#como"
                  className="flex h-13 items-center justify-center rounded-lg px-5 font-semibold text-verde-texto transition hover:bg-menta"
                >
                  Ver como funciona
                </a>
              </div>
              <span className="text-sm text-nevoa-fraca">Grátis pra começar · seus dados criptografados.</span>
            </m.div>
          </div>

          <m.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 160, damping: 18, delay: 0.2 }}
            className="flex justify-center"
          >
            <FoxMascote size={300} seguirMouse />
          </m.div>
        </section>

        {/* 2. O QUE TE AJUDAMOS */}
        <section className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
          <Revela className="mb-10 flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">O que o Fox faz</span>
            <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Menos susto no fim do mês
            </h2>
          </Revela>
          <div className="grid gap-5 md:grid-cols-3">
            {AJUDA.map(([titulo, texto], i) => (
              <Revela key={titulo} atraso={i * 0.08}>
                <CardTilt className="flex h-full flex-col gap-3 rounded-2xl border border-linha bg-carvao/70 p-6 backdrop-blur">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-menta font-display text-lg font-extrabold text-verde-texto">
                    {i + 1}
                  </span>
                  <h3 className="font-display text-xl font-bold">{titulo}</h3>
                  <p className="text-nevoa-fraca">{texto}</p>
                </CardTilt>
              </Revela>
            ))}
          </div>
        </section>

        {/* 3. POR QUE A RAPOSA */}
        <section className="mx-auto grid w-full max-w-5xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:gap-14 md:py-24">
          <Revela className="order-2 flex justify-center md:order-1">
            <FoxMascote size={260} emocao="feliz" />
          </Revela>
          <Revela atraso={0.1} className="order-1 flex flex-col gap-5 md:order-2">
            <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">Por que a raposa</span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Por que uma raposa?
            </h2>
            <p className="text-lg text-nevoa-fraca">
              Raposa é esperta, econômica e sabe estocar pro inverno. É esse instinto que o Fox
              empresta pra você: faro pro desperdício e disciplina sem esforço.
            </p>
            <ul className="flex flex-col gap-3">
              {PORQUE.map((b, i) => (
                <m.li
                  key={b}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: SUAVE }}
                  className="flex items-center gap-3 font-semibold"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-verde text-sm text-tinta">
                    ✓
                  </span>
                  {b}
                </m.li>
              ))}
            </ul>
          </Revela>
        </section>

        {/* 4. POR DENTRO — bento de cards com efeitos (tilt 3D + holofote) */}
        <section className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
          <Revela className="mb-10 flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">Por dentro</span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Seu mês, numa olhada
            </h2>
          </Revela>
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {/* Card-herói: saldo que conta ao entrar */}
            <Revela className="sm:col-span-2 md:col-span-2">
              <CardTilt className="h-full overflow-hidden rounded-3xl bg-gradient-to-br from-verde to-verde-vivo p-7 text-menta-tinta shadow-[0_24px_50px_-24px_var(--verde)]">
                <div className="pointer-events-none absolute -right-6 -top-8 h-40 w-40 rounded-full bg-white/15 blur-2xl" />
                <p className="font-display text-sm font-bold uppercase tracking-wider opacity-80">Sobrou este mês</p>
                <ContadorInView cents={251097} className="dinheiro mt-1 block font-display text-5xl font-extrabold" />
                <p className="mt-2 text-sm font-semibold opacity-80">No verde — a raposa aprova.</p>
              </CardTilt>
            </Revela>
            {/* Entrou / Saiu */}
            <Revela atraso={0.06}>
              <CardTilt className="flex h-full flex-col justify-center gap-4 rounded-3xl border border-linha bg-carvao/70 p-6 backdrop-blur">
                <div>
                  <p className="text-xs font-semibold text-nevoa-fraca">Entrou</p>
                  <ContadorInView cents={350000} className="dinheiro mt-1 block text-2xl font-extrabold text-entrou" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-nevoa-fraca">Saiu</p>
                  <ContadorInView cents={98870} className="dinheiro mt-1 block text-2xl font-extrabold text-saiu" />
                </div>
              </CardTilt>
            </Revela>
            {/* Pra onde foi: barras que enchem */}
            <Revela atraso={0.1} className="sm:col-span-2">
              <CardTilt intensidade={5} className="h-full rounded-3xl border border-linha bg-carvao/70 p-6 backdrop-blur">
                <p className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-nevoa-fraca">Pra onde foi</p>
                <div className="flex flex-col gap-3.5">
                  {[
                    ["Mercado", "R$ 545,80", 100, "#f59e0b"],
                    ["Contas & Assinaturas", "R$ 220,00", 40, "#14b8a6"],
                    ["Transporte", "R$ 87,90", 16, "#3b82f6"],
                  ].map(([nome, val, pct, cor], i) => (
                    <div key={nome as string} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold">{nome}</span>
                        <span className="dinheiro text-nevoa-fraca">{val}</span>
                      </div>
                      <BarraInView pct={pct as number} cor={cor as string} atraso={0.1 + i * 0.12} />
                    </div>
                  ))}
                </div>
              </CardTilt>
            </Revela>
            {/* Anotar rápido + raposa */}
            <Revela atraso={0.14}>
              <CardTilt className="flex h-full flex-col items-center justify-center gap-2 rounded-3xl border border-linha bg-menta/60 p-6 text-center backdrop-blur">
                <FoxMascote size={90} emocao="atento" />
                <p className="font-display text-lg font-bold leading-tight">Anotar leva 10 segundos</p>
                <p className="text-sm text-nevoa-fraca">valor, categoria, salvou.</p>
              </CardTilt>
            </Revela>
          </div>
        </section>

        {/* 5. COMO TE AJUDAMOS */}
        <section id="como" className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
          <Revela className="mb-12 flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">Como funciona</span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Três passos e pronto
            </h2>
          </Revela>
          <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
            <m.div
              aria-hidden
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: SUAVE }}
              className="absolute left-0 right-0 top-6 hidden h-0.5 origin-left bg-verde/30 md:block"
            />
            {PASSOS.map(([titulo, texto], i) => (
              <Revela key={titulo} atraso={i * 0.12} className="relative flex flex-col items-center gap-3 text-center">
                <m.span
                  initial={{ scale: 0.6, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.2 + i * 0.12 }}
                  className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-verde font-display text-lg font-extrabold text-tinta shadow-[0_8px_20px_-6px_var(--verde)]"
                >
                  {i + 1}
                </m.span>
                <h3 className="font-display text-xl font-bold">{titulo}</h3>
                <p className="max-w-xs text-nevoa-fraca">{texto}</p>
              </Revela>
            ))}
          </div>
        </section>

        {/* 5.5 SEGURANÇA — faixa escura com a raposa e cards */}
        <section className="relative mt-8 overflow-hidden bg-[#052e16] px-5 py-20 text-[#e7f8ee] md:py-28">
          <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-verde-vivo/20 blur-3xl" />
          <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-12">
            <Revela className="flex flex-col items-center gap-4 text-center">
              <FoxMascote size={110} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#4ade80]">Segurança</span>
              <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                Dinheiro é coisa séria. A gente trata assim.
              </h2>
              <p className="max-w-xl text-lg text-[#9db4a8]">
                Poucas contas, dados de gente de verdade. Por isso a segurança não é enfeite — é o centro do projeto.
              </p>
            </Revela>
            <div className="grid gap-5 md:grid-cols-3">
              {SEGURANCA.map(([titulo, texto], i) => (
                <Revela key={titulo} atraso={i * 0.08}>
                  <CardTilt intensidade={6} className="flex h-full flex-col gap-2 rounded-2xl border border-[#1e3a2a] bg-[#0a1f14] p-6">
                    <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-[#12331f]">
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M12 2 4 5v6c0 5 3.5 8 8 11 4.5-3 8-6 8-11V5l-8-3Z" />
                        <path d="m9 12 2 2 4-4" />
                      </svg>
                    </span>
                    <h3 className="font-display text-lg font-bold text-[#e7f8ee]">{titulo}</h3>
                    <p className="text-[#9db4a8]">{texto}</p>
                  </CardTilt>
                </Revela>
              ))}
            </div>
          </div>
        </section>

        {/* 6. CTA FINAL */}
        <section className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
          <Revela className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-verde to-verde-vivo px-6 py-16 text-center text-menta-tinta">
            <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
            <div className="pointer-events-none absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col items-center gap-6">
              <FoxMascote size={128} emocao="feliz" acenar />
              <h2 className="max-w-xl font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
                Bora deixar o dinheiro sob controle?
              </h2>
              <p className="max-w-md text-lg font-semibold text-menta-tinta/80">
                Leva 2 minutos. A raposa faz o resto.
              </p>
              <Magnetico>
                <Link
                  href="/criar-conta"
                  onClick={comemorar}
                  className="flex h-14 items-center justify-center rounded-lg bg-white px-8 font-display text-lg font-bold text-verde-texto shadow-[0_12px_30px_-8px_rgba(5,46,22,0.4)] transition hover:-translate-y-0.5 active:scale-[.98]"
                >
                  Criar minha conta
                </Link>
              </Magnetico>
            </div>
          </Revela>
        </section>

        {/* Rodapé */}
        <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-12 pb-safe text-center text-sm text-nevoa-fraca">
          <span className="flex items-center gap-2">
            <FoxGlyph className="h-7 w-7" />
            <span className="font-display font-bold text-nevoa">Fox Finance</span>
          </span>
          <div className="flex gap-5">
            <Link href="/entrar" className="transition hover:text-nevoa">Entrar</Link>
            <Link href="/criar-conta" className="transition hover:text-nevoa">Criar conta</Link>
            <Link href="/privacidade" className="transition hover:text-nevoa">Privacidade</Link>
          </div>
          <p className="text-xs">Feito com capricho no Brasil.</p>
        </footer>
      </div>
    </LazyMotion>
  );
}
