"use client";

import { useEffect, useRef, useState } from "react";
import {
  m,
  useMotionValue,
  useMotionTemplate,
  useReducedMotion,
  useSpring,
  useTransform,
  animate,
  useInView,
} from "motion/react";
import { formatBRL } from "@/lib/format";

// Card com inclinação 3D + holofote que segue o cursor. O efeito de landing
// premium (Linear/Vercel) feito com o Motion que já temos.
export function CardTilt({
  children,
  className,
  intensidade = 8,
}: {
  children: React.ReactNode;
  className?: string;
  intensidade?: number;
}) {
  const reduz = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const [ativo, setAtivo] = useState(false);

  const rx = useSpring(useTransform(my, [0, 1], [intensidade, -intensidade]), { stiffness: 200, damping: 20 });
  const ry = useSpring(useTransform(mx, [0, 1], [-intensidade, intensidade]), { stiffness: 200, damping: 20 });
  const gx = useTransform(mx, (v) => `${v * 100}%`);
  const gy = useTransform(my, (v) => `${v * 100}%`);
  const holofote = useMotionTemplate`radial-gradient(circle at ${gx} ${gy}, rgba(34,197,94,0.20), transparent 55%)`;

  function onMove(e: React.MouseEvent) {
    if (reduz) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  }
  function sair() {
    setAtivo(false);
    mx.set(0.5);
    my.set(0.5);
  }

  return (
    <m.div
      ref={ref}
      onMouseMove={onMove}
      onMouseEnter={() => setAtivo(true)}
      onMouseLeave={sair}
      style={reduz ? undefined : { rotateX: rx, rotateY: ry, transformPerspective: 900, transformStyle: "preserve-3d" }}
      className={`relative ${className ?? ""}`}
    >
      {!reduz && (
        <m.div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] transition-opacity duration-300"
          style={{ background: holofote, opacity: ativo ? 1 : 0 }}
        />
      )}
      <div className="relative z-10 h-full">{children}</div>
    </m.div>
  );
}

// Número que conta ao entrar na viewport (não no load, senão termina antes de você ver).
export function ContadorInView({
  cents,
  className,
  prefixo = "",
}: {
  cents: number;
  className?: string;
  prefixo?: string;
}) {
  const reduz = useReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const naView = useInView(ref, { once: true, margin: "-60px" });
  const [texto, setTexto] = useState(formatBRL(0));

  useEffect(() => {
    if (!naView) return;
    if (reduz) {
      setTexto(formatBRL(cents));
      return;
    }
    const controls = animate(0, cents, {
      duration: 1.1,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setTexto(formatBRL(Math.round(v))),
    });
    return () => controls.stop();
  }, [naView, cents, reduz]);

  return (
    <span ref={ref} className={className}>
      {prefixo}
      {texto}
    </span>
  );
}

// Barra que "enche" ao entrar na viewport.
export function BarraInView({ pct, cor, atraso = 0 }: { pct: number; cor: string; atraso?: number }) {
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-menta">
      <m.div
        className="h-full rounded-full"
        style={{ backgroundColor: cor }}
        initial={{ width: 0 }}
        whileInView={{ width: `${pct}%` }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.9, delay: atraso, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

// Botão magnético: gruda de leve no cursor. Envolve um Link/anchor.
export function Magnetico({ children, className }: { children: React.ReactNode; className?: string }) {
  const reduz = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(0, { stiffness: 250, damping: 15 });
  const y = useSpring(0, { stiffness: 250, damping: 15 });

  function onMove(e: React.MouseEvent) {
    if (reduz) return;
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    x.set((e.clientX - (r.left + r.width / 2)) * 0.3);
    y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
  }
  return (
    <m.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ x, y }}
      className={`inline-block ${className ?? ""}`}
    >
      {children}
    </m.div>
  );
}
