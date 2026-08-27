"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { excluirCategoria } from "@/lib/actions";
import { IconeCategoria } from "@/components/icone-categoria";

type Cat = { id: string; name: string; type: string; icon: string; color: string };

// Lista e apaga só as categorias próprias. Apagar não mexe nos lançamentos: os
// que usavam a categoria ficam sem categoria (não somem).
export function GerirCategorias({ categorias }: { categorias: Cat[] }) {
  const router = useRouter();
  const [lista, setLista] = useState(categorias);
  const [apagando, setApagando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function apagar(id: string) {
    setApagando(id);
    setErro(null);
    const res = await excluirCategoria(id);
    setApagando(null);
    if (res.ok) {
      setLista((l) => l.filter((c) => c.id !== id));
      router.refresh();
      return;
    }
    // Sem isto, apertar "Apagar" e nada acontecer parecia travamento.
    setErro(res.erro);
  }

  return (
    <section className="flex flex-col gap-2">
      <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">
        Minhas categorias
      </p>

      {erro && <p className="text-sm font-medium text-alerta">{erro}</p>}

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-pauta bg-feltro-alto p-5 text-sm text-sage">
          Você ainda não criou categorias próprias. Crie uma ao registrar um lançamento, no
          botão “Nova”.
        </div>
      ) : (
        lista.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-pauta bg-feltro-alto px-4 py-3"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${c.color}1f`, color: c.color }}
            >
              <IconeCategoria nome={c.icon} className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-medium text-creme">{c.name}</span>
            <span className="font-mono text-[0.62rem] uppercase tracking-[0.1em] text-sage">
              {c.type === "income" ? "Ganho" : "Gasto"}
            </span>
            <button
              type="button"
              onClick={() => apagar(c.id)}
              disabled={apagando === c.id}
              className="text-sm font-medium text-alerta transition active:scale-95 disabled:opacity-50"
            >
              {apagando === c.id ? "…" : "Apagar"}
            </button>
          </div>
        ))
      )}
    </section>
  );
}
