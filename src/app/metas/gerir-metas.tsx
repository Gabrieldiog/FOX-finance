"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatBRL } from "@/lib/format";
import { definirMeta, removerMeta } from "@/lib/actions";
import { IconeCategoria } from "@/components/icone-categoria";

type Cat = { id: string; name: string; icon: string; color: string };
type Meta = {
  categoryId: string;
  name: string;
  icon: string;
  color: string;
  limitCents: number;
  gastoCents: number;
};

// Cor da barra pelo quanto já foi consumido: tranquilo → atenção → estourou.
function corProgresso(pct: number) {
  if (pct > 1) return "var(--color-alerta)";
  if (pct > 0.8) return "var(--color-brasa)";
  return "var(--color-brilho)";
}

export function GerirMetas({ categorias, metas }: { categorias: Cat[]; metas: Meta[] }) {
  const router = useRouter();
  const [sel, setSel] = useState<string | null>(null);
  const [cents, setCents] = useState(0);
  const [salvando, setSalvando] = useState(false);
  const [removendo, setRemovendo] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const metaDe = new Map(metas.map((m) => [m.categoryId, m]));

  function escolher(id: string) {
    setErro(null);
    if (sel === id) {
      setSel(null);
      return;
    }
    setSel(id);
    setCents(metaDe.get(id)?.limitCents ?? 0);
  }

  async function salvar() {
    if (!sel) return;
    if (cents <= 0) {
      setErro("Digite um valor.");
      return;
    }
    setErro(null);
    setSalvando(true);
    const res = await definirMeta({ categoryId: sel, limitCents: cents });
    setSalvando(false);
    if (!res.ok) {
      setErro(res.erro);
      return;
    }
    setSel(null);
    setCents(0);
    router.refresh();
  }

  async function remover(categoryId: string) {
    setRemovendo(categoryId);
    const res = await removerMeta(categoryId);
    setRemovendo(null);
    if (res.ok) router.refresh();
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">Suas metas</p>
        {metas.length === 0 ? (
          <p className="text-sm text-sage">
            Você ainda não definiu metas. Escolha uma categoria abaixo e diga o teto do mês.
          </p>
        ) : (
          metas.map((m) => {
            const pct = m.limitCents > 0 ? m.gastoCents / m.limitCents : 0;
            const estourou = pct > 1;
            return (
              <div key={m.categoryId} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${m.color}1f`, color: m.color }}
                  >
                    <IconeCategoria nome={m.icon} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1 text-sm font-medium text-creme">{m.name}</span>
                  <span className="font-serif text-sm tnum text-sage">
                    {formatBRL(m.gastoCents)} <span className="text-sage/60">/ {formatBRL(m.limitCents)}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => remover(m.categoryId)}
                    disabled={removendo === m.categoryId}
                    aria-label={`Remover meta de ${m.name}`}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-lg leading-none text-sage transition hover:text-alerta disabled:opacity-50"
                  >
                    ×
                  </button>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-pauta">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, pct * 100)}%`, backgroundColor: corProgresso(pct) }}
                  />
                </div>
                {estourou && (
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.1em] text-alerta">
                    passou {formatBRL(m.gastoCents - m.limitCents)}
                  </p>
                )}
              </div>
            );
          })
        )}
      </section>

      <section className="flex flex-col gap-3">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.16em] text-sage">Definir meta</p>
        <div className="flex flex-wrap gap-2">
          {categorias.map((c) => {
            const on = sel === c.id;
            const temMeta = metaDe.has(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => escolher(c.id)}
                className={`flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium transition ${on ? "border-brilho bg-brilho/10 text-creme" : "border-pauta text-sage"}`}
              >
                <span
                  className="flex h-5 w-5 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${c.color}1f`, color: c.color }}
                >
                  <IconeCategoria nome={c.icon} className="h-3.5 w-3.5" />
                </span>
                {c.name}
                {temMeta && <span className="h-1.5 w-1.5 rounded-full bg-brilho" />}
              </button>
            );
          })}
        </div>

        {sel && (
          <div className="flex flex-col gap-3 rounded-2xl border border-pauta bg-feltro-alto p-5">
            <p className="font-mono text-[0.62rem] uppercase tracking-[0.14em] text-sage">
              Teto do mês
            </p>
            <input
              autoFocus
              inputMode="numeric"
              aria-label="Limite mensal"
              value={formatBRL(cents)}
              onChange={(e) => setCents(Number(e.target.value.replace(/\D/g, "") || "0"))}
              className={`w-full bg-transparent text-center font-serif text-4xl font-semibold text-creme outline-none tnum ${cents === 0 ? "opacity-40" : ""}`}
            />
            {erro && <p className="text-center text-sm font-medium text-alerta">{erro}</p>}
            <button
              type="button"
              onClick={salvar}
              disabled={salvando}
              className="flex h-12 items-center justify-center rounded-xl bg-brilho font-serif text-lg font-semibold text-feltro transition active:scale-[.98] disabled:opacity-60"
            >
              {salvando ? "Salvando…" : metaDe.has(sel) ? "Atualizar meta" : "Salvar meta"}
            </button>
          </div>
        )}
      </section>
    </>
  );
}
