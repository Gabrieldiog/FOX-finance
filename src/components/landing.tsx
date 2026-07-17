"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useScroll,
  useSpring,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { FoxMascote } from "@/components/fox-mascote";
import { FoxGlyph } from "@/components/marca";

const SUAVE = [0.23, 1, 0.32, 1] as const;

// Moldura de celular em CSS puro, com o print real do app dentro.
function Celular({
  src,
  alt,
  prioridade = false,
  className,
}: {
  src: string;
  alt: string;
  prioridade?: boolean;
  className?: string;
}) {
  return (
    <div
      className={`relative aspect-[780/1688] w-full overflow-hidden rounded-[2.75rem] border-[6px] border-[#0b1f17] bg-[#0b1f17] shadow-[0_30px_70px_-20px_rgba(6,78,59,0.45)] ${className ?? ""}`}
    >
      <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0b1f17]" />
      <Image
        src={src}
        alt={alt}
        width={780}
        height={1688}
        priority={prioridade}
        sizes="(max-width: 768px) 70vw, 320px"
        className="h-full w-full object-cover object-top"
      />
    </div>
  );
}

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
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, delay: atraso, ease: SUAVE }}
    >
      {children}
    </m.div>
  );
}

// Gráfico que se desenha sozinho (Motion pathLength) — o momento assinatura do hero.
function GraficoDesenhando() {
  const reduzido = useReducedMotion();
  return (
    <svg viewBox="0 0 200 90" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="sob" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#22c55e" stopOpacity="0.35" />
          <stop offset="1" stopColor="#22c55e" stopOpacity="0" />
        </linearGradient>
      </defs>
      <m.path
        d="M4 70 L40 58 L76 64 L112 36 L148 44 L196 14 L196 90 L4 90 Z"
        fill="url(#sob)"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: reduzido ? 0 : 1.4 }}
      />
      <m.path
        d="M4 70 L40 58 L76 64 L112 36 L148 44 L196 14"
        fill="none"
        stroke="#15803d"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduzido ? 1 : 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.4, ease: "easeInOut", delay: 0.4 }}
      />
    </svg>
  );
}

const FEATURES = [
  {
    print: "/prints/dashboard-claro.png",
    kicker: "O RESUMO",
    titulo: "Sobrou ou faltou, num número só",
    texto:
      "No fim da semana e do mês, um número te diz se você fechou no verde. Quanto entrou, quanto saiu e pra onde foi — sem abrir planilha nenhuma.",
    emocao: "feliz" as const,
  },
  {
    print: "/prints/novo-claro.png",
    kicker: "O LANÇAMENTO",
    titulo: "Anotar leva 10 segundos",
    texto:
      "Digitou o valor, tocou na categoria, salvou. É mais rápido que rabiscar no papel — e do jeito que a gente já pensa em dinheiro: primeiro o valor.",
    emocao: "atento" as const,
  },
  {
    print: "/prints/dashboard-escuro.png",
    kicker: "DO SEU JEITO",
    titulo: "Claro de dia, escuro de noite",
    texto:
      "O Fox se ajusta ao seu celular. Fica bonito e legível nos dois temas, com letra grande o suficiente pra ninguém apertar os olhos.",
    emocao: "neutro" as const,
  },
];

const SEGURANCA = [
  ["Cada conta no seu canto", "Ninguém vê o dinheiro de ninguém. Seus dados são lidos só pela sua sessão, nunca por um id de fora."],
  ["Senha protegida de verdade", "Guardada com Argon2id, o padrão recomendado hoje — nunca em texto puro, nem visível pra gente."],
  ["Robô e força bruta não passam", "Trava depois de 5 senhas erradas, honeypot no cadastro e limite de tentativas por IP."],
];

export function Landing() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();
  const barra = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  const { scrollYProgress: heroProg } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const celularY = useTransform(heroProg, [0, 1], [0, -40]);
  const blobY = useTransform(heroProg, [0, 1], [0, 60]);

  async function comemorar(e: React.MouseEvent) {
    const reduz = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduz) return;
    e.preventDefault();
    const alvo = (e.currentTarget as HTMLAnchorElement).href;
    const { default: confetti } = await import("canvas-confetti");
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#16a34a", "#4ade80", "#ffffff", "#fb923c"],
      disableForReducedMotion: true,
    });
    setTimeout(() => {
      window.location.href = alvo;
    }, 550);
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className="fixed inset-x-0 top-0 z-50 h-1 origin-left bg-verde"
        style={{ scaleX: barra }}
      />

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
            className="rounded-full border border-linha bg-carvao px-5 py-2 text-sm font-bold text-verde-texto transition hover:border-verde/50"
          >
            Entrar
          </Link>
        </header>

        {/* Hero */}
        <section
          ref={heroRef}
          className="relative mx-auto grid w-full max-w-6xl items-center gap-10 px-5 pb-20 pt-6 md:grid-cols-[1.1fr_0.9fr] md:gap-6 md:pb-28 md:pt-12"
        >
          <m.div
            style={{ y: blobY }}
            aria-hidden
            className="pointer-events-none absolute -left-24 top-10 -z-10 h-[26rem] w-[26rem] rounded-full bg-verde-vivo/15 blur-3xl"
          />
          <div className="flex flex-col items-start gap-6">
            <m.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: SUAVE }}
              className="rounded-full bg-menta px-3.5 py-1.5 text-xs font-bold uppercase tracking-widest text-verde-texto"
            >
              Gestão financeira sem complicação
            </m.span>
            <m.h1
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.08, ease: SUAVE }}
              className="font-display text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-fluida-2xl"
            >
              Ruim com dinheiro?{" "}
              <span className="bg-gradient-to-r from-verde to-verde-vivo bg-clip-text text-transparent">
                A raposa cuida.
              </span>
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.16, ease: SUAVE }}
              className="max-w-md text-lg text-nevoa-fraca"
            >
              O Fox mostra pra onde vai cada real — sem planilha, sem economês. Feito pra quem
              nunca usou app de finanças.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24, ease: SUAVE }}
              className="flex flex-col items-start gap-2"
            >
              <Link
                href="/criar-conta"
                className="flex h-13 items-center justify-center rounded-lg bg-verde px-7 font-display text-base font-bold text-tinta shadow-[0_10px_28px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98]"
              >
                Quero organizar meu dinheiro
              </Link>
              <span className="text-sm text-nevoa-fraca">Grátis, sem cartão.</span>
            </m.div>
          </div>

          {/* Celular + raposa + gráfico */}
          <m.div style={{ y: celularY }} className="relative mx-auto w-[68%] max-w-[300px] md:w-full">
            <Celular src="/prints/dashboard-claro.png" alt="Resumo do mês no Fox Finance" prioridade />
            <div className="absolute -left-10 -top-6 hidden h-24 w-40 rounded-2xl border border-linha bg-carvao p-3 shadow-[var(--sombra-card)] sm:block">
              <p className="text-[0.6rem] font-bold uppercase tracking-wider text-nevoa-fraca">
                Este mês
              </p>
              <GraficoDesenhando />
            </div>
            <m.div
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.5 }}
              className="absolute -bottom-8 -right-4 md:-right-10"
            >
              <FoxMascote size={128} seguirMouse />
            </m.div>
          </m.div>
        </section>

        {/* Features */}
        <section className="flex flex-col gap-24 px-5 py-16 md:gap-36 md:py-24">
          {FEATURES.map((f, i) => (
            <div
              key={f.titulo}
              className="mx-auto grid w-full max-w-5xl items-center gap-8 md:grid-cols-2 md:gap-14"
            >
              <Revela
                className={`flex flex-col gap-4 ${i % 2 === 1 ? "md:order-2" : ""}`}
              >
                <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">
                  {f.kicker}
                </span>
                <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  {f.titulo}
                </h2>
                <p className="max-w-md text-lg text-nevoa-fraca">{f.texto}</p>
              </Revela>
              <Revela atraso={0.1} className={`relative mx-auto w-[62%] max-w-[280px] ${i % 2 === 1 ? "md:order-1" : ""}`}>
                <div className="pointer-events-none absolute inset-0 -z-10 scale-110 rounded-full bg-verde-vivo/10 blur-3xl" />
                <Celular src={f.print} alt={f.titulo} />
                <div className="absolute -bottom-6 -right-4">
                  <FoxMascote size={84} emocao={f.emocao} />
                </div>
              </Revela>
            </div>
          ))}
        </section>

        {/* Segurança */}
        <section className="bg-[#052e16] px-5 py-20 text-[#e7f8ee] md:py-28">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-12">
            <Revela className="flex flex-col items-center gap-4 text-center">
              <FoxMascote size={104} />
              <span className="text-xs font-bold uppercase tracking-widest text-[#4ade80]">
                Segurança
              </span>
              <h2 className="max-w-2xl font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                Dinheiro é coisa séria. A gente trata assim.
              </h2>
              <p className="max-w-xl text-lg text-[#9db4a8]">
                Poucas contas, dados de gente de verdade. Por isso a segurança não é enfeite — é
                o centro do projeto.
              </p>
            </Revela>
            <div className="grid gap-5 md:grid-cols-3">
              {SEGURANCA.map(([titulo, texto], i) => (
                <Revela
                  key={titulo}
                  atraso={i * 0.08}
                  className="flex flex-col gap-2 rounded-2xl border border-[#1e3a2a] bg-[#0a1f14] p-6"
                >
                  <h3 className="font-display text-lg font-bold text-[#e7f8ee]">{titulo}</h3>
                  <p className="text-[#9db4a8]">{texto}</p>
                </Revela>
              ))}
            </div>
          </div>
        </section>

        {/* CTA final */}
        <section className="relative overflow-hidden bg-gradient-to-br from-verde to-verde-vivo px-5 py-20 text-menta-tinta md:py-28">
          <div className="pointer-events-none absolute -left-16 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <Revela className="mx-auto flex w-full max-w-3xl flex-col items-center gap-6 text-center">
            <FoxMascote size={120} emocao="feliz" />
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-5xl">
              Dinheiro organizado, cabeça tranquila.
            </h2>
            <p className="max-w-lg text-lg font-semibold text-menta-tinta/80">
              Cria a conta em um minuto e deixa a raposa cuidar do resto.
            </p>
            <Link
              href="/criar-conta"
              onClick={comemorar}
              className="flex h-14 items-center justify-center rounded-lg bg-white px-8 font-display text-lg font-bold text-verde-texto shadow-[0_12px_30px_-8px_rgba(5,46,22,0.4)] transition hover:-translate-y-0.5 active:scale-[.98]"
            >
              Começar de graça
            </Link>
          </Revela>
        </section>

        {/* Rodapé */}
        <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-4 px-5 py-12 pb-safe text-center text-sm text-nevoa-fraca">
          <span className="flex items-center gap-2">
            <FoxGlyph className="h-7 w-7" />
            <span className="font-display font-bold text-nevoa">Fox Finance</span>
          </span>
          <div className="flex gap-5">
            <Link href="/entrar" className="transition hover:text-nevoa">
              Entrar
            </Link>
            <Link href="/criar-conta" className="transition hover:text-nevoa">
              Criar conta
            </Link>
            <Link href="/privacidade" className="transition hover:text-nevoa">
              Privacidade
            </Link>
          </div>
          <p className="text-xs">Feito com capricho no Brasil.</p>
        </footer>
      </div>
    </LazyMotion>
  );
}
