"use client";

import { useEffect, useRef, useState } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

// A raposa do Fox Finance. Um componente só, usado em todo o sistema:
// header, telas de entrar/criar conta, telas vazias e celebrações.
// Ela é LARANJA (raposa verde perde a leitura); o verde da marca mora no cenário.

export type Emocao = "neutro" | "atento" | "tapado" | "espiando" | "feliz" | "erro";

const CORPO = "#fb923c";
const SOMBRA = "#ea580c";
const CREME = "#fff7ed";
const ORELHA = "#fdba74";
const ESCURO = "#431407";
const PUPILA = "#241a12";

const BOCA = {
  neutro: "M 50 73 Q 55 77 60 77 Q 65 77 70 73",
  atento: "M 52 74 Q 56 77 60 77 Q 64 77 68 74",
  tapado: "M 52 74 Q 56 77 60 77 Q 64 77 68 74",
  espiando: "M 52 74 Q 56 78 60 78 Q 64 78 68 74",
  feliz: "M 47 72 Q 54 85 60 85 Q 66 85 73 72",
  erro: "M 51 79 Q 55 74 60 74 Q 65 74 69 79",
} as const;

function MascoteInterno({
  size,
  emocao,
  seguirMouse,
}: {
  size: number;
  emocao: Emocao;
  seguirMouse: boolean;
}) {
  const reduzido = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 260, damping: 26, mass: 0.6 });
  const sy = useSpring(my, { stiffness: 260, damping: 26, mass: 0.6 });

  const cabecaRot = useTransform(sx, [-1, 1], [-8, 8]);
  const cabecaY = useTransform(sy, [-1, 1], [-3, 4]);
  const pupilaX = useTransform(sx, [-1, 1], [-3, 3]);
  const pupilaY = useTransform(sy, [-1, 1], [-2.5, 3]);

  useEffect(() => {
    if (!seguirMouse || reduzido) return;
    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height * 0.4;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy) || 1;
      const f = Math.min(dist / 300, 1); // 300px = alcance de saturação
      mx.set((dx / dist) * f);
      my.set((dy / dist) * f);
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, [seguirMouse, reduzido, mx, my]);

  // Piscar aleatório: o detalhe que faz parecer viva.
  const [piscando, setPiscando] = useState(false);
  useEffect(() => {
    if (reduzido) return;
    let t: ReturnType<typeof setTimeout>;
    const agenda = () => {
      t = setTimeout(
        () => {
          setPiscando(true);
          setTimeout(() => setPiscando(false), 140);
          agenda();
        },
        2400 + Math.random() * 3600,
      );
    };
    agenda();
    return () => clearTimeout(t);
  }, [reduzido]);

  const tapado = emocao === "tapado";
  const espiando = emocao === "espiando";
  const olhoScaleY = piscando ? 0.1 : 1;

  // Balanço do corpo por emoção (pulo no acerto, tremida no erro).
  const animCorpo =
    emocao === "feliz"
      ? { y: [0, -12, 0], transition: { duration: 0.6, ease: "easeOut" as const } }
      : emocao === "erro"
        ? { x: [0, -7, 7, -5, 5, 0], transition: { duration: 0.45 } }
        : { x: 0, y: 0 };

  // Orelhas caem no erro.
  const orelhaEsq = emocao === "erro" ? { rotate: -14 } : { rotate: 0 };
  const orelhaDir = emocao === "erro" ? { rotate: 14 } : { rotate: 0 };

  // Patas: cobrem os olhos na senha; no "espiando" a da direita desce e um olho aparece.
  const pataEsq = tapado || espiando ? { y: 0, opacity: 1 } : { y: 42, opacity: 0 };
  const pataDir = tapado ? { y: 0, opacity: 1 } : espiando ? { y: 26, opacity: 1 } : { y: 42, opacity: 0 };

  return (
    <m.svg
      ref={ref}
      viewBox="0 0 120 124"
      width={size}
      height={size * (124 / 120)}
      aria-hidden="true"
      style={{ pointerEvents: "none", overflow: "visible" }}
      animate={animCorpo}
    >
      {/* Cauda atrás, com a ponta creme (marcador nº1 de raposa) */}
      <path
        d="M 40 104 C 16 100 8 80 16 62 C 18 76 30 86 46 88 Z"
        fill={CORPO}
        stroke={CORPO}
        strokeWidth="5"
        strokeLinejoin="round"
      />
      <path d="M 16 62 C 12 70 12 82 20 90 C 24 82 22 72 24 68 Z" fill={CREME} />

      {/* Corpo (estático — a cabeça é que inclina no pescoço) */}
      <path
        d="M 42 86 C 40 108 46 120 60 120 C 74 120 80 108 78 86 Z"
        fill={CORPO}
        stroke={CORPO}
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <path d="M 52 92 C 50 106 54 114 60 114 C 66 114 70 106 68 92 Z" fill={CREME} />

      {/* Cabeça: inclina seguindo o mouse, girando na base do pescoço */}
      <m.g style={{ rotate: cabecaRot, y: cabecaY, transformBox: "fill-box", transformOrigin: "50% 92%" }}>
        {/* Orelhas */}
        <m.path
          d="M 26 6 L 51 34 L 33 44 Z"
          fill={CORPO}
          stroke={CORPO}
          strokeWidth="5"
          strokeLinejoin="round"
          style={{ transformBox: "fill-box", transformOrigin: "80% 90%" }}
          animate={orelhaEsq}
        />
        <m.path
          d="M 31 16 L 45 33 L 34 38 Z"
          fill={ORELHA}
          strokeLinejoin="round"
          style={{ transformBox: "fill-box", transformOrigin: "80% 90%" }}
          animate={orelhaEsq}
        />
        <m.path
          d="M 94 6 L 69 34 L 87 44 Z"
          fill={CORPO}
          stroke={CORPO}
          strokeWidth="5"
          strokeLinejoin="round"
          style={{ transformBox: "fill-box", transformOrigin: "20% 90%" }}
          animate={orelhaDir}
        />
        <m.path
          d="M 89 16 L 75 33 L 86 38 Z"
          fill={ORELHA}
          strokeLinejoin="round"
          style={{ transformBox: "fill-box", transformOrigin: "20% 90%" }}
          animate={orelhaDir}
        />

        {/* Rosto */}
        <path
          d="M 30 30 C 18 40 18 64 34 78 C 44 88 76 88 86 78 C 102 64 102 40 90 30 C 76 22 44 22 30 30 Z"
          fill={CORPO}
          stroke={CORPO}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        {/* Tufos de bochecha */}
        <path d="M 30 60 L 19 64 L 30 72 Z" fill={CREME} stroke={CREME} strokeWidth="3" strokeLinejoin="round" />
        <path d="M 90 60 L 101 64 L 90 72 Z" fill={CREME} stroke={CREME} strokeWidth="3" strokeLinejoin="round" />
        {/* Focinho creme */}
        <path
          d="M 60 46 C 42 46 33 60 37 72 C 41 84 52 88 60 88 C 68 88 79 84 83 72 C 87 60 78 46 60 46 Z"
          fill={CREME}
        />

        {/* Olhos (sclera + pupila que segue o mouse + brilho) */}
        <m.g style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }} animate={{ scaleY: olhoScaleY }}>
          <ellipse cx="47" cy="52" rx="6.5" ry="8" fill="#ffffff" />
          <m.circle cx="47" cy="52" r="4.2" fill={PUPILA} style={{ x: pupilaX, y: pupilaY }} />
          <m.circle cx="45.4" cy="49.8" r="1.5" fill="#ffffff" style={{ x: pupilaX, y: pupilaY }} />
        </m.g>
        <m.g style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }} animate={{ scaleY: olhoScaleY }}>
          <ellipse cx="73" cy="52" rx="6.5" ry="8" fill="#ffffff" />
          <m.circle cx="73" cy="52" r="4.2" fill={PUPILA} style={{ x: pupilaX, y: pupilaY }} />
          <m.circle cx="71.4" cy="49.8" r="1.5" fill="#ffffff" style={{ x: pupilaX, y: pupilaY }} />
        </m.g>

        {/* Nariz + boca */}
        <path d="M 54 61 Q 60 59 66 61 Q 63 70 60 70 Q 57 70 54 61 Z" fill={ESCURO} />
        <m.path
          d={BOCA.neutro}
          animate={{ d: BOCA[emocao] }}
          fill="none"
          stroke={ESCURO}
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        {/* Patas que tapam os olhos (senha) */}
        <m.g animate={pataEsq} initial={false}>
          <path
            d="M 40 46 C 32 46 29 55 32 63 C 34 69 46 69 48 63 C 51 55 48 46 40 46 Z"
            fill={CORPO}
            stroke={CORPO}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 37 62 L 37 66 M 40 63 L 40 67 M 43 62 L 43 66" stroke={SOMBRA} strokeWidth="1.6" strokeLinecap="round" />
        </m.g>
        <m.g animate={pataDir} initial={false}>
          <path
            d="M 80 46 C 72 46 69 55 72 63 C 74 69 86 69 88 63 C 91 55 88 46 80 46 Z"
            fill={CORPO}
            stroke={CORPO}
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M 77 62 L 77 66 M 80 63 L 80 67 M 83 62 L 83 66" stroke={SOMBRA} strokeWidth="1.6" strokeLinecap="round" />
        </m.g>
      </m.g>
    </m.svg>
  );
}

export function FoxMascote({
  size = 120,
  emocao = "neutro",
  seguirMouse = false,
  className,
}: {
  size?: number;
  emocao?: Emocao;
  seguirMouse?: boolean;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-block", lineHeight: 0 }}>
      <LazyMotion features={domAnimation}>
        <MascoteInterno size={size} emocao={emocao} seguirMouse={seguirMouse} />
      </LazyMotion>
    </span>
  );
}
