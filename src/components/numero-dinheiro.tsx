"use client";

import { useEffect } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { formatBRL } from "@/lib/format";

function Contador({ cents }: { cents: number }) {
  const reduzido = useReducedMotion();
  const mv = useMotionValue(0);
  // Mola bem amortecida: desacelera calmo, sem quicar (dinheiro não pode "bouncar").
  const spring = useSpring(mv, { stiffness: 70, damping: 22, mass: 0.9 });
  const texto = useTransform(spring, (v) => formatBRL(Math.round(v)));

  useEffect(() => {
    if (reduzido) mv.jump(cents);
    else mv.set(cents);
  }, [cents, reduzido, mv]);

  return <m.span className="tnum">{texto}</m.span>;
}

// O número-herói que sobe contando ao abrir. A assinatura do Fox.
export function NumeroDinheiro({ cents, className }: { cents: number; className?: string }) {
  return (
    <span className={className}>
      <LazyMotion features={domAnimation}>
        <Contador cents={cents} />
      </LazyMotion>
    </span>
  );
}
