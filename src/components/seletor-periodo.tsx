"use client";

import Link from "next/link";
import { COOKIE_PERIODO, type Periodo } from "@/lib/periodo";

const ABAS: [Periodo, string][] = [
  ["semana", "Semana"],
  ["mes", "Mês"],
  ["total", "Total"],
];

export function SeletorPeriodo({ atual }: { atual: Periodo }) {
  return (
    <div className="flex rounded-full border border-pauta bg-feltro-alto p-1 font-mono text-xs uppercase tracking-[0.12em]">
      {ABAS.map(([p, rotulo]) => (
        <Link
          key={p}
          href={`/?periodo=${p}`}
          onClick={() => {
            document.cookie = `${COOKIE_PERIODO}=${p}; path=/; max-age=31536000; samesite=lax`;
          }}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-full text-center transition ${atual === p ? "bg-brilho text-feltro" : "text-sage"}`}
        >
          {rotulo}
        </Link>
      ))}
    </div>
  );
}
