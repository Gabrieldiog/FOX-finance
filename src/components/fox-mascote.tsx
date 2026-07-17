"use client";

import { useEffect, useId, useRef, useState } from "react";
import {
  LazyMotion,
  domAnimation,
  m,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";

// A raposa do Fox Finance — SVG próprio, tema-aware, leve.
// Laranja (raposa verde perde a leitura); o verde da marca entra no cachecol e
// no reflexo dos olhos. Profundidade por gradiente + sombra de contato +
// catchlight nos olhos + luz de borda — é isso (não o traço) que a tira do "flat morto".

export type Emocao = "neutro" | "atento" | "tapado" | "espiando" | "feliz" | "erro";

const BOCA = {
  neutro: "M 86 108 Q 100 118 114 108",
  atento: "M 88 109 Q 100 116 112 109",
  tapado: "M 88 109 Q 100 116 112 109",
  espiando: "M 88 110 Q 100 117 112 110",
  feliz: "M 82 106 Q 100 126 118 106",
  erro: "M 88 116 Q 100 108 112 116",
} as const;

function Interno({
  size,
  emocao,
  seguirMouse,
  acenar,
}: {
  size: number;
  emocao: Emocao;
  seguirMouse: boolean;
  acenar: boolean;
}) {
  const uid = useId().replace(/:/g, "");
  const reduzido = useReducedMotion();
  const ref = useRef<SVGSVGElement>(null);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 120, damping: 18 });
  const sy = useSpring(my, { stiffness: 120, damping: 18 });
  const cabecaRot = useTransform(sx, [-1, 1], [-5, 5]);
  const pupX = useTransform(sx, [-1, 1], [-4, 4]);
  const pupY = useTransform(sy, [-1, 1], [-3, 4]);

  useEffect(() => {
    if (!seguirMouse || reduzido) return;
    const h = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2 || 1);
      const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2 || 1);
      mx.set(Math.max(-1, Math.min(1, dx)));
      my.set(Math.max(-1, Math.min(1, dy)));
    };
    window.addEventListener("pointermove", h, { passive: true });
    return () => window.removeEventListener("pointermove", h);
  }, [seguirMouse, reduzido, mx, my]);

  // Piscar aleatório.
  const [piscando, setPiscando] = useState(false);
  useEffect(() => {
    if (reduzido) return;
    let t: ReturnType<typeof setTimeout>;
    const agenda = () => {
      t = setTimeout(
        () => {
          setPiscando(true);
          setTimeout(() => setPiscando(false), 110);
          agenda();
        },
        3200 + Math.random() * 3600,
      );
    };
    agenda();
    return () => clearTimeout(t);
  }, [reduzido]);

  const tapado = emocao === "tapado";
  const espiando = emocao === "espiando";
  const olhoSY = piscando ? 0.08 : 1;

  const animCorpo =
    emocao === "feliz"
      ? { y: [0, -10, 0], transition: { duration: 0.6, ease: "easeOut" as const } }
      : emocao === "erro"
        ? { x: [0, -6, 6, -4, 4, 0], transition: { duration: 0.45 } }
        : reduzido
          ? {}
          : { scale: [1, 1.015, 1], transition: { duration: 3.6, repeat: Infinity, ease: "easeInOut" as const } };

  const orelhaEsq = emocao === "erro" ? { rotate: -12 } : { rotate: 0 };
  const orelhaDir = emocao === "erro" ? { rotate: 12 } : { rotate: 0 };
  const pataEsq = tapado || espiando ? { y: 0, opacity: 1 } : { y: 54, opacity: 0 };
  const pataDir = tapado ? { y: 0, opacity: 1 } : espiando ? { y: 30, opacity: 1 } : { y: 54, opacity: 0 };

  const g = (n: string) => `${n}-${uid}`;

  return (
    <m.svg
      ref={ref}
      viewBox="0 0 200 210"
      width={size}
      height={size * (210 / 200)}
      aria-hidden="true"
      style={{ pointerEvents: "none", overflow: "visible" }}
      animate={animCorpo}
    >
      <defs>
        <radialGradient id={g("fur")} cx="42%" cy="28%" r="85%">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="52%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#ea6a0e" />
        </radialGradient>
        <radialGradient id={g("belly")} cx="50%" cy="32%" r="72%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#fde7ce" />
        </radialGradient>
        <radialGradient id={g("iris")} cx="42%" cy="32%" r="70%">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#5b2c0a" />
        </radialGradient>
        <linearGradient id={g("scarf")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
        <filter id={g("soft")} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Sombra de contato — "descola" a raposa do fundo */}
      <ellipse cx="100" cy="200" rx="52" ry="8" fill="#0f172a" opacity="0.12" filter={`url(#${g("soft")})`} />

      {/* Cauda (atrás), com ponta creme */}
      <g>
        <path
          d="M 70 150 C 30 152 10 118 22 86 C 26 110 44 126 74 128 Z"
          fill={`url(#${g("fur")})`}
        />
        <path d="M 22 86 C 15 98 15 116 26 128 C 34 118 30 100 34 92 Z" fill={`url(#${g("belly")})`} />
      </g>

      {/* Corpo + barriga */}
      <path d="M 62 122 C 54 164 66 196 100 196 C 134 196 146 164 138 122 Z" fill={`url(#${g("fur")})`} />
      <path d="M 78 130 C 72 160 80 184 100 184 C 120 184 128 160 122 130 Z" fill={`url(#${g("belly")})`} />

      {/* Cachecol verde — o toque de marca */}
      <path d="M 66 120 C 82 132 118 132 134 120 L 138 132 C 118 144 82 144 62 132 Z" fill={`url(#${g("scarf")})`} />
      <path d="M 122 130 L 132 152 L 118 150 L 114 132 Z" fill="#15803d" />

      {/* Cabeça: inclina de leve seguindo o mouse */}
      <m.g style={{ rotate: cabecaRot, transformBox: "fill-box", transformOrigin: "50% 88%" }}>
        {/* Orelhas (atrás da cabeça) */}
        <m.g style={{ transformBox: "fill-box", transformOrigin: "82% 92%" }} animate={orelhaEsq}>
          <path d="M 40 66 L 34 12 Q 33 5 41 10 L 84 46 Z" fill={`url(#${g("fur")})`} strokeLinejoin="round" />
          <path d="M 46 56 L 42 20 L 74 46 Z" fill="#4b2e2a" strokeLinejoin="round" />
          <path d="M 34 12 Q 33 5 41 10 L 45 22 Z" fill="#7c3f16" />
        </m.g>
        <m.g style={{ transformBox: "fill-box", transformOrigin: "18% 92%" }} animate={orelhaDir}>
          <path d="M 160 66 L 166 12 Q 167 5 159 10 L 116 46 Z" fill={`url(#${g("fur")})`} strokeLinejoin="round" />
          <path d="M 154 56 L 158 20 L 126 46 Z" fill="#4b2e2a" strokeLinejoin="round" />
          <path d="M 166 12 Q 167 5 159 10 L 155 22 Z" fill="#7c3f16" />
        </m.g>

        {/* Rosto */}
        <path
          d="M 40 74 C 34 46 54 28 80 27 C 90 25 110 25 120 27 C 146 28 166 46 160 74 C 156 100 130 120 100 124 C 70 120 44 100 40 74 Z"
          fill={`url(#${g("fur")})`}
        />
        {/* Luz de borda (topo-esquerda) */}
        <path
          d="M 40 74 C 34 46 54 28 80 27 C 70 34 56 50 52 74 Z"
          fill="#fdba74"
          opacity="0.55"
        />
        {/* Bochechas/focinho creme */}
        <path d="M 44 78 L 30 82 L 44 92 Z" fill={`url(#${g("belly")})`} strokeLinejoin="round" />
        <path d="M 156 78 L 170 82 L 156 92 Z" fill={`url(#${g("belly")})`} strokeLinejoin="round" />
        <path
          d="M 100 62 C 74 62 58 82 63 104 C 68 122 86 130 100 130 C 114 130 132 122 137 104 C 142 82 126 62 100 62 Z"
          fill={`url(#${g("belly")})`}
        />
        {/* Sombra própria (core shadow) no lado direito-baixo */}
        <path
          d="M 137 104 C 132 122 114 130 100 130 C 118 126 130 112 132 96 Z"
          fill="#ea6a0e"
          opacity="0.35"
          filter={`url(#${g("soft")})`}
        />

        {/* Olhos com catchlight */}
        <m.g style={{ transformBox: "fill-box", transformOrigin: "50% 50%" }} animate={{ scaleY: olhoSY }}>
          <ellipse cx="79" cy="80" rx="13" ry="15" fill="#ffffff" />
          <ellipse cx="121" cy="80" rx="13" ry="15" fill="#ffffff" />
          <m.g style={{ x: pupX, y: pupY }}>
            <circle cx="79" cy="81" r="9.5" fill={`url(#${g("iris")})`} />
            <circle cx="79" cy="81" r="5.5" fill="#1c1206" />
            <path d="M 71 87 A 9.5 9.5 0 0 0 88 86" fill="none" stroke="#22c55e" strokeWidth="1.6" opacity="0.5" />
            <circle cx="75.5" cy="76.5" r="3" fill="#ffffff" />
            <circle cx="82" cy="84" r="1.3" fill="#ffffff" opacity="0.7" />
            <circle cx="121" cy="81" r="9.5" fill={`url(#${g("iris")})`} />
            <circle cx="121" cy="81" r="5.5" fill="#1c1206" />
            <path d="M 113 87 A 9.5 9.5 0 0 0 130 86" fill="none" stroke="#22c55e" strokeWidth="1.6" opacity="0.5" />
            <circle cx="117.5" cy="76.5" r="3" fill="#ffffff" />
            <circle cx="124" cy="84" r="1.3" fill="#ffffff" opacity="0.7" />
          </m.g>
          {/* Pálpebra superior — expressão gentil */}
          <path d="M 66 80 A 13 15 0 0 1 92 74 L 92 68 L 66 68 Z" fill={`url(#${g("fur")})`} />
          <path d="M 108 80 A 13 15 0 0 1 134 74 L 134 68 L 108 68 Z" fill={`url(#${g("fur")})`} />
        </m.g>

        {/* Nariz + boca */}
        <path d="M 92 98 Q 100 95 108 98 Q 104 108 100 108 Q 96 108 92 98 Z" fill="#3f2a24" />
        <circle cx="96.5" cy="99.5" r="1.4" fill="#ffffff" opacity="0.6" />
        <m.path
          d={BOCA.neutro}
          animate={{ d: BOCA[emocao] }}
          fill="none"
          stroke="#3f2a24"
          strokeWidth="2.6"
          strokeLinecap="round"
        />

        {/* Patas que tapam os olhos (senha) */}
        <m.g animate={pataEsq} initial={false}>
          <path d="M 70 70 C 60 70 56 82 60 92 C 63 100 82 100 85 92 C 89 82 84 70 70 70 Z" fill={`url(#${g("fur")})`} />
          <path d="M 66 90 L 66 95 M 70 91 L 70 96 M 74 90 L 74 95" stroke="#ea6a0e" strokeWidth="1.8" strokeLinecap="round" />
        </m.g>
        <m.g animate={pataDir} initial={false}>
          <path d="M 130 70 C 116 70 111 82 115 92 C 118 100 137 100 140 92 C 144 82 140 70 130 70 Z" fill={`url(#${g("fur")})`} />
          <path d="M 126 90 L 126 95 M 130 91 L 130 96 M 134 90 L 134 95" stroke="#ea6a0e" strokeWidth="1.8" strokeLinecap="round" />
        </m.g>
      </m.g>

      {/* Braço acenando (CTA) */}
      {acenar && !reduzido && (
        <m.g
          style={{ transformBox: "fill-box", transformOrigin: "20% 90%" }}
          animate={{ rotate: [0, -18, 6, -18, 0] }}
          transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1.2, ease: "easeInOut" }}
        >
          <path d="M 138 140 C 156 132 170 120 172 104 C 178 112 176 130 162 144 C 154 152 142 152 138 148 Z" fill={`url(#${g("fur")})`} />
          <ellipse cx="170" cy="106" rx="9" ry="10" fill={`url(#${g("fur")})`} />
        </m.g>
      )}
    </m.svg>
  );
}

export function FoxMascote({
  size = 120,
  emocao = "neutro",
  seguirMouse = false,
  acenar = false,
  className,
}: {
  size?: number;
  emocao?: Emocao;
  seguirMouse?: boolean;
  acenar?: boolean;
  className?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-block", lineHeight: 0 }}>
      <LazyMotion features={domAnimation}>
        <Interno size={size} emocao={emocao} seguirMouse={seguirMouse} acenar={acenar} />
      </LazyMotion>
    </span>
  );
}
