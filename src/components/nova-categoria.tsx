"use client";

import { useEffect, useState } from "react";
import { criarCategoria } from "@/lib/actions";
import { CORES_CATEGORIA, ICONES_CATEGORIA } from "@/lib/categorias";
import { IconeCategoria } from "./icone-categoria";

export type Categoria = {
  id: string;
  name: string;
  type: "expense" | "income";
  icon: string;
  color: string;
};

// Folha pra criar uma categoria própria: nome + ícone (do catálogo) + cor (da
// paleta). O tipo (gasto/ganho) vem do form, então a nova categoria já nasce
// no lado certo. Quem valida de verdade é a action; aqui é só conforto.
export function NovaCategoria({
  tipo,
  onCriada,
  onFechar,
}: {
  tipo: "expense" | "income";
  onCriada: (c: Categoria) => void;
  onFechar: () => void;
}) {
  const [nome, setNome] = useState("");
  const [icon, setIcon] = useState<string>(ICONES_CATEGORIA[0]);
  const [color, setColor] = useState<string>(CORES_CATEGORIA[0]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFechar();
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar]);

  async function criar() {
    const limpo = nome.trim();
    if (!limpo) {
      setErro("Dê um nome à categoria.");
      return;
    }
    setErro(null);
    setSalvando(true);
    const res = await criarCategoria({ name: limpo, type: tipo, icon, color });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    onCriada(res.categoria);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-nevoa/40 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nova categoria"
      onClick={onFechar}
    >
      <div
        className="w-full max-w-sm rounded-t-3xl border border-linha bg-carvao p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-[var(--sombra-card)] sm:rounded-3xl sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <p className="font-display text-lg font-bold">Nova categoria</p>
          <button
            type="button"
            onClick={onFechar}
            className="text-sm font-semibold text-nevoa-fraca transition hover:text-nevoa"
          >
            Fechar
          </button>
        </div>

        <div className="mb-5 flex items-center gap-3">
          <span
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
            style={{ backgroundColor: `${color}1f`, color }}
          >
            <IconeCategoria nome={icon} className="h-6 w-6" />
          </span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={24}
            placeholder={tipo === "income" ? "Ex.: Freela" : "Ex.: Farmácia"}
            className="h-12 flex-1 rounded-xl border border-linha bg-breu px-4 outline-none transition placeholder:text-nevoa-fraca focus:border-verde focus:ring-4 focus:ring-verde/20"
          />
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-nevoa-fraca">Ícone</p>
        <div className="mb-5 grid grid-cols-6 gap-2">
          {ICONES_CATEGORIA.map((nomeIcone) => {
            const ativo = nomeIcone === icon;
            return (
              <button
                key={nomeIcone}
                type="button"
                onClick={() => setIcon(nomeIcone)}
                aria-label={nomeIcone}
                aria-pressed={ativo}
                className={`flex aspect-square items-center justify-center rounded-xl border transition ${
                  ativo ? "border-transparent" : "border-linha text-nevoa-fraca hover:text-nevoa"
                }`}
                style={ativo ? { backgroundColor: `${color}1f`, color } : undefined}
              >
                <IconeCategoria nome={nomeIcone} className="h-[18px] w-[18px]" />
              </button>
            );
          })}
        </div>

        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-nevoa-fraca">Cor</p>
        <div className="mb-6 flex flex-wrap gap-3">
          {CORES_CATEGORIA.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(c)}
              aria-label={`Cor ${c}`}
              aria-pressed={c === color}
              className="h-8 w-8 rounded-full transition active:scale-90"
              style={{
                backgroundColor: c,
                boxShadow: c === color ? `0 0 0 2px var(--carvao), 0 0 0 4px ${c}` : undefined,
              }}
            />
          ))}
        </div>

        {erro && <p className="mb-3 text-sm font-semibold text-saiu">{erro}</p>}

        <button
          type="button"
          onClick={criar}
          disabled={salvando}
          className="flex h-12 w-full items-center justify-center rounded-xl bg-verde font-display font-bold text-tinta transition hover:bg-verde-forte active:scale-[.98] disabled:opacity-60"
        >
          {salvando ? "Criando…" : "Criar categoria"}
        </button>
      </div>
    </div>
  );
}
