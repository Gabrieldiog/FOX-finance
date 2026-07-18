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

  async function apagar(id: string) {
    setApagando(id);
    const res = await excluirCategoria(id);
    setApagando(null);
    if (res.ok) {
      setLista((l) => l.filter((c) => c.id !== id));
      router.refresh();
    }
  }

  return (
    <section className="flex flex-col gap-2">
      <p className="font-display text-sm font-bold uppercase tracking-wider text-nevoa-fraca">
        Minhas categorias
      </p>

      {lista.length === 0 ? (
        <div className="rounded-2xl border border-linha bg-carvao p-5 text-sm text-nevoa-fraca shadow-[var(--sombra-card)]">
          Você ainda não criou categorias próprias. Crie uma ao registrar um lançamento, no
          botão “Nova”.
        </div>
      ) : (
        lista.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-3 rounded-2xl border border-linha bg-carvao px-4 py-3 shadow-[var(--sombra-card)]"
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: `${c.color}1f`, color: c.color }}
            >
              <IconeCategoria nome={c.icon} className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1 text-sm font-semibold">{c.name}</span>
            <span className="text-xs font-semibold text-nevoa-fraca">
              {c.type === "income" ? "Ganho" : "Gasto"}
            </span>
            <button
              type="button"
              onClick={() => apagar(c.id)}
              disabled={apagando === c.id}
              className="text-sm font-bold text-saiu transition active:scale-95 disabled:opacity-50"
            >
              {apagando === c.id ? "…" : "Apagar"}
            </button>
          </div>
        ))
      )}
    </section>
  );
}
