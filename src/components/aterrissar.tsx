"use client";

import { LazyMotion, domAnimation, m } from "motion/react";

// Entrada curta e discreta (só transform/opacity, roda a 120Hz no ProMotion e
// respeita quem prefere menos movimento). Deslocamento pequeno de propósito —
// fade-up gigante é a cara de template.
export function Aterrissar({
  children,
  atraso = 0,
  className,
}: {
  children: React.ReactNode;
  atraso?: number;
  className?: string;
}) {
  return (
    <LazyMotion features={domAnimation}>
      <m.div
        className={className}
        initial={{ opacity: 0.1, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: atraso, ease: [0.23, 1, 0.32, 1] }}
      >
        {children}
      </m.div>
    </LazyMotion>
  );
}
