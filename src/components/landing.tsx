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
} from "motion/react";
import { FoxMascote } from "@/components/fox-mascote";
import { FoxGlyph } from "@/components/marca";
import { FundoVivo } from "@/components/fundo-vivo";

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

export function Landing() {
  const { scrollYProgress } = useScroll();
  const barra = useSpring(scrollYProgress, { stiffness: 120, damping: 30, mass: 0.3 });

  const cardRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: cardProg } = useScroll({
    target: cardRef,
    offset: ["start end", "end start"],
  });
  const cardY = useTransform(cardProg, [0, 1], [40, -40]);

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
                <Link
                  href="/criar-conta"
                  className="flex h-13 items-center justify-center rounded-lg bg-verde px-7 font-display text-base font-bold text-tinta shadow-[0_10px_28px_-8px_var(--verde)] transition hover:bg-verde-forte active:scale-[.98]"
                >
                  Criar conta grátis
                </Link>
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
              <Revela
                key={titulo}
                atraso={i * 0.08}
                className="flex flex-col gap-3 rounded-2xl border border-linha bg-carvao/70 p-6 backdrop-blur transition hover:-translate-y-1.5 hover:shadow-[var(--sombra-card)]"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-menta font-display text-lg font-extrabold text-verde-texto">
                  {i + 1}
                </span>
                <h3 className="font-display text-xl font-bold">{titulo}</h3>
                <p className="text-nevoa-fraca">{texto}</p>
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

        {/* 4. PRINT EM DESTAQUE */}
        <section className="mx-auto w-full max-w-5xl px-5 py-16 md:py-24">
          <Revela className="mb-10 flex flex-col items-center gap-3 text-center">
            <span className="text-xs font-bold uppercase tracking-widest text-verde-texto">Por dentro</span>
            <h2 className="font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Seu mês, numa olhada
            </h2>
          </Revela>
          <div ref={cardRef} className="flex justify-center">
            <m.div
              initial={{ opacity: 0, rotate: -4, y: 30 }}
              whileInView={{ opacity: 1, rotate: 0, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.8, ease: SUAVE }}
              style={{ y: cardY }}
              className="relative w-[70%] max-w-[300px]"
            >
              <div className="pointer-events-none absolute inset-0 -z-10 scale-125 rounded-full bg-verde-vivo/20 blur-3xl" />
              <div className="relative aspect-[780/1688] w-full overflow-hidden rounded-[2.5rem] border-[6px] border-[#0b1f17] bg-[#0b1f17] shadow-[0_40px_80px_-24px_rgba(6,78,59,0.5)]">
                <div className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-[#0b1f17]" />
                <Image
                  src="/prints/dashboard-claro.png"
                  alt="Resumo do mês no Fox Finance"
                  width={780}
                  height={1688}
                  sizes="(max-width: 768px) 70vw, 300px"
                  className="h-full w-full object-cover object-top"
                />
              </div>
            </m.div>
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
              <Link
                href="/criar-conta"
                onClick={comemorar}
                className="flex h-14 items-center justify-center rounded-lg bg-white px-8 font-display text-lg font-bold text-verde-texto shadow-[0_12px_30px_-8px_rgba(5,46,22,0.4)] transition hover:-translate-y-0.5 active:scale-[.98]"
              >
                Criar minha conta
              </Link>
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
