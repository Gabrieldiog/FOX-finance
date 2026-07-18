"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, LazyMotion, domAnimation, m } from "motion/react";
import { RaposaCanvas } from "@/components/raposa-3d/raposa-canvas";
import { FoxGlyph } from "@/components/marca";
import { ContadorInView } from "@/components/efeitos";

const SUAVE = [0.16, 1, 0.3, 1] as const;

function Sobe({ children, atraso = 0, className }: { children: React.ReactNode; atraso?: number; className?: string }) {
  return (
    <m.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.6, delay: atraso, ease: SUAVE }}
    >
      {children}
    </m.div>
  );
}

// Rótulo de "razão": mono, uppercase, tracking largo.
function Rotulo({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`font-mono text-xs uppercase tracking-[0.18em] ${className ?? ""}`}>{children}</span>
  );
}

const RAZAO: [string, string, string, boolean][] = [
  ["04 JUL", "Mercado", "−182,90", false],
  ["03 JUL", "Salário", "+3.500,00", true],
  ["02 JUL", "Farmácia", "−54,70", false],
];

const PASSOS: [string, string, string][] = [
  ["01", "Você lança", "Gasto ou ganho num toque: valor, categoria, salvou. Mais rápido que rabiscar no papel."],
  ["02", "A raposa organiza", "Ela soma e separa cada real por categoria — você não abre planilha nenhuma."],
  ["03", "Você vê o mês fechar", "No fim da semana e do mês, um número te diz: sobrou ou faltou."],
];

const SEGURANCA: [string, string][] = [
  ["Isolamento", "Cada caderneta é lida só pela sua sessão. Ninguém — nem a gente — abre a sua."],
  ["Senha", "Guardada com Argon2id, o padrão de hoje. Nunca em texto puro."],
  ["Sem robô", "Trava depois de 5 senhas erradas, honeypot no cadastro, limite por IP."],
];

const FAQ: [string, string][] = [
  ["É grátis mesmo?", "É. Cria conta e usa sem pagar nada e sem cartão — é um projeto pessoal, feito pra gente de verdade usar."],
  ["Preciso conectar meu banco?", "Não. Você anota do seu jeito — nada de senha de banco, nada de open finance."],
  ["Meus dados estão seguros?", "Sim. Senha com Argon2id, cada conta isolada da outra e trava contra força bruta."],
  ["Funciona no celular?", "Funciona, e dá pra instalar como app na tela inicial (PWA), sem loja."],
  ["E se eu quiser sair?", "Seus dados são seus: exporte tudo em JSON ou exclua a conta de verdade quando quiser (LGPD)."],
];

// Recorte do mês recriado em HTML (nítido e animável, no lugar de print).
function RecorteDoMes() {
  const cats: [string, string, number][] = [
    ["Mercado", "545,80", 100],
    ["Contas", "220,00", 40],
    ["Transporte", "87,90", 16],
  ];
  return (
    <div className="rounded-2xl border border-pauta bg-feltro-alto p-6">
      <div className="flex items-baseline justify-between border-b border-pauta pb-4">
        <Rotulo className="text-sage">Sobrou em julho</Rotulo>
        <Rotulo className="text-sage">semana · mês</Rotulo>
      </div>
      <p className="mt-4 font-serif text-4xl font-semibold tracking-tight text-creme [font-variant-numeric:tabular-nums]">
        R$ 2.510,97
      </p>
      <div className="mt-5 flex flex-col gap-3">
        {cats.map(([nome, val, pct]) => (
          <div key={nome} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between font-mono text-sm">
              <span className="font-grotesk text-creme">{nome}</span>
              <span className="tabular-nums text-sage">R$ {val}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-pauta/60">
              <m.div
                className="h-full rounded-full bg-brilho"
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: SUAVE }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Faq() {
  const [aberto, setAberto] = useState<number | null>(0);
  return (
    <div className="border-t border-pauta">
      {FAQ.map(([q, a], i) => {
        const on = aberto === i;
        return (
          <div key={q} className="border-b border-pauta">
            <button
              type="button"
              onClick={() => setAberto(on ? null : i)}
              aria-expanded={on}
              className="flex w-full items-center justify-between gap-4 py-5 text-left"
            >
              <span className="font-serif text-lg font-medium text-creme">{q}</span>
              <span className={`shrink-0 font-mono text-xl text-brilho transition-transform duration-300 ${on ? "rotate-45" : ""}`}>
                +
              </span>
            </button>
            <AnimatePresence initial={false}>
              {on && (
                <m.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.28, ease: SUAVE }}
                  className="overflow-hidden"
                >
                  <p className="max-w-2xl pb-5 leading-relaxed text-sage">{a}</p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

export function LandingV2() {
  return (
    <LazyMotion features={domAnimation}>
      <div className="min-h-dvh bg-feltro font-grotesk text-creme">
        {/* Navbar */}
        <header className="border-b border-pauta">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
            <span className="flex items-center gap-2">
              <FoxGlyph className="h-7 w-7" />
              <span className="font-serif text-lg font-semibold tracking-tight">Fox Finance</span>
            </span>
            <Link href="/entrar" className="font-mono text-xs uppercase tracking-[0.12em] text-sage transition hover:text-creme">
              Entrar
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-16 md:grid-cols-[1.05fr_0.95fr] md:gap-10 md:py-24">
          <div className="flex flex-col items-start">
            <m.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: SUAVE }}>
              <Rotulo className="text-brilho">Caderneta pessoal — desde hoje</Rotulo>
            </m.div>
            <m.h1
              initial={{ opacity: 0.1, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.06, ease: SUAVE }}
              className="mt-5 font-serif text-[3rem] font-medium leading-[1.02] tracking-[-0.02em] md:text-[4.25rem]"
            >
              Suas finanças,
              <br />
              <span className="italic text-brilho">com calma.</span>
            </m.h1>
            <m.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.14, ease: SUAVE }}
              className="mt-6 max-w-md text-lg leading-relaxed text-sage"
            >
              Anote no susto, entenda com calma. A raposa cuida do razão — você vê o mês fechar,
              sem planilha e sem sermão.
            </m.p>
            <m.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22, ease: SUAVE }}
              className="mt-8 flex flex-col items-start gap-4"
            >
              <div className="flex flex-wrap items-center gap-3">
                <Link href="/criar-conta" className="rounded-[10px] bg-brilho px-6 py-3.5 font-semibold text-feltro transition hover:brightness-110">
                  Abrir minha caderneta
                </Link>
                <a href="#caderneta" className="rounded-[10px] border border-pauta px-5 py-3.5 font-semibold text-creme transition hover:bg-feltro-alto">
                  Ver como funciona
                </a>
              </div>
              <Rotulo className="text-sage">Grátis · sem cartão · código aberto</Rotulo>
            </m.div>
          </div>

          {/* Toca: saldo + raposa 3D */}
          <m.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: SUAVE }}
          >
            <div className="overflow-hidden rounded-2xl border border-pauta bg-feltro-alto">
              <div className="flex items-center justify-between border-b border-pauta px-6 py-3">
                <Rotulo className="text-sage">Saldo do mês</Rotulo>
                <Rotulo className="text-sage">julho</Rotulo>
              </div>
              <div className="flex flex-col items-center gap-1 px-6 pt-5">
                <ContadorInView cents={251097} className="font-serif text-5xl font-semibold tracking-tight text-creme [font-variant-numeric:tabular-nums] md:text-6xl" />
                <Rotulo className="text-brilho">no verde — a raposa aprova</Rotulo>
              </div>
              <div className="-mt-1 flex justify-center">
                <RaposaCanvas size={300} />
              </div>
            </div>
          </m.div>
        </section>

        {/* Rodapé-razão do hero */}
        <section className="mx-auto max-w-6xl px-6 pb-20">
          <Sobe>
            <div className="border-t border-pauta">
              {RAZAO.map(([data, desc, valor, positivo]) => (
                <div key={data + desc} className="flex items-center gap-4 border-b border-pauta py-3.5 font-mono text-sm">
                  <span className="w-16 shrink-0 uppercase tracking-[0.08em] text-sage">{data}</span>
                  <span className="flex-1 font-grotesk text-base text-creme">{desc}</span>
                  <span className={`tabular-nums ${positivo ? "text-brilho" : "text-[#f08a7a]"}`}>R$ {valor}</span>
                </div>
              ))}
            </div>
          </Sobe>
        </section>

        {/* §2 — A caderneta (como funciona) */}
        <section id="caderneta" className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Sobe className="mb-10 flex flex-col gap-3">
            <Rotulo className="text-brilho">A caderneta</Rotulo>
            <h2 className="max-w-xl font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Três passos, sem esforço.
            </h2>
          </Sobe>
          <div className="border-t border-pauta">
            {PASSOS.map(([num, titulo, texto], i) => (
              <Sobe key={num} atraso={i * 0.06}>
                <div className="grid grid-cols-[3rem_1fr] items-start gap-4 border-b border-pauta py-8 md:grid-cols-[5rem_1fr_1.4fr] md:gap-8">
                  <span className="font-mono text-2xl text-brilho">{num}</span>
                  <h3 className="font-serif text-2xl font-medium text-creme">{titulo}</h3>
                  <p className="col-span-2 text-lg leading-relaxed text-sage md:col-span-1">{texto}</p>
                </div>
              </Sobe>
            ))}
          </div>
        </section>

        {/* §3 — Um recorte do mês (produto) */}
        <section className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-6 py-20 md:grid-cols-2 md:gap-16 md:py-28">
          <Sobe className="flex flex-col gap-5">
            <Rotulo className="text-brilho">O mês numa olhada</Rotulo>
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Bate o olho e sabe se fechou no azul.
            </h2>
            <p className="max-w-md text-lg leading-relaxed text-sage">
              Um número grande no topo — quanto sobrou. Embaixo, pra onde cada real foi, em barras
              que você lê num relance.
            </p>
          </Sobe>
          <Sobe atraso={0.1}>
            <RecorteDoMes />
          </Sobe>
        </section>

        {/* §4 — Segurança honesta */}
        <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
          <Sobe className="mb-10 flex flex-col gap-3">
            <Rotulo className="text-brilho">Seu dinheiro é seu</Rotulo>
            <h2 className="max-w-xl font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Cada caderneta é só sua.
            </h2>
          </Sobe>
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-pauta bg-pauta md:grid-cols-3">
            {SEGURANCA.map(([titulo, texto], i) => (
              <Sobe key={titulo} atraso={i * 0.06} className="bg-feltro-alto">
                <div className="flex h-full flex-col gap-2 p-6">
                  <Rotulo className="text-brilho">{titulo}</Rotulo>
                  <p className="leading-relaxed text-sage">{texto}</p>
                </div>
              </Sobe>
            ))}
          </div>
        </section>

        {/* §5 — FAQ */}
        <section className="mx-auto max-w-3xl px-6 py-20 md:py-28">
          <Sobe className="mb-8 flex flex-col gap-3">
            <Rotulo className="text-brilho">Perguntas</Rotulo>
            <h2 className="font-serif text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              O que costumam perguntar.
            </h2>
          </Sobe>
          <Sobe atraso={0.05}>
            <Faq />
          </Sobe>
        </section>

        {/* §6 — CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24 md:py-32">
          <Sobe className="flex flex-col items-center gap-6 text-center">
            <h2 className="max-w-2xl font-serif text-4xl font-medium leading-tight tracking-tight md:text-6xl">
              Comece sua caderneta hoje.
            </h2>
            <p className="max-w-md text-lg text-sage">Leva 2 minutos. A raposa faz o resto.</p>
            <Link href="/criar-conta" className="rounded-[10px] bg-brilho px-8 py-4 font-semibold text-feltro transition hover:brightness-110">
              Abrir minha caderneta
            </Link>
          </Sobe>
        </section>

        {/* Footer */}
        <footer className="border-t border-pauta">
          <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 font-mono text-xs uppercase tracking-[0.12em] text-sage md:flex-row md:items-center md:justify-between">
            <span className="flex items-center gap-2 normal-case tracking-normal">
              <FoxGlyph className="h-6 w-6" />
              <span className="font-serif text-base font-semibold text-creme">Fox Finance</span>
            </span>
            <div className="flex gap-5">
              <Link href="/entrar" className="transition hover:text-creme">Entrar</Link>
              <Link href="/criar-conta" className="transition hover:text-creme">Criar conta</Link>
              <Link href="/privacidade" className="transition hover:text-creme">Privacidade</Link>
            </div>
            <span>2026 · Fox · saldo: incalculável</span>
          </div>
        </footer>
      </div>
    </LazyMotion>
  );
}
