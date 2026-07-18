"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { definirRecorrenciaAtiva, excluirRecorrencia } from "@/lib/actions";
import { IconeCategoria } from "@/components/icone-categoria";
import type { RecorrenciaView } from "@/lib/data/recorrencias";

export function GerirRecorrencias({ recorrencias }: { recorrencias: RecorrenciaView[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(recorrencias);
  const [ocupado, setOcupado] = useState<string | null>(null);

  async function alternar(id: string, ativaAgora: boolean) {
    setOcupado(id);
    const res = await definirRecorrenciaAtiva(id, !ativaAgora);
    setOcupado(null);
    if (res.ok) {
      setLista((l) => l.map((r) => (r.id === id ? { ...r, active: !ativaAgora } : r)));
      router.refresh();
    }
  }

  async function apagar(id: string) {
    setOcupado(id);
    const res = await excluirRecorrencia(id);
    setOcupado(null);
    if (res.ok) {
      setLista((l) => l.filter((r) => r.id !== id));
      router.refresh();
    }
  }

  if (lista.length === 0) {
    return (
      <div className="rounded-2xl border border-pauta bg-feltro-alto p-5 text-sm text-sage">
        Você ainda não tem lançamentos recorrentes. Ao registrar um ganho ou gasto, marque
        “Repete todo mês”.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {lista.map((r) => {
        const entrou = r.type === "income";
        const nome = r.description || r.categoryName || "Sem categoria";
        return (
          <div
            key={r.id}
            className={`flex items-center gap-3 rounded-2xl border border-pauta bg-feltro-alto px-4 py-3 ${r.active ? "" : "opacity-60"}`}
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{
                backgroundColor: `${r.categoryColor ?? "#64748b"}1f`,
                color: r.categoryColor ?? "#9db4a8",
              }}
            >
              <IconeCategoria nome={r.categoryIcon ?? "dots"} className="h-5 w-5" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-medium text-creme">{nome}</span>
              <span className="truncate font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage">
                todo dia {r.dayOfMonth}
                {r.active ? "" : " · pausado"}
              </span>
            </div>
            <span className={`font-serif text-sm tnum ${entrou ? "text-brilho" : "text-alerta"}`}>
              {entrou ? "+" : "−"}
              {formatBRL(r.amountCents)}
            </span>
            <button
              type="button"
              onClick={() => alternar(r.id, r.active)}
              disabled={ocupado === r.id}
              className="shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.1em] text-sage transition hover:text-creme disabled:opacity-50"
            >
              {r.active ? "pausar" : "retomar"}
            </button>
            <button
              type="button"
              onClick={() => apagar(r.id)}
              disabled={ocupado === r.id}
              aria-label={`Apagar recorrência ${nome}`}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-sage transition hover:text-alerta disabled:opacity-50"
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
