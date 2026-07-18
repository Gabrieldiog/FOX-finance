"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const TIPOS = [
  { id: "", label: "Tudo" },
  { id: "expense", label: "Gastos" },
  { id: "income", label: "Ganhos" },
] as const;

// Busca + filtro de tipo. Empurra o estado pra URL (o server component relê e
// devolve o resultado). Debounce por ref no onChange — sem efeito, sem timer solto.
export function BuscaLancamentos({
  qInicial,
  tipoInicial,
}: {
  qInicial: string;
  tipoInicial: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(qInicial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function irPara(texto: string, tipo: string) {
    const params = new URLSearchParams();
    if (texto.trim()) params.set("q", texto.trim());
    if (tipo) params.set("tipo", tipo);
    const qs = params.toString();
    router.replace(qs ? `/lancamentos?${qs}` : "/lancamentos");
  }

  function aoDigitar(v: string) {
    setQ(v);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => irPara(v, tipoInicial), 300);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sage">
          <svg
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.75}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.2-3.2" />
          </svg>
        </span>
        <input
          value={q}
          onChange={(e) => aoDigitar(e.target.value)}
          placeholder="Buscar por descrição ou categoria"
          aria-label="Buscar lançamentos"
          className="h-12 w-full rounded-xl border border-pauta bg-feltro-alto pl-10 pr-4 text-creme outline-none transition placeholder:text-sage focus:border-brilho"
        />
      </div>
      <div className="flex gap-2">
        {TIPOS.map((t) => {
          const on = tipoInicial === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => irPara(q, t.id)}
              className={`flex-1 rounded-xl border py-2 text-center text-sm font-medium transition ${
                on ? "border-brilho bg-brilho/10 text-creme" : "border-pauta text-sage"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
